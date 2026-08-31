"use client";

import { useCallback, useRef, useState } from "react";
import { MicError, startVoiceGraph, type Telemetry } from "@/lib/audio/graph";
import { listDevices } from "@/lib/audio/devices";
import { resolveParams, VOICES } from "@/lib/audio/voices";
import { assessRoom } from "@/lib/roomCheck";
import { midiName } from "@/lib/dsp/scales";

/**
 * A self-test that runs on the visitor's OWN microphone and prints a report
 * they can paste to someone else.
 *
 * This exists because the automated checks cannot open a microphone: the
 * harness that drives this app in development is denied device capture, so
 * every other test on this page substitutes an oscillator. Everything that
 * depends on a real capture chain - the device actually in use, the room, how
 * confidently the detector locks onto a human voice, true round-trip latency -
 * can only be measured here, by the person holding the microphone.
 *
 * Three phases: silence to measure the room, then speech to measure the
 * voice, then a verdict on each.
 */

type Phase = "idle" | "silence" | "voice" | "done" | "error";

interface Report {
  device: string;
  sampleRate: number;
  baseLatencyMs: number;
  outputLatencyMs: number;
  roomDbfs: number;
  roomVerdict: string;
  roomAfterDbfs: number | null;
  voicePeakDbfs: number;
  bestClarity: number;
  lockedFrames: number;
  totalFrames: number;
  medianHz: number;
  snappedTo: string;
  warnings: string[];
}

const SILENCE_MS = 4000;
const VOICE_MS = 6000;

