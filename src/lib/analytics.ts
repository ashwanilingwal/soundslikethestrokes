/**
 * Google Analytics 4.
 *
 * The measurement id is committed, for the same reason the AdSense publisher
 * id is: a G- id is public by design (it sits in the page source of every
 * site that uses GA), and a NEXT_PUBLIC_ value set in a dashboard is inlined
 * at BUILD time - so "I added the variable and nothing happened" is the
 * normal outcome until the next deploy. The env var still overrides it, for a
 * fork or a second property.
 *
 * Get an id from analytics.google.com: Admin -> Data streams -> Web -> your
 * stream. It is the "Measurement ID", shaped G-XXXXXXXXXX. Note that it is
 * NOT the same as the "Stream ID" (a bare number) or a UA- id (GA3, dead).
 *
 * Loaded under Google Consent Mode v2, in the root layout, on every page.
 * The old approach - render no Google script at all until the banner is
 * accepted - was a perfectly good gate, but Google's tag detection fetches
 * the page and never clicks Accept, so "Your Google tag wasn't detected" was
 * the permanent answer. Consent Mode is Google's own answer to that: the tag
 * is always present, but `CONSENT_DEFAULT` runs before it and denies every
 * storage type, so until the banner says yes it sets NO cookies and sends
 * only anonymous, cookieless pings. Accepting flips the four consent flags
 * (updateGoogleConsent) and cookies start from that moment. The ADS script
 * is still withheld entirely until consent; see ConsentProvider.
 */

/** Owner's GA4 measurement id. */
const DEFAULT_GA_ID = "G-9RTMZGZBZY";

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID?.trim() || DEFAULT_GA_ID;

/** True only when a well-formed GA4 measurement id is configured. */
export const analyticsEnabled = /^G-[A-Z0-9]{6,}$/i.test(GA_ID);

/**
 * Must run BEFORE gtag.js executes - hence an inline <head> script placed
 * ahead of a deferred gtag.js in the root layout. `wait_for_update` holds the
 * first hit for up to 500 ms so a stored "granted" applied right after
 * hydration counts for it.
 * `function gtag(){dataLayer.push(arguments)}` is Google's verbatim shim: it
 * pushes the Arguments object, and gtag.js only recognises commands in that
 * shape - pushing an array instead is silently ignored.
 */
export const CONSENT_DEFAULT =
  "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}" +
  "gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** Flip every consent flag to match the banner. Safe to call before gtag.js has loaded: the shim queues it. */
export function updateGoogleConsent(granted: boolean): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  const v = granted ? "granted" : "denied";
  window.gtag("consent", "update", { ad_storage: v, ad_user_data: v, ad_personalization: v, analytics_storage: v });
}
