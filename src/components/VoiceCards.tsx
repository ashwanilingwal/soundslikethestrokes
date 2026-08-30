"use client";

import { ARTISTS, VOICES, type Voice } from "@/lib/audio/voices";
import { LabelArt } from "./LabelArt";

/**
 * Grouped by singer, and every card says what actually differs from its
 * siblings - "Julian I / II / III" alone tells you nothing, which is exactly
 * the problem with most preset lists. Each card carries a miniature of the
 * record label it selects.
 */
export function VoiceCards({
  currentId,
  onSelect,
}: {
  currentId: string;
  onSelect: (v: Voice) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {ARTISTS.map((artist) => (
        <section key={artist.id} className="flex flex-col gap-2">
          <header className="flex items-baseline gap-2">
            <h2 className="text-sm font-bold">{artist.name}</h2>
            <span className="text-xs text-fg-dim">{artist.band}</span>
          </header>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {VOICES.filter((v) => v.artist === artist.id).map((v) => (
              <button
                key={v.id}
                type="button"
                className={`voice-card ${v.id === currentId ? "voice-card-on" : ""}`}
                onClick={() => onSelect(v)}
                aria-pressed={v.id === currentId}
              >
                <span className="voice-card-head">
                  <LabelArt art={v.art} className="voice-card-disc" />
                  <span className="font-bold">{v.label}</span>
                  {v.autotuned && <span className="voice-tag">auto</span>}
                </span>
                <span className="mt-1 block text-[11px] uppercase tracking-wide text-accent-soft">{v.era}</span>
                <span className="mt-1.5 block text-xs leading-snug text-fg-muted">{v.varies}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
