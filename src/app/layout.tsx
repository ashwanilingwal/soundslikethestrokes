import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Rubik_Glitch, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";
import { ADSENSE_CLIENT, adsEnabled } from "@/lib/ads";
import { GA_ID, analyticsEnabled } from "@/lib/analytics";
import "./globals.css";

/**
 * Rubik Glitch is the wordmark only - type that looks like a dropped sample.
 * Space Grotesk carries everything else, and IBM Plex Mono the note/level
 * readouts, where tabular figures stop the numbers jittering.
 */
const glitch = Rubik_Glitch({ variable: "--font-glitch", subsets: ["latin"], weight: "400" });
const grotesk = Space_Grotesk({ variable: "--font-grotesk", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "600"] });

export const metadata: Metadata = {
  title: "soundslikethestrokes",
  description: "Speak into the mic, hear a hard-autotuned, blown-out megaphone version of yourself. Live.",
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
    <html lang="en" className={`${glitch.variable} ${grotesk.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full grain">
        {children}
        {/**
         * GA4 via @next/third-parties, which loads gtag off the main thread
         * and after hydration - the mic and the worklet must not queue behind
         * a tag script. Absent entirely unless a measurement id is set.
         */}
        {analyticsEnabled && <GoogleAnalytics gaId={GA_ID} />}
        {/* afterInteractive, not beforeInteractive: the mic, the worklet and
            the first paint must never wait on an ad network. Absent entirely
            unless a publisher id is configured. */}
        {adsEnabled && (
          <Script
            id="adsbygoogle-init"
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          />
        )}
      </body>
    </html>
  );
}
