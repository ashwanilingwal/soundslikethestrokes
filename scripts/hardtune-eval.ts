/**
 * Offline eval for the hardtune kernel. Run with: npx tsx scripts/hardtune-eval.ts
 *
 * Feeds the kernel synthetic tones in 128-sample blocks (exactly what the
 * worklet does) and checks the autotune behaviour numerically - no browser,
 * no microphone. A second kernel instance is used as the output ANALYSER:
 * its NSDF detector reads whatever is pushed through it, so pushing the
 * effect's output through an otherwise-idle kernel gives us an independent
 * pitch measurement with zero duplicated DSP.
 */

import { HardtuneKernel } from "../src/lib/dsp/hardtuneKernel";
import { PROCESSOR_SOURCE } from "../src/lib/audio/graph";
import { CHROMATIC, majorMask, hzToMidi } from "../src/lib/dsp/scales";

const SR = 48000;
const BLOCK = 128;

let failures = 0;
function check(name: string, pass: boolean, detail: string) {
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}  ${detail}`);
  if (!pass) failures++;
}

/** Push a signal through a kernel block by block; returns the full output. */
function run(kernel: HardtuneKernel, input: Float32Array): Float32Array {
  const out = new Float32Array(input.length);
  const inBlock = new Float32Array(BLOCK);
  const outBlock = new Float32Array(BLOCK);
  for (let off = 0; off + BLOCK <= input.length; off += BLOCK) {
    inBlock.set(input.subarray(off, off + BLOCK));
    kernel.process(inBlock, outBlock);
    out.set(outBlock, off);
  }
  return out;
}

/** Measure pitch of `signal` every hop using an analyser kernel. */
function pitchTrack(signal: Float32Array): { at: number; hz: number }[] {
  const an = new HardtuneKernel(SR);
  const track: { at: number; hz: number }[] = [];
  const inBlock = new Float32Array(BLOCK);
  const outBlock = new Float32Array(BLOCK);
  for (let off = 0; off + BLOCK <= signal.length; off += BLOCK) {
    inBlock.set(signal.subarray(off, off + BLOCK));
    const ran = an.process(inBlock, outBlock);
    if (ran && an.lastHz > 0 && an.lastClarity >= 0.6) {
      track.push({ at: off + BLOCK, hz: an.lastHz });
    }
  }
  return track;
}

function sine(hzAt: (t: number) => number, seconds: number, amp = 0.4): Float32Array {
  const n = Math.floor(seconds * SR);
  const buf = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    phase += (2 * Math.PI * hzAt(i / SR)) / SR;
    buf[i] = amp * Math.sin(phase);
  }
  return buf;
}

// ---------------------------------------------------------------- (a) sweep
{
  const kernel = new HardtuneKernel(SR);
  kernel.setGlide(0);
  const sweep = sine((t) => 110 * Math.pow(4, t / 5), 5); // 110 -> 440 Hz
  const out = run(kernel, sweep);
  const track = pitchTrack(out).filter((p) => p.at > SR * 0.2); // skip warmup

  let onGrid = 0;
  const centsOff: number[] = [];
  for (const p of track) {
    const midi = hzToMidi(p.hz);
    const cents = Math.abs(midi - Math.round(midi)) * 100;
    centsOff.push(cents);
    if (cents <= 25) onGrid++;
  }
  const gridPct = track.length ? (100 * onGrid) / track.length : 0;
  check(
    "a1 sweep snaps to semitone grid",
    track.length > 50 && gridPct >= 90,
    `${track.length} voiced frames, ${gridPct.toFixed(1)}% within 25 cents`,
  );

  // Stair-stepping: adjacent voiced frames either hold (tiny delta) or jump
  // (~a semitone). Frames straddling a jump read in between; allow a few.
  let holdsOrJumps = 0;
  for (let i = 1; i < track.length; i++) {
    const delta = Math.abs(hzToMidi(track[i].hz) - hzToMidi(track[i - 1].hz)) * 100;
    if (delta < 30 || delta > 70) holdsOrJumps++;
  }
  const stairPct = track.length > 1 ? (100 * holdsOrJumps) / (track.length - 1) : 0;
  check("a2 output pitch is stair-stepped", stairPct >= 80, `${stairPct.toFixed(1)}% of deltas are holds or ~semitone jumps`);

  const covered = new Set(track.map((p) => Math.round(hzToMidi(p.hz))));
  check("a3 sweep covers the two octaves", covered.size >= 18, `${covered.size} distinct semitones (expect ~24)`);
}

// ------------------------------------------------------- (b) re-snap latency
{
  const kernel = new HardtuneKernel(SR);
  kernel.setGlide(0);
  const a3 = sine(() => 220, 1);
  const b3 = sine(() => 246.94, 1);
  run(kernel, a3);
  // Feed the new note block by block and watch the snap target directly.
  const inBlock = new Float32Array(BLOCK);
  const outBlock = new Float32Array(BLOCK);
  let snapAt = -1;
  for (let off = 0; off + BLOCK <= b3.length; off += BLOCK) {
    inBlock.set(b3.subarray(off, off + BLOCK));
    kernel.process(inBlock, outBlock);
    if (kernel.lastTargetMidi === 59) { snapAt = off + BLOCK; break; }
  }
  const ms = (snapAt / SR) * 1000;
  // The detector's 43 ms window has to become dominated by the new tone
  // before NSDF reads it cleanly, so ~30-60 ms is the honest floor.
  check("b  220->246.94 Hz re-snaps quickly", snapAt >= 0 && ms <= 64, `snapped to B3 after ${ms.toFixed(1)} ms`);
}

// ------------------------------------------------------- (c) C-major mask
{
  const kernel = new HardtuneKernel(SR);
  kernel.setGlide(0);
  kernel.setScaleMask(majorMask(0));
  const sweep = sine((t) => 110 * Math.pow(4, t / 5), 5);
  const inBlock = new Float32Array(BLOCK);
  const outBlock = new Float32Array(BLOCK);
  const CMAJ = new Set([0, 2, 4, 5, 7, 9, 11]);
  let targets = 0;
  let inScale = 0;
  for (let off = 0; off + BLOCK <= sweep.length; off += BLOCK) {
    inBlock.set(sweep.subarray(off, off + BLOCK));
    kernel.process(inBlock, outBlock);
    if (kernel.voiced && kernel.lastTargetMidi > 0) {
      targets++;
      if (CMAJ.has(((kernel.lastTargetMidi % 12) + 12) % 12)) inScale++;
    }
  }
  check("c  C-major mask constrains targets", targets > 100 && inScale === targets, `${inScale}/${targets} snap targets in C major`);
  kernel.setScaleMask(CHROMATIC);
}

// ------------------------------------- (d) silence + unvoiced hold-then-relax
{
  const kernel = new HardtuneKernel(SR);
  const silence = new Float32Array(SR);
  const out = run(kernel, silence);
  let peak = 0;
  for (const v of out) peak = Math.max(peak, Math.abs(v));
  check("d1 silence in, silence out", peak < 1e-4, `abs peak ${peak.toExponential(2)}`);

  const kernel2 = new HardtuneKernel(SR);
  kernel2.setGlide(0);
  run(kernel2, sine(() => 220, 1));
  const voicedBefore = kernel2.voiced && kernel2.lastTargetMidi === 57; // A3
  run(kernel2, new Float32Array(Math.floor(SR * 0.1))); // 100 ms of silence
  // The hold is about semantics, not float stability: the snap target must
  // survive (detections straddling the tone/silence boundary re-derive the
  // ratio from a fractionally different midi, and that is fine).
  const heldAt100 = kernel2.voiced && kernel2.lastTargetMidi === 57;
  run(kernel2, new Float32Array(Math.floor(SR * 0.2))); // total 300 ms
  const relaxedAt300 = !kernel2.voiced && kernel2.lastTargetMidi === 0 && Math.abs(kernel2.ratio - 1) < 0.01;
  check(
    "d2 unvoiced hold-then-relax",
    voicedBefore && heldAt100 && relaxedAt300,
    `voiced on tone=${voicedBefore}, target held at 100ms=${heldAt100}, relaxed at 300ms=${relaxedAt300}`,
  );
}

// ----------------------------------------------------------- (e) level sanity
{
  const kernel = new HardtuneKernel(SR);
  const tone = sine(() => 233.08, 2); // A#3, 20 cents off nowhere - on-grid input
  const out = run(kernel, tone);
  const rms = (b: Float32Array) => Math.sqrt(b.reduce((s, v) => s + v * v, 0) / b.length);
  const inR = rms(tone.subarray(SR));
  const outR = rms(out.subarray(SR));
  check("e  shifter is roughly unity gain", outR > inR * 0.5 && outR < inR * 1.5, `in ${inR.toFixed(3)} out ${outR.toFixed(3)}`);
}

// ----------------------------------------------------------- (g) noise gate
{
  const kernel = new HardtuneKernel(SR);
  kernel.setGate(Math.pow(10, -45 / 20)); // open at -45 dB
  // Deterministic noise at ~-50 dB peak - room hiss the gate should eat.
  let seed = 1234567;
  const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) * 2 - 1;
  const noise = new Float32Array(SR);
  for (let i = 0; i < noise.length; i++) noise[i] = 0.003 * rand();
  const noiseOut = run(kernel, noise);
  const rms = (b: Float32Array) => Math.sqrt(b.reduce((s, v) => s + v * v, 0) / b.length);
  const noiseRms = rms(noiseOut.subarray(SR / 2)); // after the gate settles
  const toneOut = run(kernel, sine(() => 220, 1));
  const toneRms = rms(toneOut.subarray(SR / 2));
  check(
    "g  gate eats hiss, passes the voice",
    noiseRms < 1e-4 && toneRms > 0.15,
    `noise rms ${noiseRms.toExponential(2)}, tone rms ${toneRms.toFixed(3)}`,
  );
}

// ------------------------------------------------------------- (h) warble
{
  const kernel = new HardtuneKernel(SR);
  kernel.setGlide(0);
  kernel.setWarble(5, 60);
  const out = run(kernel, sine(() => 220, 3)); // A3: base snap ratio ~1
  const track = pitchTrack(out).filter((p) => p.at > SR * 0.5);
  let lo = Infinity;
  let hi = -Infinity;
  for (const p of track) {
    const midi = hzToMidi(p.hz);
    if (midi < lo) lo = midi;
    if (midi > hi) hi = midi;
  }
  const range = (hi - lo) * 100;
  // 60-cent depth = 120 cents peak-to-peak; the tracker's 43 ms window
  // averages some of it away, so accept a broad band around that.
  check("h  warble modulates the output pitch", track.length > 20 && range > 50 && range < 250, `${track.length} frames, pitch range ${range.toFixed(0)} cents`);
}

// ------------------------------------------------------- (i) transposition
{
  const kernel = new HardtuneKernel(SR);
  kernel.setGlide(0);
  kernel.setSemitoneShift(-2);
  const out = run(kernel, sine(() => 220, 2)); // A3 = midi 57
  const track = pitchTrack(out).filter((p) => p.at > SR);
  const midis = track.map((p) => hzToMidi(p.hz)).sort((a, b) => a - b);
  const median = midis[midis.length >> 1] ?? 0;
  check(
    "i  -2 semitone transpose lands on G3",
    track.length > 20 && Math.abs(median - 55) < 0.4,
    `${track.length} frames, median midi ${median.toFixed(2)} (want 55)`,
  );
}

// ------------------- (j) the formula: periodicity beats level for denoising
// The point of the clarity term. Noise and a tone at the SAME amplitude are
// indistinguishable to a level-only gate; only periodicity separates them.
{
  const AMP = 0.05; // comfortably above the -45 dB threshold, both cases
  let seed = 7654321;
  const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) * 2 - 1;
  const noise = new Float32Array(SR * 2);
  for (let i = 0; i < noise.length; i++) noise[i] = AMP * rand();
  const rms = (b: Float32Array) => Math.sqrt(b.reduce((s, v) => s + v * v, 0) / b.length);

  const gateAt = Math.pow(10, -45 / 20);
  const noiseKernel = new HardtuneKernel(SR);
  noiseKernel.setGate(gateAt);
  noiseKernel.setDenoise(1);
  const noiseOut = run(noiseKernel, noise);

  const toneKernel = new HardtuneKernel(SR);
  toneKernel.setGate(gateAt);
  toneKernel.setDenoise(1);
  toneKernel.setGlide(0);
  const toneOut = run(toneKernel, sine(() => 220, 2, AMP));

  const noiseRms = rms(noiseOut.subarray(SR));
  const toneRms = rms(toneOut.subarray(SR));
  check(
    "j  same level, only the voice gets through",
    noiseRms < toneRms * 0.05 && toneRms > 0.01,
    `aperiodic ${noiseRms.toExponential(2)} vs periodic ${toneRms.toExponential(2)} at identical amplitude`,
  );
}

// ------------------------- (f) worklet source round-trips through eval
// The browser evaluates PROCESSOR_SOURCE (built from HardtuneKernel.toString())
// in a scope with no module helpers. Stub the worklet globals and run the
// exact string; this is what caught esbuild's injected __name helper.
{
  type Proc = { process(i: Float32Array[][], o: Float32Array[][], p: Record<string, Float32Array>): boolean };
  let registered: (new () => Proc) | null = null;
  const harness = new Function(
    "AudioWorkletProcessor",
    "registerProcessor",
    "sampleRate",
    PROCESSOR_SOURCE,
  );
  class FakeProcessor {
    port = { onmessage: null as unknown, postMessage: () => {} };
  }
  harness(FakeProcessor, (_name: string, cls: new () => Proc) => { registered = cls; }, SR);
  let ok = false;
  let detail = "registerProcessor never called";
  // Indirection because TS can't see the callback assignment above.
  const RegisteredProc = registered as (new () => Proc) | null;
  if (RegisteredProc) {
    const proc = new RegisteredProc();
    const tone = sine(() => 220, 0.5);
    const outBlock = new Float32Array(BLOCK);
    let peak = 0;
    const params = { dryWet: new Float32Array([1]), retuneGlideMs: new Float32Array([0]) };
    for (let off = 0; off + BLOCK <= tone.length; off += BLOCK) {
      proc.process([[tone.subarray(off, off + BLOCK) as Float32Array]], [[outBlock]], params);
      for (const v of outBlock) peak = Math.max(peak, Math.abs(v));
    }
    ok = peak > 0.1;
    detail = `processor ran, output peak ${peak.toFixed(3)}`;
  }
  check("f  worklet source evaluates in a bare scope", ok, detail);
}

console.log(failures === 0 ? "\nall checks passed" : `\n${failures} check(s) FAILED`);
process.exit(failures === 0 ? 0 : 1);
