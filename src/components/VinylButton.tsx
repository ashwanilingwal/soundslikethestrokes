"use client";

import type { VoiceStatus } from "@/hooks/useVoiceFx";

/**
 * The record IS the button. It spins while the mic is live, which doubles as
 * the on-air indicator - the one piece of state you should be able to read
 * from across the room.
 */
export function VinylButton({
  status,
  message,
  label,
  disabled,
  onStart,
  onStop,
}: {
  status: VoiceStatus;
  message: string | null;
  label: string;
  disabled: boolean;
  onStart: () => void;
  onStop: () => void;
}) {
  const live = status === "live";
  const opening = status === "opening";

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        className="vinyl-btn"
        disabled={disabled || opening}
        onClick={live ? onStop : onStart}
        aria-pressed={live}
        aria-label={live ? "stop" : "go live"}
      >
        <span className={`vinyl-disc ${live ? "vinyl-spin" : ""}`}>
          <span className="vinyl-label">
            <span className="vinyl-label-text">{live ? "STOP" : opening ? "…" : "PLAY"}</span>
            <span className="vinyl-label-sub">{label}</span>
          </span>
          <span className="vinyl-hole" />
        </span>
        <span className="vinyl-sheen" aria-hidden />
      </button>

      {status === "error" && message ? (
        <p className="max-w-xs text-center text-sm text-accent-soft">{message}</p>
      ) : (
        <p className="caps text-fg-dim">{live ? "on air" : opening ? "opening mic" : "not recording"}</p>
      )}
    </div>
  );
}
