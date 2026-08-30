"use client";

import { VOICES, voiceGroups, type Voice } from "@/lib/audio/voices";

/**
 * Eleven-plus voices in one line of vertical space. The card grid this
 * replaced was honest but ate half the screen; the "what differs" copy that
 * justified it survives underneath as a single line for the current pick.
 */
export function VoicePicker({
  voice,
  onSelect,
}: {
  voice: Voice;
  onSelect: (v: Voice) => void;
}) {
  const groups = voiceGroups();

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <label htmlFor="voice-select" className="caps shrink-0 text-fg-muted">
          voice
        </label>
        <select
          id="voice-select"
          className="min-w-0 flex-1"
          value={voice.id}
          onChange={(e) => {
            const next = VOICES.find((v) => v.id === e.target.value);
            if (next) onSelect(next);
          }}
        >
          {groups.map((g) => (
            <optgroup key={g.label} label={g.label}>
              {g.voices.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label} — {v.era}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <p className="voice-varies text-[11px] leading-snug text-fg-dim">{voice.varies}</p>
    </div>
  );
}
