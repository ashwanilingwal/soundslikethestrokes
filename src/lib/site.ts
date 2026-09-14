/**
 * Where this site lives, and the words that describe it.
 *
 * SERVER-SIDE ONLY. `VERCEL_PROJECT_PRODUCTION_URL` has no NEXT_PUBLIC_
 * prefix, so in a client bundle it compiles to `undefined` and siteUrl()
 * would silently fall back to localhost — which would then be baked into a
 * canonical tag. Import this from layouts, route handlers and server
 * components; if a client component ever needs the URL, pass it down.
 */

/**
 * Resolution order, most explicit first:
 *
 *   1. NEXT_PUBLIC_SITE_URL — set this once you have a custom domain, because
 *      it is the only one that survives the domain changing.
 *   2. Vercel's own production domain, injected on every build. This makes the
 *      sitemap, canonicals and OG images correct on a fresh deploy with zero
 *      configuration, which is the common case.
 *   3. localhost, for dev.
 *
 * Always the PRODUCTION url, never `VERCEL_URL`: that one is the per-deploy
 * preview hostname, and pointing canonicals at a preview would ask Google to
 * index a URL that dies with the next push.
 */
function resolve(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;

  return "http://localhost:3600";
}

export const SITE_URL = resolve();

export const SITE_NAME = "soundslikethestrokes";

/**
 * The <title>. Kept under ~60 characters so search results show all of it,
 * and led by what someone would actually type rather than by the brand — a
 * made-up word nobody searches for is a poor first 30 characters.
 */
export const SITE_TITLE = "Live autotune voice changer, in your browser";

/**
 * The meta description. Not a ranking factor, but it IS the snippet people
 * choose from, so it names the effect, the price and the privacy fact — the
 * three things that decide the click.
 */
export const SITE_DESCRIPTION =
  "Speak into your mic and hear yourself hard-autotuned, overdriven and band-limited — live, as you talk. Free, no signup, and your voice never leaves the browser.";

/** `featureList` in the structured data. */
export const SITE_FEATURES = [
  "Hard autotune with no glide — every word snaps to the nearest semitone, the T-Pain / Post Malone effect",
  "Voice characters drawn from specific eras, from garage-rock grit to the widescreen, delay-soaked later records",
  "One “how much like his voice” dial that moves the whole chain from your natural voice to the full character",
  "Overdrive, bitcrush, band-limiting, room reverb and echo, each on its own control",
  "Room noise cancellation that learns your actual room from a few seconds of silence",
  "Record what you hear and download it, with or without going live first",
  "Run an audio file through the chain instead of a microphone",
];
