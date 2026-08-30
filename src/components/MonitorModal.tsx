"use client";

import { useEffect, useRef } from "react";
import type { MonitorMode } from "@/lib/audio/graph";

/**
 * The first thing you see, and there is no way past it. Choosing wrong here
 * is the one mistake that makes the app scream at you: with open speakers,
 * voice -> speakers -> mic -> effect -> speakers howls within a second, and
 * the fix (echo cancellation) is a getUserMedia constraint that must be
 * decided before the stream is opened, not after.
 */
export function MonitorModal({ onChoose }: { onChoose: (m: MonitorMode) => void }) {
  const firstRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      // No Escape handler on purpose: there is nothing behind this to reach.
      if (e.key === "Tab") return;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="monitor-title">
      <div className="modal-card">
        <div className="win-title">
          <span>setup.exe</span>
          <span className="win-dots" aria-hidden>
            <span className="win-dot">×</span>
          </span>
        </div>
        <div className="modal-body">
          <p className="caps">before we start</p>
          <h2 id="monitor-title" className="wordmark mt-1.5 text-lg">
            How are you listening?
          </h2>
          <p className="mt-2 text-sm text-fg-muted">
            Your voice is monitored straight back at you, so this changes how the mic is opened — it can&apos;t be
            switched silently later.
          </p>

          <div className="mt-4 flex flex-col gap-2.5">
          <button ref={firstRef} type="button" className="monitor-choice" onClick={() => onChoose("headphones")}>
            <span className="monitor-choice-icon" aria-hidden>
              🎧
            </span>
            <span>
              <span className="block font-bold">Headphones</span>
              <span className="mt-0.5 block text-sm text-fg-muted">
                Recommended. Nothing touches your voice, and latency is lowest. Wired beats Bluetooth, which adds
                100–300&nbsp;ms.
              </span>
            </span>
          </button>

          <button type="button" className="monitor-choice" onClick={() => onChoose("speakers")}>
            <span className="monitor-choice-icon" aria-hidden>
              🔊
            </span>
            <span>
              <span className="block font-bold">Speakers</span>
              <span className="mt-0.5 block text-sm text-fg-muted">
                Echo cancellation switches on to stop the feedback howl. It can duck or warble the effect — keep the
                volume moderate.
              </span>
            </span>
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
