/**
 * The ONLY file that touches Web Audio. Owns the context, the microphone,
 * the worklet and the whole node chain; everything above talks to the
 * VoiceGraph handle it returns.
 *
 * Chain: mic source -> hardtune worklet -> waveshaper -> highpass -> lowpass
 *        -> limiter -> master gain -> destination
 *                                  |-> analyser (readout tap)
 *                                  |-> MediaStreamDestination (recorder tap)
 *
 * The worklet's processor source is assembled at runtime from
 * HardtuneKernel.toString() and loaded through a Blob URL - StrumLab's
 * mic.ts pattern, scaled up from a tap to the actual effect. That keeps the
 * kernel a normal, unit-testable TypeScript module with no bundler asset
 * paths involved. If a future toolchain mangles the serialised class, the
 * documented fallback is to ship the compiled kernel as
 * public/hardtune-worklet.js and addModule() that instead.
 *
 * Mic constraints are copied from StrumLab: every browser "enhancement" is
 * switched off - in headphones mode. Echo cancellation would try to subtract
 * the monitored output from the input and can audibly duck the voice.
 *
 * Speaker mode flips exactly one of them back ON: with open speakers the
 * loop voice -> speakers -> mic -> effect -> speakers howls within a second,
 * and the browser's AEC (which uses the page's own output as its far-end
 * reference) is what breaks that loop. The trade-off is real - the AEC may
 * warble or duck the robot voice, since a pitch-shifted copy of the mic is
 * precisely the kind of correlated signal it exists to remove - so the UI
 * sells headphones as the good mode and speakers as the workable one.
 */

import { HardtuneKernel } from "@/lib/dsp/hardtuneKernel";
import type { ResolvedParams } from "./voices";

export type MicErrorKind = "denied" | "unavailable" | "insecure" | "unknown";

