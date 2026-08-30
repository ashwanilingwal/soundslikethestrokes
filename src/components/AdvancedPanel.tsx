"use client";

import type { AdvancedParams } from "@/lib/audio/graph";
import type { VoiceParams } from "@/lib/audio/voices";
import { NOTE_NAMES, type ScaleChoice } from "@/lib/dsp/scales";

/**
 * Everything the macros normally decide for you. Values shown here are the
 * resolved ones; touching a slider pins that parameter until the voice or a
 * macro changes, which is why there is a visible reset.
 */

function Slider({
  label,
  hint,
  value,
  min,
  max,
  step,
  unit,
  format,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-baseline justify-between text-xs">
        <span className="text-fg-muted">{label}</span>
        <span className="num text-fg">
          {format ? format(value) : Math.round(value * 100) / 100}
          {unit ?? ""}
        </span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      {hint && <span className="text-[11px] leading-snug text-fg-dim">{hint}</span>}
    </label>
  );
}

export function AdvancedPanel({
  params,
  cleanup,
  scale,
  hasOverrides,
  noiseCancellation,
  onOverride,
  onCleanup,
  onScale,
  onReset,
  onNoiseCancellation,
}: {
  params: AdvancedParams;
  cleanup: { gateDb: number; denoise: number };
  scale: ScaleChoice;
  hasOverrides: boolean;
  noiseCancellation: boolean;
  onOverride: (patch: Partial<VoiceParams>) => void;
  onCleanup: (patch: Partial<{ gateDb: number; denoise: number }>) => void;
  onScale: (choice: ScaleChoice) => void;
  onReset: () => void;
  onNoiseCancellation: (on: boolean) => void;
}) {
  const scaleValue = scale.kind === "chromatic" ? "chromatic" : `${scale.kind}:${scale.root}`;

  return (
    <details className="card p-4">
      <summary className="caps cursor-pointer select-none text-fg-muted">fine tuning</summary>

      <div className="mt-4 flex flex-col gap-5">
        <section className="flex flex-col gap-3">
          <h3 className="caps text-accent-soft">clean-up</h3>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={noiseCancellation}
              onChange={(e) => onNoiseCancellation(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
            />
            <span className="text-xs">
              <span className="font-semibold text-fg">Background noise cancellation</span>
              <span className="mt-0.5 block leading-snug text-fg-dim">
                The browser&apos;s own suppressor, applied at the microphone. This pulls steady noise — fans, traffic,
                hum — out from <em>underneath</em> your voice while you speak. The gate below can only silence the gaps
                between words, so the two do different jobs.
              </span>
            </span>
          </label>
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            <Slider
              label="room-noise removal"
              hint="Learns the room's own level while you're quiet, and needs a periodic (voiced) signal to open. 0 turns the smarts off."
              value={cleanup.denoise}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => onCleanup({ denoise: v })}
            />
            <Slider
              label="gate floor"
              hint="Hard minimum, under the learned one. -75 disables it."
              value={cleanup.gateDb}
              min={-75}
              max={-25}
              step={1}
              unit=" dB"
              onChange={(v) => onCleanup({ gateDb: v })}
            />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="caps text-accent-soft">tuning</h3>
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
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
            <Slider label="retune glide" hint="0 = hard robotic snap." value={params.retuneGlideMs} min={0} max={250} step={5} unit=" ms" onChange={(v) => onOverride({ retuneGlideMs: v })} />
            <Slider label="transpose" hint="Shifts the snapped note. Negative = lower register." value={params.semitoneShift} min={-12} max={12} step={1} unit=" st" format={(v) => String(Math.round(v))} onChange={(v) => onOverride({ semitoneShift: v })} />
            <Slider label="dry / wet" value={params.dryWet} min={0} max={1} step={0.05} onChange={(v) => onOverride({ dryWet: v })} />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="caps text-accent-soft">dirt</h3>
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            <Slider label="overdrive" value={params.drive} min={1} max={20} step={0.5} onChange={(v) => onOverride({ drive: v })} />
            <Slider label="bit depth" value={params.bits} min={4} max={16} step={1} unit=" bit" format={(v) => String(Math.round(v))} onChange={(v) => onOverride({ bits: v })} />
            <Slider label="downsample" value={params.downsampleFactor} min={1} max={16} step={1} unit="×" format={(v) => String(Math.round(v))} onChange={(v) => onOverride({ downsampleFactor: v })} />
            <Slider label="warble rate" value={params.warbleHz} min={0} max={10} step={0.5} unit=" Hz" onChange={(v) => onOverride({ warbleHz: v })} />
            <Slider label="warble depth" value={params.warbleCents} min={0} max={100} step={5} unit=" ¢" format={(v) => String(Math.round(v))} onChange={(v) => onOverride({ warbleCents: v })} />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="caps text-accent-soft">tone</h3>
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            <Slider label="low cut" value={params.highpassHz} min={60} max={1000} step={10} unit=" Hz" format={(v) => String(Math.round(v))} onChange={(v) => onOverride({ highpassHz: v })} />
            <Slider label="high cut" value={params.lowpassHz} min={1000} max={12000} step={100} unit=" Hz" format={(v) => String(Math.round(v))} onChange={(v) => onOverride({ lowpassHz: v })} />
            <Slider label="presence (bite)" value={params.presenceDb} min={0} max={12} step={0.5} unit=" dB" onChange={(v) => onOverride({ presenceDb: v })} />
            <Slider label="room" value={params.roomMix} min={0} max={1} step={0.05} onChange={(v) => onOverride({ roomMix: v })} />
          </div>
        </section>

        {hasOverrides && (
          <button type="button" className="btn self-start" onClick={onReset}>
            reset to the voice
          </button>
        )}
      </div>
    </details>
  );
}
