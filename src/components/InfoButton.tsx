"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * A small "what does this do?" next to a control.
 *
 * Deliberately a popover rather than a tooltip: this has to work on a phone,
 * where hover does not exist, and it holds two or three sentences that a
 * title attribute would truncate. Closes on Escape and on any click outside,
 * because a stuck panel over a slider is worse than no explanation.
 */
export function InfoButton({
  term,
  whatItDoes,
  inTheWild,
}: {
  term: string;
  whatItDoes: string;
  inTheWild?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  return (
    <span className="info-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`info-btn ${open ? "info-btn-on" : ""}`}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`What does ${term} do?`}
        onClick={() => setOpen((v) => !v)}
      >
        i
      </button>
      {open && (
        <span className="info-pop" id={panelId} role="dialog" aria-label={term}>
          <span className="info-pop-term">{term}</span>
          <span className="info-pop-body">{whatItDoes}</span>
          {inTheWild && <span className="info-pop-wild">{inTheWild}</span>}
        </span>
      )}
    </span>
  );
}
