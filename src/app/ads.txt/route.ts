import { adsEnabled, publisherId } from "@/lib/ads";

/**
 * AdSense will not serve on a domain until it can read /ads.txt naming your
 * publisher id, so it is generated from the same env var as the script rather
 * than kept as a static file someone has to remember to edit.
 *
 * 404s when unconfigured, which is the honest answer - claiming no sellers is
 * different from having no file.
 */
export function GET() {
  if (!adsEnabled) {
    return new Response("Not found", { status: 404 });
  }
  // f08c47fec0942fa0 is Google's own certification-authority id, identical
  // for every AdSense publisher.
  const body = `google.com, ${publisherId()}, DIRECT, f08c47fec0942fa0\n`;
  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