export function LiveMicCheck() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef(false);

  const run = useCallback(async () => {
    abortRef.current = false;
    setReport(null);
    setCopied(false);
    setMessage("");
    setPhase("silence");

    const base = resolveParams(VOICES[0], {
      match: 1, robot: 0, volume: 1, gateDb: -75, denoise: 0, noiseReduction: 0,
    });

    let graph: Awaited<ReturnType<typeof startVoiceGraph>> | null = null;
    try {
      graph = await startVoiceGraph(base, { monitor: "headphones", noiseCancellation: false });
      // Muted throughout: this measures the INPUT, and a self-test has no
      // business howling at someone who happens to be on speakers.
      graph.setParams({ masterGain: 0 });

      const frames: Telemetry[] = [];
      graph.onTelemetry((t) => frames.push(t));

      const wait = (ms: number) =>
        new Promise<void>((r) => setTimeout(r, ms));

      // --- phase 1: the room -------------------------------------------------
      await wait(SILENCE_MS);
      if (abortRef.current) throw new Error("cancelled");
      const silentFrames = frames.slice();
      const roomFloor = silentFrames.length
        ? silentFrames.map((f) => f.noiseFloor).sort((a, b) => a - b)[silentFrames.length >> 1]
        : 0;

      // Take a room print off that same silence, then re-measure it.
      graph.learnNoise(2);
      await wait(2400);
      graph.setParams({ noiseReduction: 0.8 });
      const beforeCount = frames.length;
      await wait(1200);
      const afterFrames = frames.slice(beforeCount);
      const roomAfter = afterFrames.length
        ? afterFrames.map((f) => f.rms).sort((a, b) => a - b)[afterFrames.length >> 1]
        : 0;
      graph.setParams({ noiseReduction: 0 });
      graph.clearNoiseProfile();

      // --- phase 2: the voice ------------------------------------------------
      setPhase("voice");
      const voiceStart = frames.length;
      await wait(VOICE_MS);
      if (abortRef.current) throw new Error("cancelled");
      const voiceFrames = frames.slice(voiceStart);

      const peak = voiceFrames.reduce((m, f) => Math.max(m, f.rms), 0);
      const bestClarity = voiceFrames.reduce((m, f) => Math.max(m, f.clarity), 0);
      const locked = voiceFrames.filter((f) => f.hz > 0 && f.clarity >= 0.6);
      const hzs = locked.map((f) => f.hz).sort((a, b) => a - b);
      const medianHz = hzs.length ? hzs[hzs.length >> 1] : 0;
      const lastTarget = locked.length ? locked[locked.length - 1].targetMidi : 0;

      const devices = await listDevices();
      const inUse = devices.inputs[0];

      const ctx = graph.context;
      const room = assessRoom(roomFloor, true);
      const db = (v: number) => (v > 0 ? 20 * Math.log10(v) : -Infinity);

      const warnings: string[] = [];
      if (peak < 0.02) warnings.push("Input is very quiet — raise the mic gain or move closer.");
      if (peak > 0.7) warnings.push("Input is close to clipping — lower the mic gain.");
      if (bestClarity < 0.6) warnings.push("The pitch tracker never locked on. Sing or hum a steady note rather than speaking.");
      if (room.verdict === "noisy") warnings.push("Room is noisy enough to matter — a room print or a closer mic would help.");
      if (ctx.sampleRate < 44100) warnings.push(`Unusual sample rate (${ctx.sampleRate} Hz).`);

      setReport({
        device: inUse?.label || "default (name appears once permission sticks)",
        sampleRate: ctx.sampleRate,
        baseLatencyMs: (ctx.baseLatency ?? 0) * 1000,
        outputLatencyMs: (ctx.outputLatency ?? 0) * 1000,
        roomDbfs: db(roomFloor),
        roomVerdict: room.label,
        roomAfterDbfs: roomAfter > 0 ? db(roomAfter) : null,
        voicePeakDbfs: db(peak),
        bestClarity,
        lockedFrames: locked.length,
        totalFrames: voiceFrames.length,
        medianHz,
        snappedTo: lastTarget > 0 ? midiName(lastTarget) : "—",
        warnings,
      });
      setPhase("done");
    } catch (err) {
      setPhase("error");
      setMessage(
        err instanceof MicError ? err.message : "The microphone could not be opened for the check.",
      );
    } finally {
      graph?.stop();
    }
  }, []);

  const text = report
    ? [
        "soundslikethestrokes — live mic check",
        `microphone      ${report.device}`,
        `sample rate     ${report.sampleRate} Hz`,
        `latency         base ${report.baseLatencyMs.toFixed(1)} ms, output ${report.outputLatencyMs.toFixed(1)} ms`,
        `room            ${report.roomDbfs.toFixed(1)} dBFS (${report.roomVerdict})`,
        `room after cut  ${report.roomAfterDbfs === null ? "n/a" : `${report.roomAfterDbfs.toFixed(1)} dBFS`}`,
        `voice peak      ${report.voicePeakDbfs.toFixed(1)} dBFS`,
        `best clarity    ${report.bestClarity.toFixed(2)}`,
        `pitch lock      ${report.lockedFrames}/${report.totalFrames} frames`,
        `median pitch    ${report.medianHz ? `${report.medianHz.toFixed(1)} Hz` : "never locked"}`,
        `snapped to      ${report.snappedTo}`,
        ...(report.warnings.length ? ["", ...report.warnings.map((w) => `! ${w}`)] : ["", "no warnings"]),
      ].join("\n")
    : "";

  return (
    <section className="mic-check">
      <header className="mic-check-head">
        <h2 className="mic-check-title">Live microphone check</h2>
        <p className="mic-check-blurb">
          The tests above use a synthesised tone, because automated runs cannot open a microphone. This one uses{" "}
          <strong>yours</strong> — it measures your room, your input level and whether the tuner locks onto your
          voice, then prints a report you can copy and send to someone.
        </p>
      </header>

      {phase === "idle" && (
        <button type="button" className="btn btn-hot" onClick={() => void run()}>
          ▶ run the check ({(SILENCE_MS + VOICE_MS) / 1000 + 4}s)
        </button>
      )}

      {phase === "silence" && (
        <p className="mic-check-step mic-check-step-quiet">
          <strong>Stay silent.</strong> Measuring your room…
        </p>
      )}
      {phase === "voice" && (
        <p className="mic-check-step mic-check-step-talk">
          <strong>Now sing or hum a steady note</strong> — keep going until it stops.
        </p>
      )}
      {phase === "error" && <p className="mic-check-error">{message}</p>}

      {phase === "done" && report && (
        <>
          <pre className="mic-check-report">{text}</pre>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => {
                void navigator.clipboard?.writeText(text).then(() => setCopied(true));
              }}
            >
              {copied ? "copied ✓" : "copy report"}
            </button>
            <button type="button" className="btn btn-sm" onClick={() => void run()}>
              run again
            </button>
          </div>
        </>
      )}
    </section>
  );
}
