"use client";

import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT, ADSENSE_SLOT, adsEnabled } from "@/lib/ads";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * One responsive display unit, deliberately placed BELOW the fold.
 *
 * The stage above is built to fit a single screen with no scrolling; putting
 * an ad inside that budget would break the thing the layout exists for. Below
 * the fine-tuning panel it is reachable by scrolling, out of the way of the
 * controls, and not adjacent to anything clickable - which is also what keeps
 * it the right side of AdSense's placement rules.
 *
 * Renders nothing at all when no publisher id is configured.
 */
export function AdSlot() {
  const pushed = useRef(false);

  useEffect(() => {
    if (!adsEnabled || pushed.current) return;
    // React 18/19 double-invokes effects in dev; pushing twice for one <ins>
    // makes AdSense log "All ins elements already have ads in them".
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // An ad blocker, or the script never loaded. Not worth surfacing.
    }
  }, []);

  if (!adsEnabled) return null;

  return (
    <aside className="ad-slot" aria-label="advertisement">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
