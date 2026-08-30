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

/**
 * Publisher id alone is enough to verify a site and load the script. This is
 * deliberately the weaker condition, because AdSense will not let you create
 * an ad unit (and therefore hand you a slot id) until the site is approved -
 * so "client set, slot still empty" is the normal state for days.
 */
export const adsEnabled = ADSENSE_CLIENT.startsWith("ca-pub-");

/** An actual ad unit needs a slot too; without one the <ins> can never fill. */
export const adSlotReady = adsEnabled && /^\d{6,}$/.test(ADSENSE_SLOT);

/** The bare publisher number, as ads.txt wants it (no "ca-" prefix). */
export function publisherId(): string {
  return ADSENSE_CLIENT.replace(/^ca-/, "");
}
