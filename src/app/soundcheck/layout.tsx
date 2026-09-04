import type { Metadata } from "next";

/**
 * Keeps the diagnostics route out of search results.
 *
 * robots.ts already disallows crawling it, but Disallow alone does not
 * prevent indexing — a URL that is linked from anywhere can still be listed
 * without a snippet. noindex is the half that actually removes it, and it
 * only works on a page a crawler is allowed to fetch, so the two are
 * belt-and-braces rather than redundant.
 */
export const metadata: Metadata = {
  title: "Soundcheck",
  robots: { index: false, follow: false, nocache: true },
};

export default function SoundcheckLayout({ children }: LayoutProps<"/soundcheck">) {
  return children;
}
