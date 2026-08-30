"use client";

import type { VoiceStatus } from "@/hooks/useVoiceFx";

export function MicButton({
  status,
  message,
  disabled,
  onStart,
  onStop,
}: {
  status: VoiceStatus;
  message: string | null;
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
        className={`mic-btn ${live ? "mic-btn-live" : ""}`}
        disabled={disabled || opening}
        onClick={live ? onStop : onStart}
        aria-pressed={live}
      >
        {live ? "STOP" : opening ? "…" : "GO LIVE"}
      </button>
      {status === "error" && message ? (
        <p className="max-w-xs text-center text-sm text-accent-soft">{message}</p>
      ) : (
        <p className="caps text-fg-dim">{live ? "on air" : opening ? "opening mic" : disabled ? "tick the headphone box first" : "mic off"}</p>
      )}
    </div>
  );
}