export class MicError extends Error {
  kind: MicErrorKind;
  constructor(kind: MicErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

export interface Telemetry {
  hz: number;
  clarity: number;
  midi: number;
  targetMidi: number;
  rms: number;
}

/**
 * Everything the graph can be told. Produced by resolveParams() in voices.ts,
 * which is where the voice + macro-slider maths lives; this file only applies
 * numbers to nodes.
 */
export type AdvancedParams = ResolvedParams;

export interface VoiceGraph {
  context: AudioContext;
  analyser: AnalyserNode;
  /** Post-limiter feed for MediaRecorder. */
  recorderStream: MediaStream;
  setParams(params: Partial<AdvancedParams>): void;
  setScaleMask(mask: number[]): void;
  onTelemetry(cb: ((t: Telemetry) => void) | null): void;
  /**
   * Retune the live capture track's noise suppression. Resolves false when
   * the browser won't change it in place, so the caller can restart instead.
   */
  setNoiseCancellation(on: boolean): Promise<boolean>;
  /**
   * Route playback to a chosen output device. Resolves false where the
   * browser has no setSinkId (everything outside Chromium today).
   */
  setOutputDevice(deviceId: string): Promise<boolean>;
  /** Transport for a file source; null when the source is the microphone. */
  file: FileTransport | null;
  stop(): void;
}

/** Play control for a decoded file being fed through the chain. */
export interface FileTransport {
  /** Seconds. */
  duration: number;
  play(): void;
  pause(): void;
  playing(): boolean;
  /** Current position in seconds. */
  position(): number;
  onEnded(cb: (() => void) | null): void;
}

/**
 * Exported so the offline eval can round-trip the exact source the browser
 * evaluates. The __name shim exists because some toolchains (esbuild/tsx with
 * keepNames, notably) inject `static { __name(this, "...") }` into serialised
 * classes, referencing a helper that lives in module scope - which a Blob-URL
 * worklet module does not share. A no-op keeps the class valid everywhere.
 */
export const PROCESSOR_SOURCE = `
const __name = (target) => target;
const HardtuneKernel = ${HardtuneKernel.toString()};
class HardtuneProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: "dryWet", defaultValue: 1, minValue: 0, maxValue: 1, automationRate: "k-rate" },
      { name: "retuneGlideMs", defaultValue: 0, minValue: 0, maxValue: 500, automationRate: "k-rate" },
    ];
  }
  constructor() {
    super();
    this.kernel = new HardtuneKernel(sampleRate);
    this.hops = 0;
    this.port.onmessage = (e) => {
      const m = e.data || {};
      if (m.scaleMask) this.kernel.setScaleMask(m.scaleMask);
      if (m.bits !== undefined || m.downsampleFactor !== undefined) {
        this.kernel.setCrush(
          m.bits !== undefined ? m.bits : this.kernel.bits,
          m.downsampleFactor !== undefined ? m.downsampleFactor : this.kernel.downsampleFactor,
        );
      }
      if (m.gateThreshold !== undefined) this.kernel.setGate(m.gateThreshold);
      if (m.denoise !== undefined) this.kernel.setDenoise(m.denoise);
      if (m.semitoneShift !== undefined) this.kernel.setSemitoneShift(m.semitoneShift);
      if (m.warbleHz !== undefined || m.warbleCents !== undefined) {
        this.kernel.setWarble(
          m.warbleHz !== undefined ? m.warbleHz : this.kernel.warbleHz,
          m.warbleCents !== undefined ? m.warbleCents : this.kernel.warbleCents,
        );
      }
    };
  }
  process(inputs, outputs, parameters) {
    const input = inputs[0] && inputs[0][0];
    const output = outputs[0] && outputs[0][0];
    if (!output) return true;
    if (!input) { output.fill(0); return true; }
    const k = this.kernel;
    k.dryWet = parameters.dryWet[0];
    k.setGlide(parameters.retuneGlideMs[0]);
    const ranDetect = k.process(input, output);
    if (ranDetect && ++this.hops >= 4) {
      this.hops = 0;
      this.port.postMessage({
        hz: k.lastHz, clarity: k.lastClarity, midi: k.lastMidi,
        targetMidi: k.lastTargetMidi, rms: k.lastRms,
      });
    }
    return true;
  }
}
registerProcessor("hardtune", HardtuneProcessor);
`;

/**
 * A dark little room, synthesised rather than shipped: decaying noise, one-pole
 * lowpassed so the tail is warm instead of fizzy, with a short silent
 * pre-delay so the voice keeps its edge before the space arrives. Two
 * decorrelated channels, which is what widens a mono worklet into something
 * that sounds like a room rather than a dot in the middle of your head.
 *
 * Deterministic LCG, not Math.random: the same build should always sound the
 * same, and a bad-sounding tail should be reproducible.
 */
function makeRoomIR(ctx: AudioContext, seconds = 1.9, decay = 2.8): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * seconds);
  const preDelay = Math.floor(sr * 0.02);
  const ir = ctx.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const data = ir.getChannelData(ch);
    let seed = ch === 0 ? 22229 : 99991;
    const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) * 2 - 1;
    let lp = 0;
    for (let i = preDelay; i < len; i++) {
      lp += (rand() - lp) * 0.22; // one-pole: darkens the tail
      const t = (i - preDelay) / (len - preDelay);
      data[i] = lp * Math.pow(1 - t, decay);
    }
  }
  return ir;
}

/**
 * Final safety ceiling. A DynamicsCompressor is a soft limiter, not a
 * brickwall: with 1 ms attack and ratio 20 it lets transients through, and
 * once the output slider can reach 2.5x that overshoot measured above full
 * scale (1.037) and would clip the DAC.
 *
 * This curve is perfectly transparent below `t` and asymptotes to 1.0 above
 * it, so nothing audible changes at sane levels and nothing can ever leave
 * over full scale. WaveShaper clamps out-of-range input to the curve's
 * endpoints, which caps even a 10x signal at the x=1 value (~0.93).
 */
function safetyCurve(t = 0.7): Float32Array<ArrayBuffer> {
  const n = 2048;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    const a = Math.abs(x);
    const y = a <= t ? a : t + (1 - t) * Math.tanh((a - t) / (1 - t));
    curve[i] = x < 0 ? -y : y;
  }
  return curve;
}

/** tanh(drive * x) / tanh(drive): unity at the rails, soft-clipped between. */
function shaperCurve(drive: number): Float32Array<ArrayBuffer> {
  const n = 2048;
  const curve = new Float32Array(n);
  const norm = Math.tanh(drive);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(drive * x) / norm;
  }
  return curve;
}

interface AudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

/** A user-gesture-created context, resumed and ready. */
export async function createContext(): Promise<AudioContext> {
  const Ctx = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
  if (!Ctx) throw new MicError("unknown", "This browser has no Web Audio support.");
  const ctx = new Ctx({ latencyHint: "interactive" });
  if (ctx.state === "suspended") await ctx.resume();
  return ctx;
}

