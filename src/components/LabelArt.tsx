"use client";

import type { LabelArt as Art } from "@/lib/audio/voices";

/**
 * The centre label of the record. Original generated geometry in each era's
 * palette - NOT the real sleeves, which are copyrighted and are not
 * reproduced anywhere in this app.
 *
 * Drawn under the PLAY/STOP text, so every motif stays inside a low opacity
 * band and leaves the middle relatively clear.
 */
export function LabelArt({
  art,
  className,
  shape = "disc",
}: {
  art: Art;
  className?: string;
  /** A record label is round; a sleeve is square. Same artwork either way. */
  shape?: "disc" | "sleeve";
}) {
  // Ids must be unique per (motif, palette, shape) or one <defs> would clip
  // every other copy on the page to the wrong outline.
  const id = `clip-${shape}-${art.motif}-${art.ink.replace("#", "")}`;
  const sleeve = shape === "sleeve";

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden focusable="false" preserveAspectRatio="xMidYMid slice">
      <defs>
        <clipPath id={id}>
          {sleeve ? <rect x="0" y="0" width="100" height="100" /> : <circle cx="50" cy="50" r="50" />}
        </clipPath>
      </defs>
      {sleeve ? (
        <rect x="0" y="0" width="100" height="100" fill={art.paper} />
      ) : (
        <circle cx="50" cy="50" r="50" fill={art.paper} />
      )}
      <g clipPath={`url(#${id})`} fill={art.ink} stroke={art.ink}>
        {motif(art.motif)}
      </g>
    </svg>
  );
}

function motif(kind: Art["motif"]) {
  switch (kind) {
    case "bar":
      return (
        <g opacity="0.85">
          <rect x="-15" y="40" width="130" height="20" transform="rotate(-28 50 50)" stroke="none" />
          <rect x="-15" y="68" width="130" height="6" transform="rotate(-28 50 50)" stroke="none" opacity="0.6" />
        </g>
      );
    case "haze":
      return (
        <g fill="none" opacity="0.5">
          {[16, 27, 38, 48].map((r, i) => (
            <circle key={r} cx="50" cy="50" r={r} strokeWidth={7 - i} opacity={0.75 - i * 0.14} />
          ))}
        </g>
      );
    case "glitch":
      return (
        <g stroke="none" opacity="0.75">
          {[
            [8, 14, 62],
            [26, 9, 88],
            [44, 6, 40],
            [58, 12, 74],
            [76, 8, 54],
            [88, 5, 96],
          ].map(([y, h, w], i) => (
            <rect key={y} x={i % 2 ? 100 - w : 0} y={y} width={w} height={h} opacity={0.35 + (i % 3) * 0.22} />
          ))}
        </g>
      );
    case "dots":
      return (
        <g stroke="none" opacity="0.65">
          {Array.from({ length: 7 }).flatMap((_, row) =>
            Array.from({ length: 7 }).map((__, col) => (
              <circle key={`${row}-${col}`} cx={8 + col * 14} cy={8 + row * 14} r={1.6 + ((row + col) % 3) * 0.9} />
            )),
          )}
        </g>
      );
    case "arc":
      return (
        <g fill="none" opacity="0.6">
          {[20, 30, 40, 48].map((r, i) => (
            <path key={r} d={`M ${50 - r} 50 A ${r} ${r} 0 0 1 ${50 + r} 50`} strokeWidth={i === 1 ? 5 : 2.5} />
          ))}
          <rect x="0" y="49" width="100" height="2" stroke="none" opacity="0.5" />
        </g>
      );
    case "burst":
      return (
        <g opacity="0.6">
          {Array.from({ length: 16 }).map((_, i) => (
            <rect
              key={i}
              x="49"
              y="-6"
              width={i % 2 ? 1.2 : 2.6}
              height="56"
              stroke="none"
              transform={`rotate(${i * 22.5} 50 50)`}
            />
          ))}
        </g>
      );
    case "orbit":
      return (
        <g opacity="0.65">
          <circle cx="50" cy="50" r="44" fill="none" strokeWidth="2" />
          <circle cx="50" cy="50" r="34" fill="none" strokeWidth="6" opacity="0.45" />
          <circle cx="50" cy="8" r="5" stroke="none" />
          <circle cx="86" cy="66" r="3.5" stroke="none" opacity="0.8" />
        </g>
      );
  }
}
