/**
 * The entire voice effect, per-sample: pitch detection, semitone snapping,
 * grain-based pitch shifting, dry/wet mix and bitcrushing.
 *
 * HARD CONSTRAINT: this class imports nothing and references nothing outside
 * itself. It is serialised with `HardtuneKernel.toString()` and evaluated
 * inside an AudioWorklet (see lib/audio/graph.ts), where module scope does not
 * exist. The same class is instantiated directly in Node by
 * scripts/hardtune-eval.ts, which is what keeps the DSP testable without a
 * browser or a microphone.
 *
 * Pitch detection is McLeod/NSDF, ported from StrumLab's lib/listen/pitch.ts.
 * Plain autocorrelation locks onto the octave below because its peaks grow
 * with amplitude; NSDF normalises each lag by the energy actually overlapping
 * there, which flattens that bias out. The one change from StrumLab: input is
 * decimated x2 before analysis. Voice pitch lives under 1 kHz, so a 12 kHz
 * Nyquist loses nothing, and it cuts the O(n * maxLag) cost by 4 - the
 * difference between fitting in a worklet render quantum and not.
 *
 * The shifter is a dual-tap crossfaded delay line (the classic "Doppler
 * wheel" harmonizer): two read taps sweep a grain window of the ring buffer
 * at a rate that differs from the write rate by the pitch ratio, each faded
 * out at the moment it wraps. Its warble and transient smear are not flaws
 * here - they ARE the lo-fi robotic aesthetic. TD-PSOLA would be cleaner and
 * is the documented v2 upgrade.
 */
export class HardtuneKernel {
  // -- configuration --
  sr: number;
  dryWet: number;
  bits: number;
  downsampleFactor: number;
  scaleMask: number[];
  glideMs: number;
  glideK: number;
  relaxK: number;

  // -- ring buffer --
  ring: Float32Array;
  mask: number;
  w: number;

  // -- grain player --
  grain: number;
  dryDelay: number;
  phase: number;
  ratio: number;
  targetRatio: number;

  // -- noise gate + room-noise learning --
  gateThreshold: number;
  gateEnv: number;
  gateGain: number;
  gateOpen: boolean;
  gateAttackK: number;
  gateEnvRelK: number;
  gateOpenK: number;
  gateCloseK: number;
  denoise: number;
  noiseFloor: number;
  floorUpK: number;
  floorDownK: number;

  // -- transposition --
  semitoneShift: number;

  // -- spectral noise print (STFT) --
  nrFrame: number;
  nrHop: number;
  nrBins: number;
  nrWindow: Float32Array;
  nrIn: Float32Array;
  nrHopBuf: Float32Array;
  nrReady: Float32Array;
  nrOut: Float32Array;
  nrHopFill: number;
  nrRe: Float32Array;
  nrIm: Float32Array;
  nrCos: Float32Array;
  nrSin: Float32Array;
  nrRev: Int32Array;
  /** Per-bin magnitude of the room, measured while learning. */
  nrProfile: Float32Array;
  nrAccum: Float32Array;
  nrLearnFrames: number;
  nrLearnTarget: number;
  /** 0 disables the whole stage; the STFT is then bypassed entirely. */
  nrAmount: number;
  hasNoiseProfile: boolean;

  // -- warble (pitch LFO) --
  warbleHz: number;
  warbleCents: number;
  warblePhase: number;

  // -- bitcrusher --
  shCount: number;
  shHeld: number;

  // -- pitch detection --
  detWindow: number;
  detBuf: Float32Array;
  nsdf: Float32Array;
  peaks: Int32Array;
  minLag: number;
  maxLag: number;
  detHop: number;
  sinceDetect: number;
  holdSamples: number;
  sinceVoiced: number;
  voiced: boolean;

  // -- telemetry (read after process(); hz/midi are 0 when unvoiced) --
  lastHz: number;
  lastClarity: number;
  lastMidi: number;
  lastTargetMidi: number;
  lastRms: number;
  /** 0..1 while measuring the room, 1 when idle. */
  lastLearnProgress: number;