/** Register the hardtune processor on a context (Blob-URL module load). */
export async function loadHardtuneModule(ctx: AudioContext): Promise<void> {
  const blobUrl = URL.createObjectURL(new Blob([PROCESSOR_SOURCE], { type: "application/javascript" }));
  try {
    await ctx.audioWorklet.addModule(blobUrl);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

export interface EffectChain {
  /** Feed the signal in here. */
  input: AudioNode;
  /** Post-limiter, pre-destination. Callers decide where it goes. */
  output: AudioNode;
  analyser: AnalyserNode;
  recorderStream: MediaStream;
  setParams(params: Partial<AdvancedParams>): void;
  setScaleMask(mask: number[]): void;
  onTelemetry(cb: ((t: Telemetry) => void) | null): void;
  disconnect(): void;
}

/**
 * The full effect chain minus source and destination, so the soundcheck page
 * can drive it with an oscillator instead of a microphone.
 * loadHardtuneModule must have completed on this context first.
 */
export function buildEffectChain(ctx: AudioContext, initial: AdvancedParams): EffectChain {
  const hardtune = new AudioWorkletNode(ctx, "hardtune", {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    outputChannelCount: [1],
  });

  const shaper = ctx.createWaveShaper();
  shaper.oversample = "4x";

  const highpass = ctx.createBiquadFilter();
  highpass.type = "highpass";
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";

  // The shouty megaphone mid bump. 1.8 kHz is where a voice's bite lives.
  const presence = ctx.createBiquadFilter();
  presence.type = "peaking";
  presence.frequency.value = 1800;
  presence.Q.value = 0.9;

  // Reverb as a parallel send: dry stays intact, the room is added beside it.
  const roomSend = ctx.createConvolver();
  roomSend.buffer = makeRoomIR(ctx);
  const roomWet = ctx.createGain();

  const master = ctx.createGain();

  // StrumLab's master-bus limiter, verbatim - but LAST in the chain, after
  // the master gain, so "output" can boost past unity and the limiter still
  // catches it before the DAC.
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -3;
  limiter.knee.value = 3;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.08;

  // Absolutely last, after the limiter: the thing that makes "output 250%"
  // safe rather than merely loud.
  const safety = ctx.createWaveShaper();
  safety.curve = safetyCurve();
  safety.oversample = "2x";

  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;

  const recorderDest = ctx.createMediaStreamDestination();

  hardtune.connect(shaper).connect(highpass).connect(presence).connect(lowpass).connect(master).connect(limiter);
  lowpass.connect(roomSend).connect(roomWet).connect(master);
  limiter.connect(safety);
  // Taps sit after the safety stage: what you hear is what you record.
  safety.connect(analyser);
  safety.connect(recorderDest);

  let telemetryCb: ((t: Telemetry) => void) | null = null;
  hardtune.port.onmessage = (e: MessageEvent<Telemetry>) => telemetryCb?.(e.data);

  const dryWetParam = hardtune.parameters.get("dryWet")!;
  const glideParam = hardtune.parameters.get("retuneGlideMs")!;

  // ~20 ms ramps on the audible continuous params: enough to stop zipper
  // noise, short enough to feel immediate under a slider.
  const ramp = (param: AudioParam, value: number) => {
    param.setTargetAtTime(value, ctx.currentTime, 0.02);
  };

  const setParams = (p: Partial<AdvancedParams>) => {
    if (p.dryWet !== undefined) ramp(dryWetParam, p.dryWet);
    if (p.retuneGlideMs !== undefined) glideParam.setValueAtTime(p.retuneGlideMs, ctx.currentTime);
    if (p.drive !== undefined) shaper.curve = shaperCurve(p.drive);
    if (p.highpassHz !== undefined) ramp(highpass.frequency, p.highpassHz);
    if (p.highpassQ !== undefined) ramp(highpass.Q, p.highpassQ);
    if (p.lowpassHz !== undefined) ramp(lowpass.frequency, p.lowpassHz);
    if (p.presenceDb !== undefined) ramp(presence.gain, p.presenceDb);
    if (p.roomMix !== undefined) ramp(roomWet.gain, p.roomMix);
    if (p.masterGain !== undefined) ramp(master.gain, p.masterGain);
    if (p.bits !== undefined || p.downsampleFactor !== undefined) {
      hardtune.port.postMessage({ bits: p.bits, downsampleFactor: p.downsampleFactor });
    }
    if (p.gateDb !== undefined) {
      // The slider's floor doubles as "off".
      hardtune.port.postMessage({ gateThreshold: p.gateDb <= -74 ? 0 : Math.pow(10, p.gateDb / 20) });
    }
    if (p.warbleHz !== undefined || p.warbleCents !== undefined) {
      hardtune.port.postMessage({ warbleHz: p.warbleHz, warbleCents: p.warbleCents });
    }
    if (p.denoise !== undefined) hardtune.port.postMessage({ denoise: p.denoise });
    if (p.semitoneShift !== undefined) hardtune.port.postMessage({ semitoneShift: p.semitoneShift });
  };

  // Filters need sane initial values before the first ramp targets land.
  highpass.frequency.value = initial.highpassHz;
  highpass.Q.value = initial.highpassQ;
  lowpass.frequency.value = initial.lowpassHz;
  presence.gain.value = initial.presenceDb;
  roomWet.gain.value = initial.roomMix;
  master.gain.value = initial.masterGain;
  setParams(initial);

  return {
    input: hardtune,
    output: safety,
    analyser,
    recorderStream: recorderDest.stream,
    setParams,
    setScaleMask(mask: number[]) {
      hardtune.port.postMessage({ scaleMask: mask });
    },
    onTelemetry(cb) {
      telemetryCb = cb;
    },
    disconnect() {
      telemetryCb = null;
      hardtune.port.onmessage = null;
      try {
        hardtune.disconnect();
        shaper.disconnect();
        highpass.disconnect();
        presence.disconnect();
        lowpass.disconnect();
        roomSend.disconnect();
        roomWet.disconnect();
        master.disconnect();
        limiter.disconnect();
        safety.disconnect();
      } catch {
        // Already torn down.
      }
    },
  };
}

export type MonitorMode = "headphones" | "speakers";

export interface CaptureOptions {
  monitor: MonitorMode;
  /**
   * The browser's own noise suppressor (WebRTC). Genuinely different from the
   * kernel's gate: this attenuates steady background noise *underneath* your
   * voice while you speak, where the gate can only silence the space between
   * words. It is tuned for speech, which is exactly our signal - the reason
   * StrumLab keeps it off is that it eats sustained guitar notes.
   */
  noiseCancellation: boolean;
  /** Specific microphone, from lib/audio/devices. Omit for the default. */
  inputDeviceId?: string;
  /** Specific output, applied via setSinkId where supported. */
  outputDeviceId?: string;
}

/**
 * Chromium-only, and typed by hand because setSinkId is not in lib.dom yet.
 * An empty id means "system default", which is also the reset path.
 */
type SinkCapableContext = AudioContext & { setSinkId?: (id: string) => Promise<void> };

async function routeOutput(ctx: AudioContext, deviceId: string): Promise<boolean> {
  const sink = (ctx as SinkCapableContext).setSinkId;
  if (typeof sink !== "function") return false;
  try {
    await sink.call(ctx, deviceId);
    return true;
  } catch {
    return false;
  }
}

export async function startVoiceGraph(
  initial: AdvancedParams,
  capture: CaptureOptions = { monitor: "headphones", noiseCancellation: true },
): Promise<VoiceGraph> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new MicError("insecure", "The browser won't share a microphone here. This needs https, or localhost.");
  }

  const ctx = await createContext(); // start is a user gesture

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        // AEC only in speaker mode - see the header comment.
        echoCancellation: capture.monitor === "speakers",
        noiseSuppression: capture.noiseCancellation,
        // Stays off regardless: AGC pumps the level, and a pumping input
        // makes both the gate's learned floor and the tuning unstable.
        autoGainControl: false,
        channelCount: 1,
        ...(capture.inputDeviceId ? { deviceId: { exact: capture.inputDeviceId } } : {}),
      },
    });
  } catch (err) {
    void ctx.close();
    const name = (err as DOMException)?.name;
    if (name === "NotAllowedError" || name === "SecurityError") {
      throw new MicError("denied", "Microphone access was blocked. Allow it in the browser's address bar, then try again.");
    }
    if (name === "NotFoundError" || name === "OverconstrainedError") {
      throw new MicError("unavailable", "No microphone found. Plug one in, or pick a different input in your system settings.");
    }
    throw new MicError("unknown", "The microphone couldn't be opened.");
  }

  await loadHardtuneModule(ctx);

  const source = ctx.createMediaStreamSource(stream);
  const chain = buildEffectChain(ctx, initial);
  source.connect(chain.input);
  chain.output.connect(ctx.destination);

  return {
    context: ctx,
    analyser: chain.analyser,
    recorderStream: chain.recorderStream,
    setParams: chain.setParams,
    setScaleMask: chain.setScaleMask,
    onTelemetry: chain.onTelemetry,
    file: null,
    setOutputDevice: (deviceId: string) => routeOutput(ctx, deviceId),
    async setNoiseCancellation(on: boolean) {
      const track = stream.getAudioTracks()[0];
      if (!track) return false;
      try {
        // Changing it in place avoids a dropout. Not every browser allows
        // this on a live track, hence the boolean rather than a throw.
        await track.applyConstraints({
          echoCancellation: capture.monitor === "speakers",
          noiseSuppression: on,
          autoGainControl: false,
        });
        return track.getSettings().noiseSuppression === on;
      } catch {
        return false;
      }
    },
    stop() {
      try {
        source.disconnect();
      } catch {
        // Already torn down.
      }
      chain.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close();
    },
  };
}

