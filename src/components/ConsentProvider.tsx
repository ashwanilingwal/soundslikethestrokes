"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import Script from "next/script";
import { ADSENSE_CLIENT, adsEnabled } from "@/lib/ads";
import { analyticsEnabled, updateGoogleConsent } from "@/lib/analytics";
import { readConsent, serverConsent, subscribeConsent, writeConsent, type ConsentState } from "@/lib/consent";
import { ConsentBanner } from "./ConsentBanner";

/**
 * Owns consent, and applies it to the two Google tags in the two ways they
 * need.
 *
 * Analytics is always on the page (root layout, Consent Mode v2, cookies
 * denied by default) and this provider FLIPS its consent flags when the
 * banner is answered. Ads are withheld entirely: the AdSense script lives
 * here and is not rendered until the visitor says yes, because serving ads
 * without consent is a different legal question from an anonymous ping.
 */

interface ConsentApi {
  consent: ConsentState;
  /** True only when tracking is configured AND the visitor said yes. */
  granted: boolean;
  grant: () => void;
  deny: () => void;
  /** Re-open the banner, so withdrawing is as easy as consenting. */
  reconsider: () => void;
  /** False when nothing is configured, i.e. there is nothing to consent to. */
  trackingConfigured: boolean;
}

const ConsentContext = createContext<ConsentApi>({
  consent: "unknown",
  granted: false,
  grant: () => {},
  deny: () => {},
  reconsider: () => {},
  trackingConfigured: false,
});

export function useConsent(): ConsentApi {
  return useContext(ConsentContext);
}

const trackingConfigured = adsEnabled || analyticsEnabled;

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  // The store notifies on write, so this covers this tab and every other one.
  const consent = useSyncExternalStore(subscribeConsent, readConsent, serverConsent);

  const set = useCallback((next: ConsentState) => writeConsent(next), []);

  const api = useMemo<ConsentApi>(
    () => ({
      consent,
      granted: trackingConfigured && consent === "granted",
      grant: () => set("granted"),
      deny: () => set("denied"),
      reconsider: () => set("unknown"),
      trackingConfigured,
    }),
    [consent, set],
  );

  const showScripts = trackingConfigured && consent === "granted";
  const showBanner = trackingConfigured && consent === "unknown";

  // Tell gtag what the visitor decided - including a stored decision from a
  // previous visit, which is why this runs on mount too. "unknown" sends
  // nothing: the default (denied) is already in force.
  useEffect(() => {
    if (!analyticsEnabled || consent === "unknown") return;
    updateGoogleConsent(consent === "granted");
  }, [consent]);

  return (
    <ConsentContext.Provider value={api}>
      {children}

      {showScripts && adsEnabled && (
        <Script
          id="adsbygoogle-init"
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
        />
      )}

      {showBanner && <ConsentBanner onAccept={api.grant} onDecline={api.deny} />}
    </ConsentContext.Provider>
  );
}
