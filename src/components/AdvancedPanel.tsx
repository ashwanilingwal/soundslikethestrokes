"use client";

import { useRef, useState } from "react";
import type { AdvancedParams } from "@/lib/audio/graph";
import type { AudioDevice } from "@/lib/audio/devices";
import type { VoiceParams } from "@/lib/audio/voices";
import { copyFor } from "@/lib/controlCopy";
import { NOTE_NAMES, type ScaleChoice } from "@/lib/dsp/scales";
import { InfoButton } from "./InfoButton";

/**
 * Every control the macros normally decide for you, plus save/load.
 *
 * Values shown are the RESOLVED ones; touching a slider pins that parameter
 * until the voice or a macro changes, which is why there is a visible reset.
 *
 * Labels, one-liners and the (i) text all come from lib/controlCopy, so a
 * control is described identically here and in the sound guide.
 */

function Slider({
  id,
  value,
  min,
  max,
  step,
  unit,
  format,
  onChange,
}: {
  id: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const copy = copyFor(id);
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-baseline justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5 text-fg-muted">
          {copy.label}
          <InfoButton term={copy.label} whatItDoes={copy.whatItDoes} inTheWild={copy.inTheWild} />
        </span>
        <span className="num shrink-0 text-fg">
          {format ? format(value) : Math.round(value * 100) / 100}
          {unit ?? ""}
        </span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      {copy.oneLiner && <span className="text-[11px] leading-snug text-fg-dim">{copy.oneLiner}</span>}
    </label>
  );
}

/**
 * Each group gets its own colour, glyph and one-line purpose.
 *
 * Six identical cyan headings gave no clue which knobs belonged together or
 * why you would open one rather than another. The colour is carried on a
 * custom property so the rule set stays one block rather than six.
 */
const GROUPS = {
  io: { tint: "var(--fg-muted)", glyph: "⇄", title: "in / out", blurb: "Which microphone goes in, and where the sound comes out." },
  clean: { tint: "var(--ok)", glyph: "◌", title: "clean-up / noise", blurb: "Removing everything that is not your voice." },
  pitch: { tint: "var(--cyan)", glyph: "♪", title: "tuning / pitch", blurb: "How hard the pitch snaps, and which notes it is allowed to land on." },
  dirt: { tint: "var(--accent)", glyph: "▲", title: "dirt / distortion", blurb: "Saturation and deliberate digital breakage." },
  tone: { tint: "var(--amber)", glyph: "◐", title: "tone / eq", blurb: "Which frequencies survive, and which get thrown away." },
  space: { tint: "#c08cff", glyph: "◜", title: "space / reverb & echo", blurb: "How far away, and in what kind of room." },
} as const;

