/**
 * Google AdSense wiring.
 *
 * The publisher id is committed rather than read from the environment. That
 * is not a leaked secret: a ca-pub- id is a public identifier by design - it
 * is printed in the page source of every AdSense site on the web and again in
 * /ads.txt, which exists precisely so anyone can read it. Vercel's warning
 * about NEXT_PUBLIC_ prefixes is a blanket one and does not apply here.
 *
 * Committing it also removes the failure mode that actually bit: a
 * NEXT_PUBLIC_ value is inlined at BUILD time, so setting it in the Vercel
 * dashboard changes nothing until the next deploy - which looks exactly like
 * the code being broken.
 *
 * The env vars still win when set, so a fork or a second property does not
 * have to edit source:
 *   NEXT_PUBLIC_ADSENSE_CLIENT  ca-pub-0000000000000000
 *   NEXT_PUBLIC_ADSENSE_SLOT    0000000000  (one display unit's slot id)
 */

/** Owner's AdSense publisher id. */
const DEFAULT_CLIENT = "ca-pub-4933889703451538";

export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || DEFAULT_CLIENT;
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
