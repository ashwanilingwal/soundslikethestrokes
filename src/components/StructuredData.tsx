import { SITE_DESCRIPTION, SITE_FEATURES, SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * Machine-readable description of the app, and nothing visible.
 *
 * Only a WebApplication node. There was a FAQPage node too, generated from
 * a visible FAQ below the deck; that prose was removed, and structured data
 * for content the visitor cannot see is exactly what Google's guidelines
 * penalise, so it went with it. Everything stated here is stated on the
 * page as well - in the title, the description and the controls.
 */

/**
 * JSON.stringify escapes quotes but not "<", so a "</script>" inside any of
 * the strings would close the tag early. Static copy today; the escape costs
 * nothing and this is exactly the code that gets reused.
 */
function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function StructuredData() {
  const structured = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${SITE_URL}#app`,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any device with a modern web browser",
    browserRequirements: "Requires Web Audio with AudioWorklet support and microphone access",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: SITE_FEATURES,
    inLanguage: "en",
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />;
}
