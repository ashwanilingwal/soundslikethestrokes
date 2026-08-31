"use client";

import { useCallback, useState } from "react";
import { buildEffectChain, createContext, loadHardtuneModule } from "@/lib/audio/graph";
import { resolveParams, VOICES } from "@/lib/audio/voices";
import { HardtuneKernel } from "@/lib/dsp/hardtuneKernel";
import { hzToMidi } from "@/lib/dsp/scales";
import { LiveMicCheck } from "@/components/LiveMicCheck";

/**
 * Everything the effect chain should do, measured without a microphone: an
 * oscillator stands in for the voice, so the whole page is drivable by an
 * agent (or a curious human) in a plain browser tab. Output goes through a
 * muted gain - the test is silent.
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** One-shot pitch measurement using an idle kernel as the analyser. */
function measurePitch(buf: Float32Array, sr: number): { hz: number; clarity: number } {
  const k = new HardtuneKernel(sr);
  k.process(buf, new Float32Array(buf.length));
  return { hz: k.lastHz, clarity: k.lastClarity };
}

export default function Page() {
  const [lines, setLines] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const run = useCallback(async () => {
    setRunning(true);
    const out: string[] = [];
    const say = (l: string) => {
      out.push(l);
      setLines([...out]);
    };

    try {
      const ctx = await createContext();
      const t0 = ctx.currentTime;
      await loadHardtuneModule(ctx);
      say("A. worklet module loaded  PASS");

      // Clean settings: the tuner is what's under test, not the dirt. The
      // gate is off too - an oscillator has no room noise to remove, and a
      // closed gate would just make every later check measure silence.
      const base = resolveParams(VOICES[0], { match: 1, robot: 0, volume: 1, gateDb: -75, denoise: 0, noiseReduction: 0 });
      const chain = buildEffectChain(ctx, base);
      chain.setParams({ drive: 1, bits: 16, downsampleFactor: 1, highpassHz: 60, lowpassHz: 12000, masterGain: 1, retuneGlideMs: 0, warbleCents: 0, roomMix: 0, semitoneShift: 0 });

      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.35;
      const mute = ctx.createGain();
      mute.gain.value = 0;
      osc.connect(oscGain).connect(chain.input);
      chain.output.connect(mute).connect(mute.context.destination);

      const an = chain.analyser;
      const buf = new Float32Array(an.fftSize);
      // Pre-filter tap straight off the worklet: the crusher's staircase is
      // only visible here, before the biquads and limiter smear it back into
      // continuous values.
      const anPre = ctx.createAnalyser();
      anPre.fftSize = 2048;
      chain.input.connect(anPre);
      const bufPre = new Float32Array(anPre.fftSize);

      // Everything below paces itself on the worklet's telemetry messages
      // (~43 ms apart): MessagePort events keep firing in a hidden tab, where
      // setTimeout is throttled to ~1/s and would starve the poll loops.
      let telemetryCount = 0;
      let tickResolve: (() => void) | null = null;
      chain.onTelemetry(() => {
        telemetryCount++;
        tickResolve?.();
        tickResolve = null;
      });
      const nextTick = () =>
        Promise.race([new Promise<void>((r) => { tickResolve = r; }), sleep(1500)]);
      const waitTicks = async (n: number) => { for (let i = 0; i < n; i++) await nextTick(); };

      osc.frequency.value = 150;
      osc.start();
      await waitTicks(5);
      say(`B. context: state=${ctx.state}, clock advanced ${(ctx.currentTime - t0).toFixed(3)}s  ${ctx.currentTime > t0 ? "PASS" : "FAIL"}`);

      // C. swept tone lands on the semitone grid at the output.
      const cStart = ctx.currentTime;
      osc.frequency.setValueAtTime(150, cStart);
      osc.frequency.exponentialRampToValueAtTime(400, cStart + 4);
      let onGrid = 0;
      let voiced = 0;
      let polls = 0;
      while (ctx.currentTime - cStart < 4) {
        await nextTick();
        an.getFloatTimeDomainData(buf);
        const m = measurePitch(buf, ctx.sampleRate);
        polls++;
        if (m.hz > 0 && m.clarity >= 0.6) {
          voiced++;
          const midi = hzToMidi(m.hz);
          if (Math.abs(midi - Math.round(midi)) * 100 <= 25) onGrid++;
        }
      }
      const gridPct = voiced ? (100 * onGrid) / voiced : 0;
      say(`C. sweep 150->400 Hz: ${voiced}/${polls} voiced frames, ${gridPct.toFixed(1)}% on the semitone grid  ${voiced > 30 && gridPct >= 85 ? "PASS" : "FAIL"}`);
      say(`   telemetry messages so far: ${telemetryCount}  ${telemetryCount > 20 ? "PASS" : "FAIL"}`);

      // D. bitcrusher measurably reduces distinct sample values (pre-filter tap).
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      await waitTicks(7);
      anPre.getFloatTimeDomainData(bufPre);
      const uniques = (b: Float32Array) => new Set(Array.from(b, (v) => Math.round(v * 1e5))).size;
      const cleanUnique = uniques(bufPre);
      chain.setParams({ bits: 5, downsampleFactor: 8 });
      await waitTicks(9);
      anPre.getFloatTimeDomainData(bufPre);
      const crushedUnique = uniques(bufPre);
      chain.setParams({ bits: 16, downsampleFactor: 1 });
      say(`D. crusher: ${cleanUnique} distinct values clean vs ${crushedUnique} crushed  ${crushedUnique < cleanUnique / 4 ? "PASS" : "FAIL"}`);

      // E. the output can never leave over full scale, even at the worst
      // case the UI allows: max drive AND max boost.
      const peakAt = async (drive: number, masterGain: number) => {
        chain.setParams({ drive, masterGain });
        oscGain.gain.value = 0.9;
        await waitTicks(9);
        let p = 0;
        for (let i = 0; i < 10; i++) {
          an.getFloatTimeDomainData(buf);
          for (const v of buf) p = Math.max(p, Math.abs(v));
          await waitTicks(1);
        }
        return p;
      };
      const normalPeak = await peakAt(12, 1);
      const worstPeak = await peakAt(20, 2.5);
      chain.setParams({ drive: 2, masterGain: 1 });
      say(
        `E. peak at drive 12 / boost 1.0: ${normalPeak.toFixed(3)}; at max drive 20 / boost 2.5: ${worstPeak.toFixed(3)}  ${normalPeak > 0.05 && normalPeak < 0.99 && worstPeak < 0.99 ? "PASS" : "FAIL"}`,
      );

      // F. the room: after the source is cut, a wet chain must still ring.
      chain.setParams({ drive: 2, masterGain: 1, roomMix: 0 });
      oscGain.gain.value = 0.35;
      const tailAfterCut = async () => {
        await waitTicks(8);
        oscGain.gain.setValueAtTime(0, ctx.currentTime);
        await waitTicks(4); // ~170 ms: past the grain tail, inside a reverb tail
        let sum = 0;
        let count = 0;
        for (let i = 0; i < 6; i++) {
          an.getFloatTimeDomainData(buf);
          for (const v of buf) sum += v * v;
          count += buf.length;
          await waitTicks(1);
        }
        oscGain.gain.setValueAtTime(0.35, ctx.currentTime);
        return Math.sqrt(sum / count);
      };
      const dryTail = await tailAfterCut();
      chain.setParams({ roomMix: 0.9 });
      const wetTail = await tailAfterCut();
      chain.setParams({ roomMix: 0 });
      say(`F. room tail after cut: dry ${dryTail.toExponential(2)} vs wet ${wetTail.toExponential(2)}  ${wetTail > dryTail * 5 && wetTail > 1e-3 ? "PASS" : "FAIL"}`);

      // G. the echo: after the source is cut, repeats must keep arriving.
      chain.setParams({ drive: 2, masterGain: 1, roomMix: 0, echoMs: 0, echoFeedback: 0, echoMix: 0 });
      oscGain.gain.value = 0.35;
      const tailWithEcho = async (label: string) => {
        await waitTicks(8);
        oscGain.gain.setValueAtTime(0, ctx.currentTime);
        // Past the ~35 ms grain tail, inside where a 250 ms echo still rings.
        await waitTicks(6);
        let sum = 0;
        let count = 0;
        for (let i = 0; i < 8; i++) {
          an.getFloatTimeDomainData(buf);
          for (const v of buf) sum += v * v;
          count += buf.length;
          await waitTicks(1);
        }
        oscGain.gain.setValueAtTime(0.35, ctx.currentTime);
        say(`   ${label}: rms ${Math.sqrt(sum / count).toExponential(2)}`);
        return Math.sqrt(sum / count);
      };
      const noEchoTail = await tailWithEcho("echo off");
      chain.setParams({ echoMs: 250, echoFeedback: 0.55, echoMix: 0.5 });
      const echoTail = await tailWithEcho("echo 250ms");
      chain.setParams({ echoMs: 0, echoFeedback: 0, echoMix: 0 });
      say(`G. echo repeats after the source stops  ${echoTail > noEchoTail * 8 && echoTail > 1e-3 ? "PASS" : "FAIL"}`);

      // H. recorder stream + mime support.
      const mime = ["audio/webm;codecs=opus", "audio/mp4"].find((m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m));
      const tracks = chain.recorderStream.getAudioTracks().length;
      say(`H. recorder: ${tracks} audio track(s), mime ${mime ?? "browser default"}  ${tracks === 1 ? "PASS" : "FAIL"}`);

      say(`I. latency (informational): base ${((ctx.baseLatency ?? 0) * 1000).toFixed(1)} ms, output ${((ctx.outputLatency ?? 0) * 1000).toFixed(1)} ms`);

      osc.stop();
      chain.disconnect();
      await ctx.close();
      say("done");
    } catch (err) {
      say(`FATAL ${err instanceof Error ? `${err.name}: ${err.message}` : String(err)}`);
    } finally {
      setRunning(false);
    }
  }, []);

  return (
    <main className="p-4">
      <button id="run" className="btn mb-3" disabled={running} onClick={() => void run()}>
        run
      </button>
      <pre id="out" className="num whitespace-pre-wrap text-xs leading-7">
        {lines.join("\n")}
      </pre>
      <LiveMicCheck />
    </main>
  );
}
