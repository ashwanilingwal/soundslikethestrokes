import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Rubik_Glitch, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { ADSENSE_CLIENT, adsEnabled } from "@/lib/ads";
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
