import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Serves /sitemap.xml.
 *
 * Two pages, which is the honest size of this site. A sitemap padded with
 * every route that resolves is not a bigger site, it is a diluted one.
 *
 * `lastModified` is a hand-maintained constant rather than `new Date()`: a
 * build-time timestamp claims the content changed on every deploy, including
 * deploys that only touched the DSP, and a lastmod that cries wolf is one
 * Google learns to ignore. Bump it when the copy actually changes.
 */
const CONTENT_UPDATED = new Date("2026-09-04");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/guide`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