/**
 * Feed a decoded audio file through the same chain instead of the microphone.
 *
 * Nothing is uploaded: decodeAudioData runs on bytes already in the page, and
 * the file never leaves the browser - same promise the mic path makes.
 *
 * Two details that are easy to get wrong:
 *
 * 1. The worklet reads channel 0 only, so a stereo file would silently lose
 *    its right side. A gain node with an explicit mono channelCount performs
 *    a proper downmix first.
 * 2. AudioBufferSourceNode is one-shot - it cannot be restarted after stop().
 *    Pause therefore records an offset and throws the node away, and play
 *    builds a fresh one from that offset.
 */
export async function startFileGraph(
  initial: AdvancedParams,
  file: File,
  opts: { outputDeviceId?: string } = {},
): Promise<VoiceGraph> {
  const ctx = await createContext();

  let buffer: AudioBuffer;
  try {
    buffer = await ctx.decodeAudioData(await file.arrayBuffer());
  } catch {
    void ctx.close();
    throw new MicError(
      "unavailable",
      `${file.name || "That file"} couldn't be decoded. Try MP3, WAV, M4A, FLAC or OGG — some codecs vary by browser.`,
    );
  }

  await loadHardtuneModule(ctx);

  const chain = buildEffectChain(ctx, initial);
  const mono = ctx.createGain();
  mono.channelCount = 1;
  mono.channelCountMode = "explicit";
  mono.channelInterpretation = "speakers";
  mono.connect(chain.input);
  chain.output.connect(ctx.destination);

  if (opts.outputDeviceId) await routeOutput(ctx, opts.outputDeviceId);

  let node: AudioBufferSourceNode | null = null;
  let startedAt = 0;
  let offset = 0;
  let isPlaying = false;
  let endedCb: (() => void) | null = null;

  const transport: FileTransport = {
    duration: buffer.duration,
    playing: () => isPlaying,
    position: () => (isPlaying ? Math.min(buffer.duration, offset + (ctx.currentTime - startedAt)) : offset),
    onEnded(cb) {
      endedCb = cb;
    },
    play() {
      if (isPlaying) return;
      if (offset >= buffer.duration) offset = 0;
      node = ctx.createBufferSource();
      node.buffer = buffer;
      node.connect(mono);
      node.onended = () => {
        // stop() also fires this, so only treat it as the end of the take
        // when we did not ask for it - pause() clears the handler first.
        if (!isPlaying) return;
        isPlaying = false;
        offset = 0;
        endedCb?.();
      };
      node.start(0, offset);
      startedAt = ctx.currentTime;
      isPlaying = true;
    },
    pause() {
      if (!isPlaying || !node) return;
      offset = Math.min(buffer.duration, offset + (ctx.currentTime - startedAt));
      isPlaying = false;
      node.onended = null;
      try {
        node.stop();
        node.disconnect();
      } catch {
        // Already finished.
      }
      node = null;
    },
  };

  return {
    context: ctx,
    analyser: chain.analyser,
    recorderStream: chain.recorderStream,
    setParams: chain.setParams,
    setScaleMask: chain.setScaleMask,
    onTelemetry: chain.onTelemetry,
    file: transport,
    setOutputDevice: (deviceId: string) => routeOutput(ctx, deviceId),
    // No capture track exists on this path, so there is nothing to retune.
    async setNoiseCancellation() {
      return true;
    },
    stop() {
      endedCb = null;
      transport.pause();
      try {
        mono.disconnect();
      } catch {
        // Already torn down.
      }
      chain.disconnect();
      void ctx.close();
    },
  };
}