  constructor(sampleRate: number) {
    this.sr = sampleRate;

    this.dryWet = 1;
    this.bits = 16;
    this.downsampleFactor = 1;
    this.scaleMask = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    this.glideMs = 0;
    this.glideK = 1;
    this.relaxK = 1;
    this.setGlide(0);

    // ~170 ms at 48 kHz - covers the grain, the detection window and a guard.
    this.ring = new Float32Array(8192);
    this.mask = this.ring.length - 1;
    this.w = 0;

    this.grain = Math.round(0.033 * sampleRate);
    // The dry tap sits at the shifter's mean delay so that dry and wet stay
    // latency-matched - mixing them must not comb-filter.
    this.dryDelay = 4 + this.grain / 2;
    this.phase = 0;
    this.ratio = 1;
    this.targetRatio = 1;

    // Downward gate ahead of the ring buffer, so room noise neither reaches
    // the output nor confuses the pitch detector. 0 = off. Hysteresis (close
    // at half the open threshold) stops it chattering on breathy tails.
    this.gateThreshold = 0;
    this.gateEnv = 0;
    this.gateGain = 1;
    this.gateOpen = true;
    this.gateAttackK = 1 - Math.exp(-1 / (0.003 * sampleRate));
    this.gateEnvRelK = 1 - Math.exp(-1 / (0.08 * sampleRate));
    this.gateOpenK = 1 - Math.exp(-1 / (0.004 * sampleRate));
    this.gateCloseK = 1 - Math.exp(-1 / (0.12 * sampleRate));

    // Room-noise learning. The floor creeps UP slowly (2 s) and drops fast
    // (150 ms): a fan that switches on is learned within seconds, but a held
    // note can never drag the floor up to swallow the voice.
    this.denoise = 0;
    this.noiseFloor = 0;
    this.floorUpK = 1 - Math.exp(-1 / (2 * sampleRate));
    this.floorDownK = 1 - Math.exp(-1 / (0.15 * sampleRate));

    this.semitoneShift = 0;

    // Pitch LFO on the playback ratio - vibrato at small depths, a broken
    // tape warble at large ones.
    this.warbleHz = 0;
    this.warbleCents = 0;
    this.warblePhase = 0;

    this.shCount = 0;
    this.shHeld = 0;

    // Analysis runs on x2-decimated input: window of 1024 decimated samples
    // (~43 ms), voice range 70-1000 Hz against the 12 kHz decimated rate.
    this.detWindow = 1024;
    this.detBuf = new Float32Array(this.detWindow);
    const decRate = sampleRate / 2;
    this.minLag = Math.max(2, Math.floor(decRate / 1000));
    this.maxLag = Math.min(this.detWindow - 1, Math.floor(decRate / 70));
    this.nsdf = new Float32Array(this.maxLag + 1);
    this.peaks = new Int32Array(256);
    this.detHop = 512; // input samples between detections (~10.7 ms)
    this.sinceDetect = 0;
    // Consonants at note-ends stay pitched (the T-Pain sound): hold the last
    // ratio through unvoiced stretches before relaxing to unity.
    this.holdSamples = Math.round(0.2 * sampleRate);
    this.sinceVoiced = this.holdSamples;
    this.voiced = false;

    /**
     * STFT for the noise print. 512/128 is 4x overlap: enough frequency
     * resolution (~94 Hz bins at 48k) to tell a fan from a vowel, while the
     * hop matches the render quantum so a frame boundary never falls inside
     * a block. Costs ~11 ms of extra latency, which is why the stage is
     * bypassed outright when the amount is 0.
     */
    this.nrFrame = 512;
    this.nrHop = 128;
    this.nrBins = this.nrFrame / 2 + 1;
    this.nrWindow = new Float32Array(this.nrFrame);
    for (let i = 0; i < this.nrFrame; i++) {
      // Periodic Hann. Applied on BOTH analysis and synthesis, so the squared
      // window sums to a constant 1.5 at 4x overlap - that constant is the
      // normalisation below, and getting it wrong makes the output pump.
      this.nrWindow[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / this.nrFrame);
    }
    this.nrIn = new Float32Array(this.nrFrame);
    this.nrHopBuf = new Float32Array(this.nrHop);
    this.nrReady = new Float32Array(this.nrHop);
    this.nrOut = new Float32Array(this.nrFrame);
    this.nrHopFill = 0;
    this.nrRe = new Float32Array(this.nrFrame);
    this.nrIm = new Float32Array(this.nrFrame);
    this.nrCos = new Float32Array(this.nrFrame / 2);
    this.nrSin = new Float32Array(this.nrFrame / 2);
    for (let i = 0; i < this.nrFrame / 2; i++) {
      this.nrCos[i] = Math.cos((-2 * Math.PI * i) / this.nrFrame);
      this.nrSin[i] = Math.sin((-2 * Math.PI * i) / this.nrFrame);
    }
    this.nrRev = new Int32Array(this.nrFrame);
    let bits = 0;
    while (1 << bits < this.nrFrame) bits++;
    for (let i = 0; i < this.nrFrame; i++) {
      let r = 0;
      for (let b = 0; b < bits; b++) if (i & (1 << b)) r |= 1 << (bits - 1 - b);
      this.nrRev[i] = r;
    }
    this.nrProfile = new Float32Array(this.nrBins);
    this.nrAccum = new Float32Array(this.nrBins);
    this.nrLearnFrames = 0;
    this.nrLearnTarget = 0;
    this.nrAmount = 0;
    this.hasNoiseProfile = false;

    this.lastHz = 0;
    this.lastClarity = 0;
    this.lastMidi = 0;
    this.lastTargetMidi = 0;
    this.lastRms = 0;
    this.lastLearnProgress = 1;
  }

