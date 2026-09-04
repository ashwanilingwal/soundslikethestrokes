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

/** True once the site has a real home — guards sitemap/canonical emission. */
export const SITE_PUBLISHED = !SITE_URL.startsWith("http://localhost");

export const SITE_NAME = "soundslikethestrokes";

/**
 * The <title>. Kept under ~60 characters so search results show all of it,
 * and led by what someone would actually type rather than by the brand — a
 * made-up word nobody searches for is a poor first 30 characters.
 */
export const SITE_TITLE = "Live autotune voice changer, in your browser";

export const SITE_TAGLINE = "Speak. Come out autotuned.";

/**
 * The meta description. Not a ranking factor, but it IS the snippet people
 * choose from, so it names the effect, the price and the privacy fact — the
 * three things that decide the click.
 */
export const SITE_DESCRIPTION =
  "Speak into your mic and hear yourself hard-autotuned, overdriven and band-limited — live, as you talk. Free, no signup, and your voice never leaves the browser.";

/**
 * Search engines stopped using the keywords meta tag two decades ago, so this
 * is NOT that. It is the vocabulary the prose below the deck is written to
 * cover, kept here so the page and the structured data cannot drift apart.
 */
export const SITE_TOPICS = [
  "autotune voice changer",
  "live autotune online",
  "real time voice effects",
  "hard tune vocal effect",
  "megaphone vocal effect",
  "browser voice changer",
  "free autotune microphone",
];

/** Bullet list under the intro, and `featureList` in the structured data. */
export const SITE_FEATURES = [
  "Hard autotune with no glide — every word snaps to the nearest semitone, the T-Pain / Post Malone effect",
  "Voice characters drawn from specific eras, from garage-rock grit to the widescreen, delay-soaked later records",
  "One “how much like his voice” dial that moves the whole chain from your natural voice to the full character",
  "Overdrive, bitcrush, band-limiting, room reverb and echo, each on its own control",
  "Room noise cancellation that learns your actual room from a few seconds of silence",
  "Record what you hear and download it, with or without going live first",
  "Run an audio file through the chain instead of a microphone",
];

export interface Faq {
  q: string;
  a: string;
}

/**
 * One source of truth for the FAQ: the visible <h3>/<p> pairs and the
 * FAQPage JSON-LD are both rendered from this array. Structured data that
 * disagrees with the page is a manual action waiting to happen, and the only
 * reliable way to keep them in step is to not write them twice.
 */
export const SITE_FAQ: Faq[] = [
  {
    q: "Is it free?",
    a: "Yes. There is no account, no trial and no export limit. The page carries a single ad below the controls, which is the whole business model.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. It is a web page. The audio processing runs in an AudioWorklet inside your browser tab, so there is no plugin, no app and no driver to set up.",
  },
  {
    q: "Does my voice get uploaded anywhere?",
    a: "Never. Every sample stays in the tab — the microphone feeds the browser's own audio engine directly, and nothing is sent to a server or written to disk unless you press record and save the file yourself. Close the tab and it is gone.",
  },
  {
    q: "Why does it ask whether I am on headphones or speakers?",
    a: "Because the answer changes how the microphone is opened. On headphones, echo cancellation is switched off so your voice reaches the tuner untouched, which sounds better. On speakers it has to stay on, otherwise the processed output feeds back into the mic and howls.",
  },
  {
    q: "How much delay is there between speaking and hearing it?",
    a: "Roughly 40 milliseconds on wired headphones, which is close enough to feel live. Bluetooth headphones add 100–300 ms of their own on top, and that is enough to be distracting — use wired ones if you have them.",
  },
  {
    q: "Does it work on a phone?",
    a: "Yes, in a recent Chrome or Safari, and the layout is built to fit a phone screen without scrolling. Wired earphones matter more on a phone than anywhere else, because the built-in speaker and mic are close enough together to feed back.",
  },
  {
    q: "Can I record what I hear?",
    a: "Yes. The record button captures the processed output and hands you a file to download. You do not have to go live first — pressing record starts the engine and captures from the first sample.",
  },
  {
    q: "Which microphone should I use?",
    a: "Almost anything beats a laptop's built-in mic, which sits next to the fans and picks up the whole room. Wired earphones with an inline mic are a real step up for nothing; a USB condenser is the next one. What matters most is being close to it — halving the distance to the mic buys more than any setting on this page.",
  },
  {
    q: "Is this the actual voice of a real singer?",
    a: "No, and it is not trying to be. There is no voice cloning here and no model trained on anyone. These are ordinary studio effects — pitch quantisation, saturation, filtering, reverb — set to the values that produce a familiar era's texture. It will sound like the record's treatment, in your own voice.",
  },
];
