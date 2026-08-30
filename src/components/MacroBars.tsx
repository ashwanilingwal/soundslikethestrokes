"use client";

/**
 * The only three controls most people should ever touch. Everything else
 * lives behind the fine-tuning panel.
 */

const MATCH_STOPS = [0.01, 0.5, 0.7, 1];

function Row({
  id,
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-xs font-bold">
          {label}
        </label>
        <span className="num text-xs text-accent-soft">{display}</span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      {children}
    </div>
  );
}

export function MacroBars({
  match,
  robot,
  volume,
  voiceLabel,
  onChange,
}: {
  match: number;
  robot: number;
  volume: number;
  voiceLabel: string;
  onChange: (patch: { match?: number; robot?: number; volume?: number }) => void;
}) {
  return (
    <div className="macro-card card flex flex-col gap-2 px-3 py-2.5">
      <Row
        id="macro-match"
        label={`How much ${voiceLabel}`}
        value={match}
        display={`${Math.round(match * 100)}%`}
        min={0.01}
        max={1}
        step={0.01}
        onChange={(v) => onChange({ match: v })}
      >
        <div className="flex items-center gap-1.5">
          {MATCH_STOPS.map((s) => (
            <button
              key={s}
              type="button"
              className={`chip ${Math.abs(match - s) < 0.005 ? "chip-on" : ""}`}
              onClick={() => onChange({ match: s })}
            >
              {Math.round(s * 100)}%
            </button>
          ))}
          <span className="ml-auto text-[10px] text-fg-dim">1% = you · 100% = full</span>
        </div>
      </Row>

      <Row
        id="macro-robot"
        label="Robot"
        value={robot}
        display={`${Math.round(robot * 100)}%`}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => onChange({ robot: v })}
      />

      <Row
        id="macro-volume"
        label="Volume"
        value={volume}
        display={`${Math.round(volume * 100)}%`}
        min={0}
        max={2.5}
        step={0.05}
        onChange={(v) => onChange({ volume: v })}
      />
    </div>
  );
}
