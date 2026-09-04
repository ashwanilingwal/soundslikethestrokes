import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TITLE } from "@/lib/site";

/**
 * The card that shows up when the link is pasted into a message, a tweet or a
 * Discord channel. Every one of those is a place someone decides whether to
 * click, and a link with no image gets a grey rectangle — so this is worth
 * more to actual traffic than most on-page tuning.
 *
 * Drawn rather than photographed: it is the same vinyl the deck spins, so the
 * preview and the page look like one thing. Satori (which renders this) only
 * supports flexbox and a subset of CSS, so the record is nested bordered
 * circles rather than the repeating-radial-gradient grooves used on the site.
 */

export const alt = `${SITE_NAME} — ${SITE_TITLE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** One groove. Nesting these draws the record from the outside in. */
function Ring({ size: s, children }: { size: number; children?: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: s,
        height: s,
        borderRadius: s / 2,
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {children}
    </div>
  );
}

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          padding: "0 72px",
          background: "linear-gradient(135deg, #1c1e24 0%, #0d0e11 45%, #08090b 100%)",
          color: "#f4f5f7",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 400,
            height: 400,
            borderRadius: 200,
            background: "#0a0b0d",
            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
          }}
        >
          <Ring size={344}>
            <Ring size={288}>
              <Ring size={232}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 168,
                    height: 168,
                    borderRadius: 84,
                    background: "#ff2f3a",
                    color: "#0a0b0d",
                    fontSize: 76,
                    fontWeight: 700,
                  }}
                >
                  ●
                </div>
              </Ring>
            </Ring>
          </Ring>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginLeft: 68, width: 620 }}>
          <div style={{ fontSize: 22, letterSpacing: 7, color: "#ff2f3a" }}>VOCAL DECK · LIVE PITCH UNIT</div>
          <div style={{ fontSize: 60, fontWeight: 700, marginTop: 20, lineHeight: 1.05 }}>{SITE_NAME}</div>
          <div style={{ fontSize: 33, color: "#a9aeb8", marginTop: 20, lineHeight: 1.3 }}>{SITE_TITLE}</div>
          <div style={{ fontSize: 21, color: "#8b919b", marginTop: 28 }}>
            free · no signup · nothing leaves your browser
          </div>
        </div>
      </div>
    ),
    size,
  );
}
