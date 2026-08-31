"use client";

import Link from "next/link";
import { useState } from "react";
import { SOUND_GUIDE } from "@/lib/soundGuide";

/**
 * The long-form companion to the (i) popovers: what every control does to the
 * signal, and how the technique is used on records.
 *
 * Same chassis, header strip and lit-section language as the deck, so it
 * reads as another panel of the same machine rather than a docs site bolted
 * on the side. Unlike the deck this page is MEANT to scroll - it is reading
 * material, and the one-screen rule deliberately does not apply.
 */
export default function GuidePage() {
  // One section open at a time: the whole point is to answer a question, and
  // 23 entries expanded at once is a wall rather than an answer.
  const [open, setOpen] = useState<string | null>(SOUND_GUIDE.sections[0]?.id ?? null);

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

        <header className="flex flex-wrap items-center gap-3 px-1">
          <h1 className="wordmark min-w-0 flex-1 text-[clamp(1rem,3.4vw,1.5rem)]">how it sounds, and why</h1>
          <Link href="/" className="btn btn-sm">
            ← back to the deck
          </Link>
        </header>

        <p className="guide-intro">{SOUND_GUIDE.intro}</p>

        <div className="flex flex-col gap-2">
          {SOUND_GUIDE.sections.map((section) => {
            const isOpen = open === section.id;
            return (
              <section key={section.id} className="guide-section">
                <button
                  type="button"
                  className={`guide-head ${isOpen ? "guide-head-on" : ""}`}
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : section.id)}
                >
                  <span className="guide-head-text">
                    <span className="guide-head-title">{section.title}</span>
                    <span className="guide-head-blurb">{section.blurb}</span>
                  </span>
                  <span className="guide-head-chev" aria-hidden>
                    ▾
                  </span>
                </button>

                {isOpen && (
                  <div className="guide-entries">
                    {section.entries.map((entry) => (
                      <article key={entry.term} className="guide-entry">
                        <h3 className="guide-term">{entry.term}</h3>
                        <p className="guide-plain">{entry.plain}</p>
                        <p className="guide-deeper">{entry.deeper}</p>
                        <p className="guide-try">
                          <span className="guide-try-tag">try it</span>
                          {entry.tryThis}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <footer className="pt-1 text-center text-[10px] text-fg-dim">
          Every setting described here is on the deck, under &ldquo;Tweak the sound&rdquo;.
        </footer>
      </div>
    </main>
  );
}
