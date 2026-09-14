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
 * The tag itself is rendered by ConsentProvider, not here, because GA4 sets
 * cookies and is non-essential under GDPR/UK PECR: it must not exist in the
 * page until the visitor has said yes. That is also why your own Realtime
 * report stays empty until you accept the banner in your own browser.
 */

/** Owner's GA4 measurement id. */
const DEFAULT_GA_ID = "G-9RTMZGZBZY";

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID?.trim() || DEFAULT_GA_ID;

/** True only when a well-formed GA4 measurement id is configured. */
export const analyticsEnabled = /^G-[A-Z0-9]{6,}$/i.test(GA_ID);
