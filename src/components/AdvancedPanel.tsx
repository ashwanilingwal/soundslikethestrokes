"use client";

import type { AdvancedParams } from "@/lib/audio/graph";
import { NOTE_NAMES, type ScaleChoice } from "@/lib/dsp/scales";

/**
 * Every knob behind the presets, collapsed by default. A preset is a starting
 * point; moving a slider departs from it live.
 */

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-baseline justify-between text-xs">
        <span className="text-fg-muted">{label}</span>
        <span className="num text-fg">
          {value}
          {unit ?? ""}
        </span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export function AdvancedPanel({
  params,
  scale,
  onParams,
  onScale,
}: {
  params: AdvancedParams;
  scale: ScaleChoice;
  onParams: (patch: Partial<AdvancedParams>) => void;
  onScale: (choice: ScaleChoice) => void;
}) {
  const scaleValue = scale.kind === "chromatic" ? "chromatic" : `${scale.kind}:${scale.root}`;

  return (
    <details className="card p-4">
      <summary className="caps cursor-pointer select-none text-fg-muted">the knobs</summary>
      <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs text-fg-muted">key</span>
          <select
            value={scaleValue}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "chromatic") onScale({ kind: "chromatic" });
              else {
                const [kind, root] = v.split(":");
                onScale({ kind: kind as "major" | "minor", root: Number(root) });
              }
            }}
          >
            <option value="chromatic">Chromatic (every semitone)</option>
            {NOTE_NAMES.map((n, i) => (
              <option key={`M${i}`} value={`major:${i}`}>
                {n} major
              </option>
            ))}
            {NOTE_NAMES.map((n, i) => (
              <option key={`m${i}`} value={`minor:${i}`}>
                {n} minor
              </option>
            ))}
          </select>
        </label>
        <Slider label="retune glide" value={params.retuneGlideMs} min={0} max={200} step={5} unit=" ms" onChange={(v) => onParams({ retuneGlideMs: v })} />
        <Slider label="dry / wet" value={params.dryWet} min={0} max={1} step={0.05} onChange={(v) => onParams({ dryWet: v })} />
        <Slider label="drive" value={params.drive} min={1} max={12} step={0.5} onChange={(v) => onParams({ drive: v })} />
        <Slider label="bit depth" value={params.bits} min={4} max={16} step={1} unit=" bit" onChange={(v) => onParams({ bits: v })} />
        <Slider label="downsample" value={params.downsampleFactor} min={1} max={16} step={1} unit="×" onChange={(v) => onParams({ downsampleFactor: v })} />
        <Slider label="low cut" value={params.highpassHz} min={60} max={1000} step={20} unit=" Hz" onChange={(v) => onParams({ highpassHz: v })} />
        <Slider label="high cut" value={params.lowpassHz} min={1000} max={12000} step={100} unit=" Hz" onChange={(v) => onParams({ lowpassHz: v })} />
        <Slider label="presence (mid bite)" value={params.presenceDb} min={0} max={12} step={1} unit=" dB" onChange={(v) => onParams({ presenceDb: v })} />
        <Slider label="noise gate (-75 = off)" value={params.gateDb} min={-75} max={-25} step={1} unit=" dB" onChange={(v) => onParams({ gateDb: v })} />
        <Slider label="warble rate" value={params.warbleHz} min={0} max={10} step={0.5} unit=" Hz" onChange={(v) => onParams({ warbleHz: v })} />
        <Slider label="warble depth" value={params.warbleCents} min={0} max={100} step={5} unit=" ¢" onChange={(v) => onParams({ warbleCents: v })} />
        <Slider label="output (boost past 1)" value={params.masterGain} min={0} max={2.5} step={0.05} onChange={(v) => onParams({ masterGain: v })} />
      </div>
    </details>
  );
}
