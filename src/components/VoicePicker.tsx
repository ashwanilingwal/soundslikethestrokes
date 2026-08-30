"use client";

import {
  CATEGORIES,
  shortLabel,
  voiceForCategory,
  voicesIn,
  yearLabel,
  type Category,
  type Voice,
} from "@/lib/audio/voices";

/**
 * Two rows of buttons rather than two dropdowns: what you can pick is visible
 * without opening anything, which is the whole point of a shelf of records.
 * Row one is the bucket, row two is what is in it.
 */
export function VoicePicker({
  voice,
  onSelect,
}: {
  voice: Voice;
  onSelect: (v: Voice) => void;
}) {
  const options = voicesIn(voice.category);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="seg-row" role="group" aria-label="voice category">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`seg ${c.id === voice.category ? "seg-on" : ""}`}
            aria-pressed={c.id === voice.category}
            onClick={() => onSelect(voiceForCategory(c.id as Category, voice))}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="seg-row" role="group" aria-label={voice.category === "auto" ? "singer" : "era"}>
        {options.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`seg seg-voice ${v.id === voice.id ? "seg-on" : ""}`}
            aria-pressed={v.id === voice.id}
            onClick={() => onSelect(v)}
          >
            <span className="seg-name">{shortLabel(v)}</span>
            <span className="seg-year">{yearLabel(v)}</span>
          </button>
        ))}
      </div>

      <p className="voice-varies">{voice.varies}</p>
    </div>
  );
}
