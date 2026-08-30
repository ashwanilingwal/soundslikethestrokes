/**
 * Google Analytics 4.
 *
 * Same gating idea as lib/ads.ts: nothing loads unless NEXT_PUBLIC_GA_ID is
 * set, so local dev, the soundcheck and any un-configured deploy stay free of
 * third-party scripts - and the eval never races a tag manager.
 *
 * Get the id from analytics.google.com: Admin -> Data streams -> Web -> your
 * stream. It is the "Measurement ID", shaped G-XXXXXXXXXX. Note that it is
 * NOT the same as the "Stream ID" (a bare number) or a UA- id (GA3, dead).
 *
 * Worth knowing: unlike a cookieless analytics tool, GA4 sets cookies and is
 * treated as non-essential under GDPR/UK PECR, so serving it to EEA/UK
 * visitors needs a consent mechanism. This app does not have one yet - the
 * same gap already flagged for AdSense.
 */

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID?.trim() || "";

/** True only when a well-formed GA4 measurement id is configured. */
export const analyticsEnabled = /^G-[A-Z0-9]{6,}$/i.test(GA_ID);
