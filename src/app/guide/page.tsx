"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { SOUND_GUIDE } from "@/lib/soundGuide";

/**
 * The long-form companion to the (i) popovers.
 *
 * Laid out as an ARTICLE, not an accordion. Hiding the text behind toggles
 * made it look like reference data nobody wants to open; everything is on the
 * page now, with a sticky rail to jump by. Each entry leads with the plain
 * sentence set large, so you can skim only the leads and still come away
 * knowing what every control does.
 *
 * Section colours and glyphs deliberately match the drawers in "Tweak the
 * sound", so the thing you read here is recognisably the thing you turn
 * there.
 */
const SECTION_STYLE: Record<string, { tint: string; glyph: string }> = {
  pitch: { tint: "var(--cyan)", glyph: "♪" },
  dirt: { tint: "var(--accent)", glyph: "▲" },
  tone: { tint: "var(--amber)", glyph: "◐" },
  space: { tint: "#c08cff", glyph: "◜" },
  noise: { tint: "var(--ok)", glyph: "◌" },
  macros: { tint: "#7df0ff", glyph: "◎" },
};

const fallback = { tint: "var(--cyan)", glyph: "◆" };

export default function GuidePage() {
  return (
    <main className="stage guide-stage">
      <div className="win stage-window">
        <div className="win-title">
          <span>sound guide · what every control does</span>
          <span className="win-dots" aria-hidden>
            <span className="win-dot" />
            <span className="win-dot" />
            <span className="win-dot" />
          </span>
        </div>

        <header className="guide-masthead">
          <h1 className="guide-h1">How it sounds, and why</h1>
          <p className="guide-lede">{SOUND_GUIDE.intro}</p>
          <Link href="/" className="btn btn-sm guide-back">
            ← back to the deck
          </Link>
        </header>

        <nav className="guide-rail" aria-label="jump to a section">
          {SOUND_GUIDE.sections.map((s) => {
            const st = SECTION_STYLE[s.id] ?? fallback;
            return (
              <a key={s.id} href={`#${s.id}`} className="guide-pill" style={{ ["--sec" as string]: st.tint } as CSSProperties}>
                <span aria-hidden>{st.glyph}</span>
                {s.title}
              </a>
            );
          })}
        </nav>

        {SOUND_GUIDE.sections.map((section) => {
          const st = SECTION_STYLE[section.id] ?? fallback;
          return (
            <section
              key={section.id}
              id={section.id}
              className="guide-section"
              style={{ ["--sec" as string]: st.tint } as CSSProperties}
            >
              <header className="guide-section-head">
                <span className="guide-section-glyph" aria-hidden>
                  {st.glyph}
                </span>
                <span className="min-w-0">
                  <h2 className="guide-section-title">{section.title}</h2>
                  <p className="guide-section-blurb">{section.blurb}</p>
                </span>
              </header>

              <div className="guide-entries">
                {section.entries.map((entry, i) => (
                  <article key={entry.term} className="guide-entry">
                    <div className="guide-entry-head">
                      <span className="guide-num" aria-hidden>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3 className="guide-term">{entry.term}</h3>
                    </div>
                    {/* The lead: skim only these and you still learn the app. */}
                    <p className="guide-plain">{entry.plain}</p>
                    <p className="guide-deeper">{entry.deeper}</p>
                    <p className="guide-try">
                      <span className="guide-try-tag">try it</span>
                      <span>{entry.tryThis}</span>
                    </p>
                  </article>
                ))}
              </div>
            </section>
          );
        })}

        <footer className="guide-foot">
          Every setting described here is on the deck, under <strong>Tweak the sound</strong>.
          <Link href="/" className="btn btn-sm">
            ← back to the deck
          </Link>
        </footer>
      </div>
    </main>
  );
}
