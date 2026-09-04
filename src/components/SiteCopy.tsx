import Link from "next/link";
import { SITE_DESCRIPTION, SITE_FAQ, SITE_FEATURES, SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * The part of the page a search engine can actually read.
 *
 * A server component on purpose. The deck above is a client component full of
 * canvas-adjacent controls and almost no words — a crawler arriving at it
 * sees a headline and some button labels, which is not enough text to rank
 * for anything. This is rendered into the initial HTML, below the fold, so it
 * never competes with the one-screen layout rule the deck is built around.
 *
 * It is passed to VoiceStage as `children` rather than imported by it: a
 * server component handed to a client component stays server-rendered, so
 * none of this copy is shipped as client JavaScript.
 */

/**
 * JSON.stringify escapes quotes but not "<", so a "</script>" appearing in
 * any of the strings would close the tag early. Static copy today, but the
 * escape costs nothing and this is exactly the code that gets reused.
 */
function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function SiteCopy() {
  const structured = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${SITE_URL}#app`,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        applicationCategory: "MultimediaApplication",
        operatingSystem: "Any device with a modern web browser",
        browserRequirements: "Requires Web Audio with AudioWorklet support and microphone access",
        // Free is a fact worth stating in machine-readable form: it is the
        // single most common qualifier in the searches this page can win.
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        featureList: SITE_FEATURES,
        inLanguage: "en",
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}#faq`,
        mainEntity: SITE_FAQ.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <section className="site-copy" aria-labelledby="about-heading">
      <h2 id="about-heading">A live autotune voice changer that runs in your browser</h2>

      <p>
        {SITE_NAME} retunes your voice to the nearest semitone while you are still speaking, then pushes it through
        overdrive, a bitcrusher and a narrow band of filtering — the treatment that makes a vocal sound like it arrived
        through a payphone rather than a microphone. You hear the result in your headphones as you talk, at roughly 40
        milliseconds of delay, which is close enough to sing against.
      </p>

      <p>
        There is no upload step, because there is no server. The pitch detection and the entire effects chain run in an
        AudioWorklet inside the tab, on your own machine, using the audio engine already built into your browser. That
        is also why it is free to use: it costs nothing to run.
      </p>

      <p>
        The voice characters are named after eras rather than songs, because that is what they are — a set of control
        positions that produce a particular decade&rsquo;s vocal texture. Nothing here is a clone of a singer and
        nothing was trained on one. It is pitch quantisation, saturation and filtering, applied to your voice.
      </p>

      <h3>What it does</h3>
      <ul className="site-copy-list">
        {SITE_FEATURES.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>

      <h2 id="faq">Questions people ask</h2>
      {SITE_FAQ.map((f) => (
        <div className="site-copy-qa" key={f.q}>
          <h3>{f.q}</h3>
          <p>{f.a}</p>
        </div>
      ))}

      <p className="site-copy-more">
        Every control is explained at length, with what it sounds like and how records use it, in the{" "}
        <Link href="/guide">sound guide</Link>.
      </p>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />
    </section>
  );
}