  setGlide(ms: number): void {
    if (ms === this.glideMs && this.glideK !== 1) return;
    this.glideMs = ms;
    // One-pole per-sample smoothing toward the target ratio. The 2 ms floor
    // kills discontinuity clicks without softening the robotic snap.
    const tau = Math.max(0.002, ms / 1000);
    this.glideK = 1 - Math.exp(-1 / (tau * this.sr));
    this.relaxK = 1 - Math.exp(-1 / (0.05 * this.sr));
  }

  setScaleMask(maskBits: number[]): void {
    for (let i = 0; i < 12; i++) this.scaleMask[i] = maskBits[i] ? 1 : 0;
  }

  setCrush(bits: number, downsampleFactor: number): void {
    this.bits = Math.min(16, Math.max(4, Math.round(bits)));
    this.downsampleFactor = Math.min(16, Math.max(1, Math.round(downsampleFactor)));
  }

  /** Linear amplitude threshold; 0 disables the gate. */
  setGate(threshold: number): void {
    this.gateThreshold = Math.max(0, threshold);
    if (this.gateThreshold === 0) {
      this.gateOpen = true;
      this.gateGain = 1;
    }
  }

  setWarble(hz: number, cents: number): void {
    this.warbleHz = Math.min(12, Math.max(0, hz));
    this.warbleCents = Math.min(100, Math.max(0, cents));
  }

  /**
   * How hard to work at telling the voice from the room. 0 = plain threshold
   * gate only. Above 0 the gate also learns the room floor and demands
   * periodicity to open - see the formula in process().
   */
  setDenoise(strength: number): void {
    this.denoise = Math.min(1, Math.max(0, strength));
  }

  /**
   * Start measuring the room. Call while the user is SILENT: every frame
   * captured during the window is averaged into the per-bin profile, so any
   * speech that sneaks in gets subtracted from the voice later.
   */
  learnNoise(seconds: number): void {
    for (let i = 0; i < this.nrBins; i++) this.nrAccum[i] = 0;
    this.nrLearnFrames = 0;
    this.nrLearnTarget = Math.max(1, Math.round((seconds * this.sr) / this.nrHop));
    this.hasNoiseProfile = false;
  }

