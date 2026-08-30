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

    this.lastHz = 0;
    this.lastClarity = 0;
    this.lastMidi = 0;
    this.lastTargetMidi = 0;
    this.lastRms = 0;
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

    for (let i = 0; i < n; i++) {
      const x = input[i];
      ring[this.w & mask] = x;
      this.w++;
      rmsAcc += x * x;

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
          const target = this.snapMidi(midi);
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

      // -- dual-tap grain player --
      let p = this.phase + (1 - this.ratio) / grain;
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
      output[i] = this.shHeld;
    }

    this.lastRms = Math.sqrt(rmsAcc / n);
    return ranDetect;
  }
}
