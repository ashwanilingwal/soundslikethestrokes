"use client";

import type { MonitorMode } from "@/lib/audio/graph";

/**
 * Still a gate - Start stays disabled until a mode is actively chosen - but
 * speakers are now a real option, not a forbidden one. Headphones run the
 * clean path (all browser processing off); speaker mode turns the browser's
 * echo cancellation on, which is what stops voice -> speakers -> mic from
 * howling, at the cost of the AEC sometimes ducking or warbling the effect.
 */
export function MonitorPicker({
  value,
  onChange,
}: {
  value: MonitorMode | null;
  onChange: (v: MonitorMode) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label="monitor mode">
      <button
        type="button"
        role="radio"
        aria-checked={value === "headphones"}
        className={`preset-card ${value === "headphones" ? "preset-card-on" : ""}`}
        onClick={() => onChange("headphones")}
      >
        <span className="block text-base font-bold">🎧 headphones</span>
        <span className="mt-1 block text-sm text-fg-muted">
          The good mode: clean untouched sound, lowest latency. Wired beats Bluetooth (which adds 100–300&nbsp;ms).
        </span>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === "speakers"}
        className={`preset-card ${value === "speakers" ? "preset-card-on" : ""}`}
        onClick={() => onChange("speakers")}
      >
        <span className="block text-base font-bold">🔊 speakers</span>
        <span className="mt-1 block text-sm text-fg-muted">
          Echo cancellation stops the feedback howl, but it can duck or warble the robot voice. Keep the volume
          moderate; if it still howls, turn it down.
        </span>
      </button>
    </div>
  );
}