  /** How much of the measured room to remove. 0 bypasses the STFT entirely. */
  setNoiseReduction(amount: number): void {
    this.nrAmount = Math.min(1, Math.max(0, amount));
  }

  /** Discard the print; the room stage goes inert until a new one is taken. */
  clearNoiseProfile(): void {
    this.hasNoiseProfile = false;
    this.nrLearnTarget = 0;
    for (let i = 0; i < this.nrBins; i++) this.nrProfile[i] = 0;
  }

  /** In-place iterative radix-2 FFT. sign -1 forward, +1 inverse. */
  fft(re: Float32Array, im: Float32Array, sign: number): void {
    const n = this.nrFrame;
    const rev = this.nrRev;
    for (let i = 0; i < n; i++) {
      const j = rev[i];
      if (j > i) {
        let t = re[i]; re[i] = re[j]; re[j] = t;
        t = im[i]; im[i] = im[j]; im[j] = t;
      }
    }
    for (let size = 2; size <= n; size <<= 1) {
      const half = size >> 1;
      const step = n / size;
      for (let i = 0; i < n; i += size) {
        for (let j = i, k = 0; j < i + half; j++, k += step) {
          const c = this.nrCos[k];
          const sgn = sign * this.nrSin[k];
          const tr = re[j + half] * c - im[j + half] * sgn;
          const ti = re[j + half] * sgn + im[j + half] * c;
          re[j + half] = re[j] - tr;
          im[j + half] = im[j] - ti;
          re[j] += tr;
          im[j] += ti;
        }
      }
    }
  }

  /**
   * One STFT hop: window, transform, subtract the room, transform back,
   * overlap-add. Called once per nrHop input samples.
   */
  nrProcessFrame(): void {
    const N = this.nrFrame;
    const H = this.nrHop;

    this.nrIn.copyWithin(0, H);
    this.nrIn.set(this.nrHopBuf, N - H);

    for (let i = 0; i < N; i++) {
      this.nrRe[i] = this.nrIn[i] * this.nrWindow[i];
      this.nrIm[i] = 0;
    }
    this.fft(this.nrRe, this.nrIm, -1);

    if (this.nrLearnFrames < this.nrLearnTarget) {
      for (let b = 0; b < this.nrBins; b++) {
        this.nrAccum[b] += Math.sqrt(this.nrRe[b] * this.nrRe[b] + this.nrIm[b] * this.nrIm[b]);
      }
      if (++this.nrLearnFrames >= this.nrLearnTarget) {
        for (let b = 0; b < this.nrBins; b++) this.nrProfile[b] = this.nrAccum[b] / this.nrLearnTarget;
        this.hasNoiseProfile = true;
      }
    } else if (this.hasNoiseProfile && this.nrAmount > 0) {
      // Over-subtract (alpha > 1) because a mean underestimates the peaks,
      // but keep a spectral floor: driving a bin to zero is what produces
      // "musical noise", the burbling of isolated surviving bins.
      const alpha = 1 + 2 * this.nrAmount;
      const floor = 0.06 + 0.14 * (1 - this.nrAmount);
      for (let b = 0; b < this.nrBins; b++) {
        const re = this.nrRe[b];
        const im = this.nrIm[b];
        const mag = Math.sqrt(re * re + im * im);
        if (mag < 1e-12) continue;
        const keep = Math.max(mag - alpha * this.nrProfile[b], floor * mag) / mag;
        this.nrRe[b] = re * keep;
        this.nrIm[b] = im * keep;
        // Mirror the change onto the conjugate half so the inverse stays real.
        if (b > 0 && b < N - b) {
          this.nrRe[N - b] = this.nrRe[b];
          this.nrIm[N - b] = -this.nrIm[b];
        }
      }
    }

    this.fft(this.nrRe, this.nrIm, 1);

    // 1/N from the inverse, /1.5 for the summed squared Hann at 4x overlap.
    const norm = 1 / (N * 1.5);
    for (let i = 0; i < N; i++) this.nrOut[i] += this.nrRe[i] * this.nrWindow[i] * norm;

    this.nrReady.set(this.nrOut.subarray(0, H));
    this.nrOut.copyWithin(0, H);
    this.nrOut.fill(0, N - H);
  }

