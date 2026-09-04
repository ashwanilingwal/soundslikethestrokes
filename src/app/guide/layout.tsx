import type { Metadata } from "next";

/**
 * The guide page is a client component (it renders interactive rails and
 * anchors), and `metadata` is server-only — hence this thin layout, whose
 * whole job is to describe the route.
 *
 * Worth doing properly: this is the page with real reading on it, so it is
 * the one with a chance of ranking for how-does-autotune-work style searches
 * that the deck itself never will.
 */
export const metadata: Metadata = {
  title: "Sound guide: what every control does",
  description:
    "Plain-English explanations of autotune, retune speed, overdrive, bitcrush, band-limiting, reverb and echo — what each control changes, what it sounds like, and how records actually use it.",
  alternates: { canonical: "/guide" },
  openGraph: {
    type: "article",
    title: "Sound guide: what every control does",
    description:
      "What autotune, retune speed, overdrive, bitcrush, band-limiting, reverb and echo actually do to a voice — and how records use them.",
    url: "/guide",
  },
};

export default function GuideLayout({ children }: LayoutProps<"/guide">) {
  return children;
}
