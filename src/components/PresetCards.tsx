"use client";

import { PRESETS, type Preset } from "@/lib/audio/presets";

export function PresetCards({
  currentId,
  onSelect,
}: {
  currentId: string;
  onSelect: (p: Preset) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {PRESETS.map((p) => (
        <button
          key={p.id}
          type="button"
          className={`preset-card ${p.id === currentId ? "preset-card-on" : ""}`}
          onClick={() => onSelect(p)}
          aria-pressed={p.id === currentId}
        >
          <span className="block text-base font-bold">{p.label}</span>
          <span className="mt-1 block text-sm text-fg-muted">{p.tagline}</span>
        </button>
      ))}
    </div>
  );
}
