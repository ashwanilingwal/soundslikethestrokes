"use client";

/**
 * The only three controls most people should ever touch. Everything else
 * lives behind the fine-tuning panel.
 */

const MATCH_STOPS = [0.01, 0.5, 0.7, 1];

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
    <div className="card flex flex-col gap-5 p-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <label htmlFor="macro-match" className="text-sm font-bold">
            How much {voiceLabel}
          </label>
          <span className="num text-sm text-accent-soft">{Math.round(match * 100)}%</span>
        </div>
        <input
          id="macro-match"
          type="range"
          min={0.01}
          max={1}
          step={0.01}
          value={match}
          onChange={(e) => onChange({ match: Number(e.target.value) })}
        />
        <div className="flex items-center gap-2">
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
          <span className="ml-auto text-xs text-fg-dim">1% = your voice · 100% = full character</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <label htmlFor="macro-robot" className="text-sm font-bold">
            Robot
          </label>
          <span className="num text-sm text-accent-soft">{Math.round(robot * 100)}%</span>
        </div>
        <input
          id="macro-robot"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={robot}
          onChange={(e) => onChange({ robot: Number(e.target.value) })}
        />
        <span className="text-xs text-fg-dim">
          Kills the pitch glide, crushes harder and drives hotter — the hard T-Pain snap, independent of the voice.
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <label htmlFor="macro-volume" className="text-sm font-bold">
            Volume
          </label>
          <span className="num text-sm text-accent-soft">{Math.round(volume * 100)}%</span>
        </div>
        <input
          id="macro-volume"
          type="range"
          min={0}
          max={2.5}
          step={0.05}
          value={volume}
          onChange={(e) => onChange({ volume: Number(e.target.value) })}
        />
        <span className="text-xs text-fg-dim">Above 100% drives the limiter, which keeps it from clipping.</span>
      </div>
    </div>
  );
}
