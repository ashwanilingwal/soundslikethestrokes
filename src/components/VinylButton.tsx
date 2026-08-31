"use client";

import type { CSSProperties } from "react";
import type { VoiceStatus } from "@/hooks/useVoiceFx";
import { coverFor, discLabel, type Voice } from "@/lib/audio/voices";
import { LabelArt } from "./LabelArt";

/**
 * The record IS the button, and it is a picture disc: the artwork covers the
 * whole face, with the grooves as a translucent overlay so it still reads as
 * vinyl. It spins whenever audio is running, which doubles as the on-air
 * indicator - the one piece of state readable from across a room.
 *
 * The centre label is deliberately small. It only has to hold PLAY/STOP; the
 * record's name sits BELOW the disc, where there is room to read it, and the
 * artwork gets the rest of the face.
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
  // Nothing started yet and nothing blocking it: the one moment the record
  // has to advertise that it is the button.
  const idle = status === "off" && !disabled && !opening;

  const artStyle = {
    "--label-paper": voice.art.paper,
    "--label-ink": voice.art.ink,
  } as CSSProperties;

  const cover = coverFor(voice);
  const coverStyle: CSSProperties = cover
    ? { backgroundImage: `url("${cover.url}")`, backgroundPosition: cover.position }
    : {};

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        className={`vinyl-btn ${idle ? "vinyl-idle" : ""}`}
        disabled={disabled || opening}
        onClick={onClick}
        aria-pressed={active}
        aria-label={`${active ? activeLabel : idleLabel} — ${discLabel(voice)}`}
        style={artStyle}
      >
        <span className={`vinyl-disc ${active ? "vinyl-spin" : ""}`}>
          {cover ? (
            <span className="vinyl-art vinyl-cover" style={coverStyle} />
          ) : (
            <LabelArt art={voice.art} className="vinyl-art" />
          )}
          <span className="vinyl-grooves" aria-hidden />
          <span className="vinyl-label">
            <span className="vinyl-label-text">{active ? activeLabel : opening ? "…" : idleLabel}</span>
          </span>
          <span className="vinyl-hole" />
        </span>
        <span className="vinyl-sheen" aria-hidden />
      </button>

      <p className="vinyl-caption" title={discLabel(voice)}>
        {discLabel(voice)}
      </p>

      {status === "error" && message ? (
        <p className="max-w-[16rem] text-center text-xs text-accent-soft">{message}</p>
      ) : idle ? (
        <p className="vinyl-cta">▲ click to start</p>
      ) : (
        <p className="caps text-fg-dim">
          {active ? "on air" : opening ? "starting" : status === "live" ? "paused" : "ready"}
        </p>
      )}
    </div>
  );
}