  /** Transpose the snapped target, in semitones. Negative = lower voice. */
  setSemitoneShift(n: number): void {
    this.semitoneShift = Math.max(-12, Math.min(12, Math.round(n)));
  }

  /**
   * NSDF over the decimated detection buffer. Returns clarity in [0,1] and
   * leaves the detected frequency in lastHz (0 when nothing usable).
   */
  detect(): number {
    const buf = this.detBuf;
    const n = this.detWindow;
    const need = n * 2;
    if (this.w < need) return 0;

    // Decimate the newest `need` input samples straight out of the ring.
    const start = this.w - need;
    const mask = this.mask;
    const ring = this.ring;
    let power = 0;
    for (let i = 0; i < n; i++) {
      const v = 0.5 * (ring[(start + 2 * i) & mask] + ring[(start + 2 * i + 1) & mask]);
      buf[i] = v;
      power += v * v;
    }
    if (power / n < 1e-7) return 0; // silence - skip the real work

    const nsdf = this.nsdf;
    const minLag = this.minLag;
    const maxLag = this.maxLag;
    for (let lag = minLag; lag <= maxLag; lag++) {
      let acf = 0;
      let energy = 0;
      for (let i = 0; i < n - lag; i++) {
        acf += buf[i] * buf[i + lag];
        energy += buf[i] * buf[i] + buf[i + lag] * buf[i + lag];
      }
      nsdf[lag] = energy > 0 ? (2 * acf) / energy : 0;
    }

    // Local max of each positive-going run; then the FIRST peak clearing
    // 0.9 x the tallest, not the tallest itself - taking the tallest is what
    // makes naive implementations report the octave below.
    const peaks = this.peaks;
    let peakCount = 0;
    let lag = minLag;
    while (lag < maxLag && nsdf[lag] > 0) lag++; // skip the run at lag 0
    while (lag < maxLag) {
      if (nsdf[lag] > 0 && nsdf[lag] >= nsdf[lag - 1]) {
        let best = lag;
        while (lag < maxLag && nsdf[lag] > 0) {
          if (nsdf[lag] > nsdf[best]) best = lag;
          lag++;
        }
        if (peakCount < peaks.length) peaks[peakCount++] = best;
      }
      lag++;
    }
    if (peakCount === 0) return 0;

    let highest = 0;
    for (let i = 0; i < peakCount; i++) if (nsdf[peaks[i]] > highest) highest = nsdf[peaks[i]];
    const threshold = highest * 0.9;
    let chosen = -1;
    for (let i = 0; i < peakCount; i++) {
      if (nsdf[peaks[i]] >= threshold) { chosen = peaks[i]; break; }
    }
    if (chosen < 0) return 0;

    // Parabolic interpolation for sub-sample lag resolution.
    const y0 = chosen > 0 ? nsdf[chosen - 1] : nsdf[chosen];
    const y1 = nsdf[chosen];
    const y2 = chosen < maxLag ? nsdf[chosen + 1] : nsdf[chosen];
    const denom = 2 * (2 * y1 - y0 - y2);
    const shift = denom !== 0 ? (y2 - y0) / denom : 0;
    const refined = chosen + shift;

    const hz = (this.sr / 2) / refined;
    if (!(hz >= 70 && hz <= 1000)) return 0;
    this.lastHz = hz;
    return Math.min(1, y1);
  }

  /** Nearest scale-allowed midi note to a fractional midi value. */
  snapMidi(midi: number): number {
    const base = Math.round(midi);
    for (let d = 0; d <= 6; d++) {
      const down = base - d;
      const up = base + d;
      // Of the two candidates at distance d, try the truly nearer one first.
      const first = Math.abs(down - midi) <= Math.abs(up - midi) ? down : up;
      const second = first === down ? up : down;
      if (this.scaleMask[((first % 12) + 12) % 12]) return first;
      if (d > 0 && this.scaleMask[((second % 12) + 12) % 12]) return second;
    }
    return base; // unreachable with any non-empty mask
  }

