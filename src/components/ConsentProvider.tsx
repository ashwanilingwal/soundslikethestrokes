"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";
import { ADSENSE_CLIENT, adsEnabled } from "@/lib/ads";
import { GA_ID, analyticsEnabled } from "@/lib/analytics";
import { readConsent, serverConsent, subscribeConsent, writeConsent, type ConsentState } from "@/lib/consent";
import { ConsentBanner } from "./ConsentBanner";

/**
 * Owns consent, and owns every third-party script that depends on it.
 *
 * The Google tags live HERE rather than in the layout, because that is the
 * only way the gate can actually be a gate: a script rendered by a server
 * layout is in the HTML before any client-side choice exists.
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

  return (
    <ConsentContext.Provider value={api}>
      {children}

      {showScripts && analyticsEnabled && <GoogleAnalytics gaId={GA_ID} />}
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
