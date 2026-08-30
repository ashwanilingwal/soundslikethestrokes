import type { Metadata, Viewport } from "next";
import { Silkscreen, Space_Grotesk, VT323 } from "next/font/google";
import { ConsentProvider } from "@/components/ConsentProvider";
import { ADSENSE_CLIENT, adsEnabled } from "@/lib/ads";
import "./globals.css";

/**
 * A late-90s desktop, in type. Silkscreen is the bitmap face for the
 * wordmark, window titles and buttons; VT323 is the CRT terminal font for
 * numbers and readouts. Both are open-licensed from Google Fonts - the
 * fonts the reference site uses are proprietary and are not copied here.
 *
 * Space Grotesk survives for descriptive prose only: pixel faces are the
 * whole look, but a paragraph set in one is a paragraph nobody reads.
 */
const pixel = Silkscreen({ variable: "--font-pixel", subsets: ["latin"], weight: ["400", "700"] });
const term = VT323({ variable: "--font-term", subsets: ["latin"], weight: "400" });
const grotesk = Space_Grotesk({ variable: "--font-grotesk", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

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
    <html lang="en" className={`${pixel.variable} ${term.variable} ${grotesk.variable} h-full antialiased`}>
      <body className="min-h-full grain">
        {/* Every third-party tag now lives inside the provider - a script
            rendered here, in a server layout, would be in the HTML before any
            consent choice could exist, which is not a gate. */}
        <ConsentProvider>{children}</ConsentProvider>
      </body>
    </html>
  );
}
