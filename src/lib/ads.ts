/**
 * Google AdSense wiring.
 *
 * Everything here is inert until NEXT_PUBLIC_ADSENSE_CLIENT is set, so the
 * app runs, builds and deploys with no ad account at all - which is also what
 * keeps the dev experience and the soundcheck free of third-party scripts.
 *
 * You must supply these yourself; they come from an AdSense account, which
 * only the site owner can create:
 *   NEXT_PUBLIC_ADSENSE_CLIENT  ca-pub-0000000000000000
 *   NEXT_PUBLIC_ADSENSE_SLOT    0000000000  (one display unit's slot id)
 */

export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || "";
export const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT?.trim() || "";

/** True only when a publisher id is configured. */
export const adsEnabled = ADSENSE_CLIENT.startsWith("ca-pub-");

/** The bare publisher number, as ads.txt wants it (no "ca-" prefix). */
export function publisherId(): string {
  return ADSENSE_CLIENT.replace(/^ca-/, "");
}
