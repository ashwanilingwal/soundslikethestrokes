"use client";

import type { CSSProperties } from "react";
import type { VoiceStatus } from "@/hooks/useVoiceFx";
import { discLabel, type Voice } from "@/lib/audio/voices";
import { LabelArt } from "./LabelArt";

/**
 * The record IS the button, and it is a picture disc: the voice's artwork
 * covers the whole face, with the grooves as a translucent overlay on top so
 * it still reads as vinyl. It spins while the mic is live, which doubles as
 * the on-air indicator - the one piece of state readable from across a room.
 */
export function VinylButton({
  status,
  message,
  voice,
  disabled,
  active,
  idleLabel,
  activeLabel,
  onClick,
}: {
  status: VoiceStatus;
  message: string | null;
  voice: Voice;
  disabled: boolean;
  /** Spinning and showing the stop face. For a file this is "playing", which
   *  is not the same as "the graph exists" - a paused file is still loaded. */
  active: boolean;
  idleLabel: string;
  activeLabel: string;
  onClick: () => void;
}) {
  const opening = status === "opening";
  // Nothing has been started yet and nothing is blocking it: the one moment
  // the record needs to advertise that it is the button.
  const idle = status === "off" && !disabled && !opening;

  const artStyle = {
    "--label-paper": voice.art.paper,
    "--label-ink": voice.art.ink,
  } as CSSProperties;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        className={`vinyl-btn ${idle ? "vinyl-idle" : ""}`}
        disabled={disabled || opening}
        onClick={onClick}
        aria-pressed={active}
        aria-label={active ? activeLabel : idleLabel}
        style={artStyle}
      >
        <span className={`vinyl-disc ${active ? "vinyl-spin" : ""}`}>
          {voice.cover ? (
            <span className="vinyl-art vinyl-cover" style={{ backgroundImage: `url("${voice.cover}")` }} />
          ) : (
            <LabelArt art={voice.art} className="vinyl-art" />
          )}
          <span className="vinyl-grooves" aria-hidden />
          <span className="vinyl-label">
            <span className="vinyl-label-text">{active ? activeLabel : opening ? "…" : idleLabel}</span>
            <span className="vinyl-label-sub">{discLabel(voice)}</span>
          </span>
          <span className="vinyl-hole" />
        </span>
        <span className="vinyl-sheen" aria-hidden />
      </button>

      {status === "error" && message ? (
        <p className="max-w-[16rem] text-center text-xs text-accent-soft">{message}</p>
      ) : idle ? (
        <p className="vinyl-hint">▲ click the record</p>
      ) : (
        <p className="caps text-fg-dim">
          {active ? "on air" : opening ? "starting" : status === "live" ? "paused" : "ready"}
        </p>
      )}
    </div>
  );
}
