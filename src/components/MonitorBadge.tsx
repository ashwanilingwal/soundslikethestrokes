"use client";

import type { MonitorMode } from "@/lib/audio/graph";

/** What the modal shrinks into once the choice is made. Click to switch. */
export function MonitorBadge({
  value,
  onChange,
}: {
  value: MonitorMode;
  onChange: (m: MonitorMode) => void;
}) {
  return (
    <div className="monitor-badge" role="radiogroup" aria-label="monitor mode">
      {(["headphones", "speakers"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          role="radio"
          aria-checked={value === mode}
          aria-label={mode}
          title={mode === "headphones" ? "Headphones — clean path" : "Speakers — echo cancellation on"}
          className={`monitor-badge-btn ${value === mode ? "monitor-badge-on" : ""}`}
          onClick={() => onChange(mode)}
        >
          <span aria-hidden>{mode === "headphones" ? "🎧" : "🔊"}</span>
        </button>
      ))}
    </div>
  );
}
