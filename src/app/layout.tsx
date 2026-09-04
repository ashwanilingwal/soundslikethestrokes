import type { Metadata, Viewport } from "next";
import { Space_Grotesk, VT323 } from "next/font/google";
import { ConsentProvider } from "@/components/ConsentProvider";
import { ADSENSE_CLIENT, adsEnabled } from "@/lib/ads";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";
import "./globals.css";

/**
 * Hardware-panel type. Space Grotesk does the labels and prose - it has
 * enough character to avoid looking like a dashboard, while staying readable
 * at the 9-11px an equipment legend wants. VT323 is the LED face, used only
 * for numbers and readouts.
 *
 * The pixel font this replaced was the legibility problem with the previous
 * skin: charming at 24px, unreadable at 9px, and every label here is 9px.
 */
const grotesk = Space_Grotesk({ variable: "--font-grotesk", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const term = VT323({ variable: "--font-term", subsets: ["latin"], weight: "400" });

/**
 * Search Console verification, if you have set it up. Not required to be
 * indexed - Google finds the site either way - but it is how you submit the
 * sitemap and see what you actually rank for, which is the only feedback loop
 * that exists for SEO. Server-side only, so no NEXT_PUBLIC_ prefix.
 */
const googleVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();

export const metadata: Metadata = {
  /**
   * Every relative URL below (canonicals, og:image, the sitemap) is resolved
   * against this. Without it, Next throws at build time on the first relative
   * metadata URL.
   */
  metadataBase: new URL(SITE_URL),

  title: {
    /**
     * The made-up brand word goes LAST. A search result is scanned left to
     * right and truncated around 60 characters, so the first half has to be
     * the thing someone was looking for - "soundslikethestrokes" is a name
     * with no search volume until the site has an audience.
     */
    default: `${SITE_TITLE} · ${SITE_NAME}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  category: "music",

  alternates: { canonical: "/" },

  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TITLE}`,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_US",
    // og:image comes from app/opengraph-image.tsx, which Next wires up on its
    // own - declaring it here as well would emit the tag twice.
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TITLE}`,
    description: SITE_DESCRIPTION,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      /**
       * The three that decide how much of the page a result can show. Left
       * unset, Google picks conservative defaults and the OG card may not be
       * used as a thumbnail at all.
       */
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  ...(googleVerification ? { verification: { google: googleVerification } } : {}),

  /**
   * AdSense site verification, meta-tag method.
   *
   * This is the reliable one for an app like this: it lands in the
   * server-rendered <head>, so the crawler sees it in the raw HTML without
   * executing any JavaScript. The serving snippet in <body> is injected by
   * the Next runtime after hydration, which a crawler may never observe -
   * verifying on that alone is a coin flip.
   */
  ...(adsEnabled ? { other: { "google-adsense-account": ADSENSE_CLIENT } } : {}),
};

export const viewport: Viewport = {
  themeColor: "#0d0b09",
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${grotesk.variable} ${term.variable} h-full antialiased`}>
      <body className="min-h-full grain">
        {/* Every third-party tag now lives inside the provider - a script
            rendered here, in a server layout, would be in the HTML before any
            consent choice could exist, which is not a gate. */}
        <ConsentProvider>{children}</ConsentProvider>
      </body>
    </html>
  );
}
