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
 * switched off. Echo cancellation in particular would try to subtract the
 * monitored output from the input and audibly duck the voice - which is also
 * why the UI insists on headphones before starting.
 */

import { HardtuneKernel } from "@/lib/dsp/hardtuneKernel";
import type { Preset } from "./presets";

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

export interface AdvancedParams {
  retuneGlideMs: number;
  dryWet: number;
  drive: number;
  bits: number;
  downsampleFactor: number;
  highpassHz: number;
  lowpassHz: number;
  masterGain: number;
}

export interface VoiceGraph {
  context: AudioContext;
  analyser: AnalyserNode;
  /** Post-limiter feed for MediaRecorder. */
  recorderStream: MediaStream;
  applyPreset(preset: Preset): void;
  setParams(params: Partial<AdvancedParams>): void;
  setScaleMask(mask: number[]): void;
  onTelemetry(cb: ((t: Telemetry) => void) | null): void;
  stop(): void;
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
  output: GainNode;
  analyser: AnalyserNode;
  recorderStream: MediaStream;
  applyPreset(preset: Preset): void;
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
export function buildEffectChain(ctx: AudioContext, preset: Preset): EffectChain {
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

  // StrumLab's master-bus limiter, verbatim: the safety net that lets the
  // waveshaper be driven hard without the output ever slamming the DAC.
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -3;
  limiter.knee.value = 3;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.08;

  const master = ctx.createGain();

  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;

  const recorderDest = ctx.createMediaStreamDestination();

  hardtune.connect(shaper).connect(highpass).connect(lowpass).connect(limiter).connect(master);
  master.connect(analyser);
  master.connect(recorderDest);

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
    if (p.lowpassHz !== undefined) ramp(lowpass.frequency, p.lowpassHz);
    if (p.masterGain !== undefined) ramp(master.gain, p.masterGain);
    if (p.bits !== undefined || p.downsampleFactor !== undefined) {
      hardtune.port.postMessage({ bits: p.bits, downsampleFactor: p.downsampleFactor });
    }
  };

  const applyPreset = (next: Preset) => {
    highpass.Q.value = next.highpassQ;
    setParams({
      retuneGlideMs: next.retuneGlideMs,
      dryWet: next.dryWet,
      drive: next.drive,
      bits: next.bits,
      downsampleFactor: next.downsampleFactor,
      highpassHz: next.highpassHz,
      lowpassHz: next.lowpassHz,
      masterGain: next.masterGain,
    });
  };

  // Filters need sane initial values before the first ramp targets land.
  highpass.frequency.value = preset.highpassHz;
  lowpass.frequency.value = preset.lowpassHz;
  master.gain.value = preset.masterGain;
  applyPreset(preset);

  return {
    input: hardtune,
    output: master,
    analyser,
    recorderStream: recorderDest.stream,
    applyPreset,
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
        lowpass.disconnect();
        limiter.disconnect();
        master.disconnect();
      } catch {
        // Already torn down.
      }
    },
  };
}

export async function startVoiceGraph(preset: Preset): Promise<VoiceGraph> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new MicError("insecure", "The browser won't share a microphone here. This needs https, or localhost.");
  }

  const ctx = await createContext(); // start is a user gesture

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 1,
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
  const chain = buildEffectChain(ctx, preset);
  source.connect(chain.input);
  chain.output.connect(ctx.destination);

  return {
    context: ctx,
    analyser: chain.analyser,
    recorderStream: chain.recorderStream,
    applyPreset: chain.applyPreset,
    setParams: chain.setParams,
    setScaleMask: chain.setScaleMask,
    onTelemetry: chain.onTelemetry,
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