function Section({ group, children }: { group: keyof typeof GROUPS; children: React.ReactNode }) {
  const g = GROUPS[group];
  return (
    <section className="tweak-section" style={{ ["--sec" as string]: g.tint }}>
      <header className="tweak-head">
        <span className="tweak-glyph" aria-hidden>
          {g.glyph}
        </span>
        <span className="tweak-head-text">
          <span className="tweak-title">{g.title}</span>
          <span className="tweak-blurb">{g.blurb}</span>
        </span>
      </header>
      <div className="tweak-body grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function AdvancedPanel({
  params,
  cleanup,
  scale,
  hasOverrides,
  noiseCancellation,
  devices,
  inputDeviceId,
  outputDeviceId,
  canChooseOutput,
  onInputDevice,
  onOutputDevice,
  onOverride,
  onCleanup,
  hasNoiseProfile,
  onScale,
  onReset,
  onNoiseCancellation,
  onExport,
  onImport,
}: {
  params: AdvancedParams;
  cleanup: { gateDb: number; denoise: number; noiseReduction: number };
  scale: ScaleChoice;
  hasOverrides: boolean;
  noiseCancellation: boolean;
  devices: { inputs: AudioDevice[]; outputs: AudioDevice[] };
  inputDeviceId: string;
  outputDeviceId: string;
  canChooseOutput: boolean;
  onInputDevice: (id: string) => void;
  onOutputDevice: (id: string) => void;
  onOverride: (patch: Partial<VoiceParams>) => void;
  onCleanup: (patch: Partial<{ gateDb: number; denoise: number; noiseReduction: number }>) => void;
  /** Only gates the amount slider; measuring lives on the deck. */
  hasNoiseProfile: boolean;
  onScale: (choice: ScaleChoice) => void;
  onReset: () => void;
  onNoiseCancellation: (on: boolean) => void;
  onExport: () => void;
  onImport: (file: File) => Promise<string[]>;
}) {
  const scaleValue = scale.kind === "chromatic" ? "chromatic" : `${scale.kind}:${scale.root}`;
  const fileRef = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState<string[]>([]);

  return (
    <details className="card">
      <summary className="panel-toggle">
        <span className="panel-toggle-title">Tweak the sound</span>
        <span className="panel-toggle-sub">every control, what it does, save &amp; load</span>
        <span className="panel-toggle-chev" aria-hidden>
          ▾
        </span>
      </summary>

      <div className="flex flex-col gap-5 p-4">
        <div className="preset-row">
          <button type="button" className="btn btn-sm" onClick={onExport}>
            ⭳ save preset
          </button>
          <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>
            ⭱ load preset
          </button>
          {hasOverrides && (
            <button type="button" className="btn btn-sm" onClick={onReset}>
              reset tweaks
            </button>
          )}
          <span className="preset-note">
            {notes.length > 0 ? (
              <span className="preset-warn">{notes.slice(0, 3).join(" ")}</span>
            ) : (
              "Saves as a CSV you can open in a spreadsheet, edit by hand, and share."
            )}
          </span>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) setNotes(await onImport(f));
            }}
          />
        </div>

        <Section group="io">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-fg-muted">microphone</span>
            <select value={inputDeviceId} onChange={(e) => onInputDevice(e.target.value)}>
              <option value="">System default</option>
              {devices.inputs.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
            </select>
            {devices.inputs.length === 0 && (
              <span className="text-[10px] text-fg-dim">Names appear once you have allowed the mic once.</span>
            )}
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-fg-muted">output / speakers</span>
            <select value={outputDeviceId} disabled={!canChooseOutput} onChange={(e) => onOutputDevice(e.target.value)}>
              <option value="">System default</option>
              {devices.outputs.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
            </select>
            {!canChooseOutput && (
              <span className="text-[10px] text-fg-dim">
                This browser can&apos;t pick an output — choose it in your system settings.
              </span>
            )}
          </label>
        </Section>

        <section className="tweak-section" style={{ ["--sec" as string]: GROUPS.clean.tint }}>
          <header className="tweak-head">
            <span className="tweak-glyph" aria-hidden>
              {GROUPS.clean.glyph}
            </span>
            <span className="tweak-head-text">
              <span className="tweak-title">{GROUPS.clean.title}</span>
              <span className="tweak-blurb">{GROUPS.clean.blurb}</span>
            </span>
          </header>
          <label className="tweak-body flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={noiseCancellation}
              onChange={(e) => onNoiseCancellation(e.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <span className="text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-fg">
                {copyFor("noiseCancellation").label}
                <InfoButton
                  term={copyFor("noiseCancellation").label}
                  whatItDoes={copyFor("noiseCancellation").whatItDoes}
                  inTheWild={copyFor("noiseCancellation").inTheWild}
                />
              </span>
              <span className="mt-0.5 block leading-snug text-fg-dim">{copyFor("noiseCancellation").oneLiner}</span>
            </span>
          </label>
          {/* The measure/undo action lives on the deck, where it is visible
              without opening anything. Only the amount belongs in here. */}
          {hasNoiseProfile && (
            <div className="room-print">
              <span className="room-print-title">
                Room print active
                <InfoButton
                  term="room print"
                  whatItDoes="A few seconds of your room were measured and that exact frequency fingerprint is now being subtracted from everything, including underneath your voice while you talk."
                  inTheWild="Studios call this a noise print. It is how room tone recorded on set gets used to strip air-conditioning off dialogue, and it removes far more than a gate can, because a gate only silences the gaps between words."
                />
              </span>
              <Slider
                id="noiseReduction"
                value={cleanup.noiseReduction}
                min={0}
                max={1}
                step={0.05}
                onChange={(v) => onCleanup({ noiseReduction: v })}
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            <Slider id="denoise" value={cleanup.denoise} min={0} max={1} step={0.05} onChange={(v) => onCleanup({ denoise: v })} />
            <Slider id="gateDb" value={cleanup.gateDb} min={-75} max={-25} step={1} unit=" dB" onChange={(v) => onCleanup({ gateDb: v })} />
          </div>
        </section>

        <section className="tweak-section" style={{ ["--sec" as string]: GROUPS.pitch.tint }}>
          <header className="tweak-head">
            <span className="tweak-glyph" aria-hidden>
              {GROUPS.pitch.glyph}
            </span>
            <span className="tweak-head-text">
              <span className="tweak-title">{GROUPS.pitch.title}</span>
              <span className="tweak-blurb">{GROUPS.pitch.blurb}</span>
            </span>
          </header>
          <div className="tweak-body grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="flex items-center gap-1.5 text-xs text-fg-muted">
                {copyFor("key").label}
                <InfoButton term={copyFor("key").label} whatItDoes={copyFor("key").whatItDoes} inTheWild={copyFor("key").inTheWild} />
              </span>
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
            <Slider id="retuneGlideMs" value={params.retuneGlideMs} min={0} max={400} step={5} unit=" ms" onChange={(v) => onOverride({ retuneGlideMs: v })} />
            <Slider id="semitoneShift" value={params.semitoneShift} min={-12} max={12} step={1} format={(v) => (v > 0 ? `+${v}` : `${v}`)} onChange={(v) => onOverride({ semitoneShift: v })} />
            <Slider id="dryWet" value={params.dryWet} min={0} max={1} step={0.05} onChange={(v) => onOverride({ dryWet: v })} />
          </div>
        </section>

        <Section group="dirt">
          <Slider id="drive" value={params.drive} min={1} max={20} step={0.5} onChange={(v) => onOverride({ drive: v })} />
          <Slider id="bits" value={params.bits} min={4} max={16} step={1} unit=" bit" onChange={(v) => onOverride({ bits: v })} />
          <Slider id="downsampleFactor" value={params.downsampleFactor} min={1} max={16} step={1} unit="×" onChange={(v) => onOverride({ downsampleFactor: v })} />
          <Slider id="warbleHz" value={params.warbleHz} min={0} max={12} step={0.1} unit=" Hz" onChange={(v) => onOverride({ warbleHz: v })} />
          <Slider id="warbleCents" value={params.warbleCents} min={0} max={100} step={1} unit="¢" onChange={(v) => onOverride({ warbleCents: v })} />
        </Section>

        <Section group="tone">
          <Slider id="highpassHz" value={params.highpassHz} min={40} max={2000} step={10} unit=" Hz" format={(v) => String(Math.round(v))} onChange={(v) => onOverride({ highpassHz: v })} />
          <Slider id="lowpassHz" value={params.lowpassHz} min={800} max={20000} step={100} unit=" Hz" format={(v) => String(Math.round(v))} onChange={(v) => onOverride({ lowpassHz: v })} />
          <Slider id="presenceDb" value={params.presenceDb} min={-6} max={18} step={0.5} unit=" dB" onChange={(v) => onOverride({ presenceDb: v })} />
        </Section>

        <Section group="space">
          <Slider id="roomMix" value={params.roomMix} min={0} max={1} step={0.02} onChange={(v) => onOverride({ roomMix: v })} />
          <Slider id="echoMs" value={params.echoMs} min={0} max={500} step={5} unit=" ms" format={(v) => (v === 0 ? "off" : String(Math.round(v)))} onChange={(v) => onOverride({ echoMs: v })} />
          <Slider id="echoFeedback" value={params.echoFeedback} min={0} max={0.75} step={0.01} onChange={(v) => onOverride({ echoFeedback: v })} />
          <Slider id="echoMix" value={params.echoMix} min={0} max={0.6} step={0.02} onChange={(v) => onOverride({ echoMix: v })} />
        </Section>
      </div>
    </details>
  );
}
