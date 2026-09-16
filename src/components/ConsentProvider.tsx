"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Script from "next/script";
import { ADSENSE_CLIENT, ADSENSE_GOOGLE_MESSAGE, adsEnabled } from "@/lib/ads";
import { analyticsEnabled, updateGoogleConsent } from "@/lib/analytics";
import {
  bannerVisible,
  effectiveConsent,
  readConsent,
  readRegionRequired,
  serverConsent,
  subscribeConsent,
  writeConsent,
  type ConsentState,
} from "@/lib/consent";
import { ConsentBanner } from "./ConsentBanner";

/**
 * Owns consent - region-aware - and applies it to the two Google tags in the
 * two ways they need.
 *
 * Opt-in regions (EEA, UK, Switzerland; see lib/consentRegion.ts): nothing
 * non-essential runs until the visitor says yes. Elsewhere: on until
 * withdrawn. An explicit choice always beats the regional default, and can
 * be changed at any time from "cookie choices" in the footer or /privacy.
 *
 * Analytics is always on the page (root layout, Consent Mode v2, denied by
 * default in opt-in regions) and this provider FLIPS its consent flags.
 * Ads are withheld entirely until consent, because serving ads without it
 * is a different legal question from an anonymous ping - unless Google's
 * own certified message is doing the asking (ADSENSE_GOOGLE_MESSAGE).
 */

interface ConsentApi {
  /** The visitor's explicit choice, or "unknown" if they have not made one. */
  consent: ConsentState;
  /** True in an opt-in jurisdiction (or when the region is unknown). */
  required: boolean;
  /** True only when tracking is configured AND may run right now. */
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
  required: true,
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

// The region verdict cannot change during a visit; server-side it is
// unknown, which resolves to "required" - the banner hydrates in, then the
// client snapshot corrects it for opt-out regions.
const neverChanges = () => () => {};
const requiredOnServer = () => true;

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  // The store notifies on write, so this covers this tab and every other one.
  const consent = useSyncExternalStore(subscribeConsent, readConsent, serverConsent);
  const required = useSyncExternalStore(neverChanges, readRegionRequired, requiredOnServer);
  // "cookie choices" in an opt-out region: the banner is not shown by
  // default there, so it needs an explicit reason to appear.
  const [reopened, setReopened] = useState(false);

  const effective = effectiveConsent(consent, required);
  const granted = trackingConfigured && effective === "granted";

  const set = useCallback((next: ConsentState) => writeConsent(next), []);

  const api = useMemo<ConsentApi>(
    () => ({
      consent,
      required,
      granted,
      grant: () => set("granted"),
      deny: () => set("denied"),
      reconsider: () => {
        setReopened(true);
        set("unknown");
      },
      trackingConfigured,
    }),
    [consent, required, granted, set],
  );

  // Tell gtag what applies - including a stored decision from a previous
  // visit and the opt-out regions' implicit yes, which is why this runs on
  // mount too. "unknown" only happens in an opt-in region with no choice
  // yet, and is pushed as an explicit DENIED rather than left to the
  // default: Google resolves the region-scoped default from the IP itself,
  // and if its answer ever differed from our verdict it would set cookies
  // under a banner that says nothing runs. Our verdict is authoritative.
  useEffect(() => {
    if (!analyticsEnabled) return;
    updateGoogleConsent(effective === "granted");
  }, [effective]);

  // With Google's certified message enabled, the ads script must be on the
  // page to show it, and it is the consent UI in opt-in regions - ours
  // steps aside there (unless deliberately reopened) and still runs elsewhere.
  const googleMessage = adsEnabled && ADSENSE_GOOGLE_MESSAGE;
  const loadAds = adsEnabled && (granted || googleMessage);
  const showBanner = bannerVisible({ stored: consent, required, reopened, googleMessage, trackingConfigured });

  return (
    <ConsentContext.Provider value={api}>
      {children}

      {loadAds && (
        <Script
          id="adsbygoogle-init"
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
        />
      )}

      {showBanner && <ConsentBanner required={required} onAccept={api.grant} onDecline={api.deny} />}
    </ConsentContext.Provider>
  );
}
