import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Serves /robots.txt.
 *
 * Only one route is held back: /soundcheck is an engineering diagnostic that
 * prints PASS/FAIL lines and nothing a searcher wants. Letting it into the
 * index would put a thin, confusing page under the same domain as the real
 * one, which is worse than having one page fewer.
 *
 * Note that Disallow stops crawling, not indexing — a disallowed URL can still
 * appear as a bare link if something else points at it. The matching noindex
 * lives in soundcheck/layout.tsx, and the two together are what actually keep
 * it out.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/soundcheck",
    },
    // No `host:` line. It is a Yandex-only directive that Google ignores and
    // Yandex itself deprecated, and Next writes it with the protocol attached
    // ("Host: https://…"), which is not even the shape that directive wants.
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
