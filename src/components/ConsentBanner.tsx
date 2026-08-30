"use client";

/**
 * Deliberately not a wall. The app is fully usable while this sits there, and
 * declining costs the visitor nothing - so both buttons are weighted the
 * same. A dark-patterned "Accept" with a buried "Decline" is exactly what
 * consent rules exist to stop.
 */
export function ConsentBanner({
  onAccept,
  onDecline,
}: {
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="consent-bar" role="region" aria-label="cookie choices">
      <p className="consent-copy">
        <span className="font-semibold text-fg">Analytics and ads use cookies.</span>{" "}
        Only loaded if you say yes. The voice effect itself is entirely local — your audio never leaves the browser
        either way.
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