  /**
   * Process one block. Input and output may alias. Returns true when a pitch
   * detection ran during this block (the wrapper uses it to pace telemetry).
   */
  process(input: Float32Array, output: Float32Array): boolean {
    const n = input.length;
    const ring = this.ring;
    const mask = this.mask;
    const grain = this.grain;
    const quant = Math.pow(2, this.bits - 1);
    let ranDetect = false;
    let rmsAcc = 0;
    // Hoisted out of the loop: a per-sample branch on three fields is real
    // cost in a worklet, and this cannot change mid-block.
    const nrActive = this.nrAmount > 0 || this.nrLearnFrames < this.nrLearnTarget;

    for (let i = 0; i < n; i++) {
      const raw = input[i];
      // The meter reads the RAW input, so the level bar keeps moving while
      // the room is being subtracted - heavy reduction should not look like
      // a dead microphone.
      rmsAcc += raw * raw;

      // -- spectral noise print, ahead of everything else --
      //
      // Unlike the gate below, this may safely precede the ring. It subtracts
      // a FIXED measured spectrum rather than reacting to the detector, so
      // there is no loop to deadlock; and handing the detector a cleaner
      // signal makes it MORE confident, not less.
      //
      // Emits the hop computed last time while collecting this one. Switching
      // the stage on mid-signal costs one hop (~2.7 ms) of silence while the
      // pipeline primes, which is why it is bypassed rather than left idling.
      let x = raw;
      if (nrActive) {
        this.nrHopBuf[this.nrHopFill] = raw;
        x = this.nrReady[this.nrHopFill];
        this.nrHopFill++;
        if (this.nrHopFill === this.nrHop) {
          this.nrHopFill = 0;
          this.nrProcessFrame();
        }
      }

      // The ring gets the (de-noised) input, and the gate is applied to the output
      // instead. That ordering is load-bearing: the gate below asks the pitch
      // detector how periodic the signal is, and the detector reads the ring.
      // Gate the ring and a shut gate feeds it silence -> clarity 0 -> the
      // gate can never satisfy its own condition to reopen. Room noise
      // reaching the detector is harmless, because acquiring a note needs
      // clarity 0.6 and noise scores far below that.
      ring[this.w & mask] = x;
      this.w++;

      // -- noise gate --
      //
      // Two signals decide "voice or room?", because level alone cannot:
      // a laptop fan and a quiet vowel can sit at the same dB.
      //
      //   1. LEVEL vs a learned floor. While the gate is shut, whatever is
      //      arriving IS the room, so the floor tracks it; the open threshold
      //      becomes max(user threshold, floor x (1 + 6*denoise)). A noisy
      //      room raises its own bar without the user touching anything.
      //   2. PERIODICITY. A voice is periodic and scores high NSDF clarity;
      //      fans, hiss and traffic are aperiodic and score near zero. The
      //      detector already computes this, so it costs nothing here.
      //
      // Clarity is required to OPEN but never to STAY open - unvoiced
      // consonants (s, t, k) have almost no periodicity, and demanding it
      // continuously would bite the front off every word.
      if (this.gateThreshold > 0 || this.denoise > 0) {
        const a = x < 0 ? -x : x;
        this.gateEnv += (a - this.gateEnv) * (a > this.gateEnv ? this.gateAttackK : this.gateEnvRelK);

        if (!this.gateOpen) {
          this.noiseFloor +=
            (this.gateEnv - this.noiseFloor) * (this.gateEnv > this.noiseFloor ? this.floorUpK : this.floorDownK);
        }

        const openAt = Math.max(this.gateThreshold, this.noiseFloor * (1 + 6 * this.denoise));
        if (this.gateOpen) {
          if (this.gateEnv < openAt * 0.5) this.gateOpen = false;
        } else if (this.gateEnv > openAt && this.lastClarity >= 0.45 * this.denoise) {
          this.gateOpen = true;
        }

        this.gateGain += ((this.gateOpen ? 1 : 0) - this.gateGain) * (this.gateOpen ? this.gateOpenK : this.gateCloseK);
      } else {
        this.gateGain = 1;
      }

      // -- detection cadence --
      if (++this.sinceDetect >= this.detHop) {
        this.sinceDetect = 0;
        ranDetect = true;
        const clarity = this.detect();
        this.lastClarity = clarity;
        // Acquire strictly, hold loosely: a voice loses periodicity long
        // before it stops being audible.
        if (clarity >= (this.voiced ? 0.45 : 0.6)) {
          this.voiced = true;
          this.sinceVoiced = 0;
          const midi = 69 + 12 * (Math.log(this.lastHz / 440) / Math.LN2);
          const target = this.snapMidi(midi) + this.semitoneShift;
          this.lastMidi = midi;
          this.lastTargetMidi = target;
          let r = Math.pow(2, (target - midi) / 12);
          if (r < 0.5) r = 0.5;
          else if (r > 2) r = 2;
          this.targetRatio = r;
        } else {
          this.lastHz = 0;
          this.lastMidi = 0;
        }
      }

      // -- hold-then-relax through unvoiced stretches --
      if (this.voiced && this.sinceVoiced < this.holdSamples) {
        this.sinceVoiced++;
        if (this.sinceVoiced >= this.holdSamples) {
          this.voiced = false;
          this.targetRatio = 1;
          this.lastTargetMidi = 0;
        }
      }

      // -- ratio smoothing (never bypass the grain player: a delay jump clicks) --
      this.ratio += (this.targetRatio - this.ratio) * (this.voiced ? this.glideK : this.relaxK);

      // -- warble: LFO on the playback ratio --
      let rEff = this.ratio;
      if (this.warbleCents > 0 && this.warbleHz > 0) {
        this.warblePhase += this.warbleHz / this.sr;
        if (this.warblePhase >= 1) this.warblePhase -= 1;
        rEff *= Math.pow(2, (this.warbleCents * Math.sin(6.283185307179586 * this.warblePhase)) / 1200);
      }

      // -- dual-tap grain player --
      let p = this.phase + (1 - rEff) / grain;
      p -= Math.floor(p);
      this.phase = p;
      const p2 = p >= 0.5 ? p - 0.5 : p + 0.5;

      // 4-sample guard so a shrinking delay at ratio > 1 never reads past w.
      const rp1 = this.w - (4 + p * grain);
      const rp2 = this.w - (4 + p2 * grain);
      const i1 = Math.floor(rp1);
      const f1 = rp1 - i1;
      const t1 = ring[i1 & mask] * (1 - f1) + ring[(i1 + 1) & mask] * f1;
      const i2 = Math.floor(rp2);
      const f2 = rp2 - i2;
      const t2 = ring[i2 & mask] * (1 - f2) + ring[(i2 + 1) & mask] * f2;

      // sin^2/cos^2 fades sum to one and are zero exactly where each tap wraps.
      const s = Math.sin(Math.PI * p);
      const g1 = s * s;
      const wet = g1 * t1 + (1 - g1) * t2;

      const rpd = this.w - this.dryDelay;
      const id = Math.floor(rpd);
      const fd = rpd - id;
      const dry = ring[id & mask] * (1 - fd) + ring[(id + 1) & mask] * fd;

      const mixed = this.dryWet * wet + (1 - this.dryWet) * dry;

      // -- bitcrusher: sample-and-hold, then quantize --
      if (--this.shCount <= 0) {
        this.shCount = this.downsampleFactor;
        this.shHeld = Math.round(mixed * quant) / quant;
      }
      output[i] = this.shHeld * this.gateGain;
    }

    this.lastRms = Math.sqrt(rmsAcc / n);
    this.lastLearnProgress =
      this.nrLearnTarget > 0 && this.nrLearnFrames < this.nrLearnTarget
        ? this.nrLearnFrames / this.nrLearnTarget
        : 1;
    return ranDetect;
  }
}
