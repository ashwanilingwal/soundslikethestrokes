"use client";

import { useConsent } from "./ConsentProvider";

/**
 * The withdraw-or-change control, for the privacy page. Says what is
 * currently in force, so "change" is a change from something visible.
 */
export function CookieChoices() {
  const c = useConsent();
  if (!c.trackingConfigured) return <p className="guide-plain">No analytics or advertising is configured on this deployment.</p>;
  const state =
    c.consent === "granted"
      ? "You have accepted analytics and advertising cookies."
      : c.consent === "denied"
        ? "You have declined analytics and advertising cookies."
        : c.required
          ? "You have not chosen yet, so nothing non-essential is running."
          : "You have not chosen; in your region they run until you switch them off.";
  return (
    <p className="guide-plain">
      {state}{" "}
      <button type="button" className="btn btn-sm" onClick={c.reconsider}>
        change cookie choices
      </button>
    </p>
  );
}
