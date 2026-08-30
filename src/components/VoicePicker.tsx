"use client";

import {
  CATEGORIES,
  optionLabel,
  voiceForCategory,
  voicesIn,
  type Category,
  type Voice,
} from "@/lib/audio/voices";

/**
 * Two steps, one row. Step one is what kind of sound you want; step two is
 * who. Under Autotune step two lists SINGERS, because "I want the robot
 * voice" is a different question from "I want that record's vocal sound" -
 * everywhere else it lists eras, since the bucket already implies the singer.
 */
export function VoicePicker({
  voice,
  onSelect,
}: {
  voice: Voice;
  onSelect: (v: Voice) => void;
}) {
  const options = voicesIn(voice.category);
  const category = CATEGORIES.find((c) => c.id === voice.category);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <label htmlFor="voice-category" className="caps shrink-0 text-fg-muted">
          voice
        </label>
        <select
          id="voice-category"
          className="min-w-0 flex-1"
          aria-label="voice category"
          value={voice.category}
          onChange={(e) => onSelect(voiceForCategory(e.target.value as Category, voice))}
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          id="voice-select"
          className="min-w-0 flex-1"
          aria-label={voice.category === "auto" ? "singer" : "era"}
          value={voice.id}
          onChange={(e) => {
            const next = options.find((v) => v.id === e.target.value);
            if (next) onSelect(next);
          }}
        >
          {options.map((v) => (
            <option key={v.id} value={v.id}>
              {optionLabel(v)}
            </option>
          ))}
        </select>
      </div>
      <p className="voice-varies text-[11px] leading-snug text-fg-dim">
        {category && <span className="text-fg-muted">{category.hint} · </span>}
        {voice.varies}
      </p>
    </div>
  );
}
