"use client";

import Link from "next/link";

/**
 * Deliberately not a wall. The app is fully usable while this sits there, and
 * declining costs the visitor nothing - so both buttons are weighted the
 * same. A dark-patterned "Accept" with a buried "Decline" is exactly what
 * consent rules exist to stop. Two wordings: in an opt-in region nothing has
 * run yet; in an opt-out region it has, and the honest sentence says so.
 */
export function ConsentBanner({
  required,
  onAccept,
  onDecline,
}: {
  required: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="consent-bar" role="region" aria-label="cookie choices">
      <p className="consent-copy">
        <span className="font-semibold text-fg">Analytics and ads use cookies.</span>{" "}
        {required
          ? "None are set unless you say yes — until then Google gets only anonymous, cookieless signals, and no ads load."
          : "They are on in your region unless you switch them off here; declining removes them."}{" "}
        The voice effect itself is entirely local; your audio never leaves the browser either way.{" "}
        <Link href="/privacy">Privacy policy</Link>
      </p>
      <div className="consent-actions">
        <button type="button" className="btn btn-sm" onClick={onDecline}>
          Decline
        </button>
        <button type="button" className="btn btn-sm btn-hot" onClick={onAccept}>
          Accept
        </button>
      </div>
    </div>
  );
}
