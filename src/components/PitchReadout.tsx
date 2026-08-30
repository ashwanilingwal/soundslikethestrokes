"use client";

import type { Telemetry } from "@/lib/audio/graph";
import { midiName } from "@/lib/dsp/scales";

/**
 * What you sang -> what the tuner forced it to, plus level. Driven entirely
 * by the worklet's telemetry (~23/s); no AnalyserNode polling needed.
 */
export function PitchReadout({ telemetry, live }: { telemetry: Telemetry | null; live: boolean }) {
  const voiced = live && telemetry !== null && telemetry.hz > 0 && telemetry.targetMidi > 0;
  // Speech RMS peaks around 0.1-0.3; map the useful range onto the bar.
  const level = telemetry ? Math.min(1, telemetry.rms * 4) : 0;

  return (
    <div className="card flex flex-col gap-1.5 px-3 py-2">
      <div className="flex items-baseline justify-center gap-3">
        <span className={`num text-lg ${voiced ? "text-fg" : "text-fg-dim"}`}>
          {voiced ? midiName(telemetry.midi) : "—"}
        </span>
        <span className="text-xs text-fg-dim" aria-hidden>
          →
        </span>
        <span className={`num text-lg ${voiced ? "text-tape" : "text-fg-dim"}`}>
          {voiced ? midiName(telemetry.targetMidi) : "—"}
        </span>
        <span className="num ml-2 text-[10px] text-fg-dim">{voiced ? `${telemetry.hz.toFixed(0)} Hz` : "no pitch"}</span>
      </div>
      <div
        className="meter"
        role="meter"
        aria-label="input level"
        aria-valuenow={Math.round(level * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="meter-fill" style={{ width: `${level * 100}%` }} />
      </div>
    </div>
  );
}
