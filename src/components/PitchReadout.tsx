"use client";

import type { Telemetry } from "@/lib/audio/graph";
import { midiName } from "@/lib/dsp/scales";

/**
 * What you sang -> what the tuner is forcing it to. Driven entirely by the
 * worklet's telemetry messages (~23/s); no AnalyserNode polling needed.
 */
export function PitchReadout({ telemetry, live }: { telemetry: Telemetry | null; live: boolean }) {
  const voiced = live && telemetry !== null && telemetry.hz > 0 && telemetry.targetMidi > 0;
  // RMS of speech peaks around 0.1-0.3; map the useful range onto the bar.
  const level = telemetry ? Math.min(1, telemetry.rms * 4) : 0;

  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex items-baseline justify-center gap-4">
        <span className={`num text-3xl ${voiced ? "text-fg" : "text-fg-dim"}`}>
          {voiced ? midiName(telemetry.midi) : "—"}
        </span>
        <span className="text-fg-dim" aria-hidden>
          →
        </span>
        <span className={`num text-3xl ${voiced ? "text-tape" : "text-fg-dim"}`}>
          {voiced ? midiName(telemetry.targetMidi) : "—"}
        </span>
      </div>
      <div className="flex items-center justify-center gap-6 text-xs text-fg-dim">
        <span className="num">{voiced ? `${telemetry.hz.toFixed(1)} Hz` : "no pitch"}</span>
        <span className="caps">you → snapped</span>
      </div>
      <div className="meter" role="meter" aria-label="input level" aria-valuenow={Math.round(level * 100)} aria-valuemin={0} aria-valuemax={100}>
        <div className="meter-fill" style={{ width: `${level * 100}%` }} />
      </div>
    </div>
  );
}
