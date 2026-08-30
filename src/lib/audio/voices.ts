/**
 * The voices, and the formula that dials them in.
 *
 * An honest word about what these are: nobody's voice is being cloned. Each
 * entry is a *character* - the mic, the band-limiting, the saturation and the
 * tuning behaviour of a particular era's vocal sound - applied to whatever
 * you actually sing. What varies between them is written into `varies`, and
 * shown on the card, because "Julian I / II / III" tells you nothing on its
 * own.
 *
 * The label art is likewise ORIGINAL, not the real sleeves: generated
 * geometry in an era-appropriate palette, the way a bootleg pressing would
 * look. Real cover art is copyrighted and is not reproduced here.
 */

export type Motif = "bar" | "haze" | "glitch" | "dots" | "arc" | "burst" | "orbit";

export interface LabelArt {
  /** Label background. */
  paper: string;
  /** Motif + text colour. Must read clearly on `paper`. */
  ink: string;
  motif: Motif;
}

export interface VoiceParams {
  /** 0 = instant robotic snap; high = loose and sung. */
  retuneGlideMs: number;
  /** 0 dry .. 1 fully pitch-shifted. */
  dryWet: number;
  /** tanh drive. 1 is clean, 8+ is properly blown out. */
  drive: number;
  bits: number;
  downsampleFactor: number;
  highpassHz: number;
  lowpassHz: number;
  /** Peaking boost at 1.8 kHz - vocal bite. */
  presenceDb: number;
  warbleHz: number;
  warbleCents: number;
  roomMix: number;
  /** Transpose the snapped note. Negative = lower register. */
  semitoneShift: number;
}

export interface Voice extends VoiceParams {
  id: string;
  artist: "julian" | "alex" | "posty";
  label: string;
  era: string;
  /** The one-line answer to "how is this different from the last one?" */
  varies: string;
  /** True for the hard-tuned variants, so the UI can flag them. */
  autotuned?: boolean;
  highpassQ: number;
  art: LabelArt;
}

/**
 * Where every voice starts from at 0% match: your own voice, barely touched.
 * The match slider interpolates from here to the voice's own values, so 1%
 * really is 1% - not a preset with the volume down.
 */
export const NEUTRAL: VoiceParams = {
  retuneGlideMs: 250,
  dryWet: 0,
  drive: 1,
  bits: 16,
  downsampleFactor: 1,
  highpassHz: 80,
  lowpassHz: 12000,
  presenceDb: 0,
  warbleHz: 0,
  warbleCents: 0,
  roomMix: 0,
  semitoneShift: 0,
};

export const VOICES: Voice[] = [
  {
    id: "julian-1",
    artist: "julian",
    label: "Julian I",
    era: "Is This It · 2001",
    varies: "Narrow telephone band and hard clipping — the small-amp vocal. Driest and most distorted of the four.",
    retuneGlideMs: 35,
    dryWet: 1,
    drive: 9,
    bits: 10,
    downsampleFactor: 3,
    highpassHz: 450,
    highpassQ: 0.9,
    lowpassHz: 3200,
    presenceDb: 10,
    warbleHz: 0,
    warbleCents: 0,
    roomMix: 0.1,
    semitoneShift: 0,
    art: { paper: "#e8e2d6", ink: "#c8102e", motif: "bar" },
  },
  {
    id: "julian-2",
    artist: "julian",
    label: "Julian II",
    era: "I'll Try Anything Once · 2006 demo",
    varies: "Keeps the low end and veils the top instead of cutting it — warm and hazy, with a room around it. Sung glide, not a hard snap.",
    retuneGlideMs: 70,
    dryWet: 1,
    drive: 11,
    bits: 12,
    downsampleFactor: 2,
    highpassHz: 180,
    highpassQ: 0.7,
    lowpassHz: 2600,
    presenceDb: 5,
    warbleHz: 1.5,
    warbleCents: 12,
    roomMix: 0.38,
    semitoneShift: 0,
    art: { paper: "#2a1a10", ink: "#e8a33d", motif: "haze" },
  },
  {
    id: "julian-3",
    artist: "julian",
    label: "Julian III",
    era: "The Voidz · 2014→",
    varies: "Heavy digital crush and a seasick pitch wobble. Hard snap, darkest band — the most obviously processed.",
    retuneGlideMs: 0,
    dryWet: 1,
    drive: 10,
    bits: 8,
    downsampleFactor: 4,
    highpassHz: 300,
    highpassQ: 0.9,
    lowpassHz: 2800,
    presenceDb: 6,
    warbleHz: 5,
    warbleCents: 55,
    roomMix: 0.25,
    semitoneShift: 0,
    art: { paper: "#0d1207", ink: "#b8f24a", motif: "glitch" },
  },
  {
    id: "julian-auto",
    artist: "julian",
    label: "Julian · Auto",
    era: "hard-tuned",
    varies: "Julian II's warm haze with the glide killed and the wet locked at 100% — every syllable stair-steps onto the grid.",
    autotuned: true,
    retuneGlideMs: 0,
    dryWet: 1,
    drive: 7,
    bits: 14,
    downsampleFactor: 1,
    highpassHz: 200,
    highpassQ: 0.7,
    lowpassHz: 4200,
    presenceDb: 6,
    warbleHz: 0,
    warbleCents: 0,
    roomMix: 0.34,
    semitoneShift: 0,
    art: { paper: "#0a0f18", ink: "#5fd2f2", motif: "burst" },
  },
  {
    id: "alex-1",
    artist: "alex",
    label: "Alex I",
    era: "Whatever People Say I Am · 2006",
    varies: "Bright, dry and barely coloured — wide-open top with a hard consonant edge. The least processed voice here.",
    retuneGlideMs: 90,
    dryWet: 1,
    drive: 3,
    bits: 16,
    downsampleFactor: 1,
    highpassHz: 150,
    highpassQ: 0.7,
    lowpassHz: 7000,
    presenceDb: 8,
    warbleHz: 0,
    warbleCents: 0,
    roomMix: 0.08,
    semitoneShift: 0,
    art: { paper: "#111417", ink: "#dfe6ea", motif: "dots" },
  },
  {
    id: "alex-2",
    artist: "alex",
    label: "Alex II",
    era: "AM · 2013",
    varies: "Smoother and rounder than the early one: gentle saturation, softer top, and real room behind it.",
    retuneGlideMs: 60,
    dryWet: 1,
    drive: 5,
    bits: 14,
    downsampleFactor: 1,
    highpassHz: 120,
    highpassQ: 0.7,
    lowpassHz: 5200,
    presenceDb: 5,
    warbleHz: 1,
    warbleCents: 6,
    roomMix: 0.3,
    semitoneShift: 0,
    art: { paper: "#0b0b0c", ink: "#f2ede4", motif: "arc" },
  },
  {
    id: "alex-3",
    artist: "alex",
    label: "Alex III",
    era: "Tranquility Base Hotel & Casino · 2018",
    varies: "Dropped two semitones into the lounge-crooner register — close, dark and wet, with almost no bite.",
    retuneGlideMs: 110,
    dryWet: 1,
    drive: 4,
    bits: 15,
    downsampleFactor: 1,
    highpassHz: 90,
    highpassQ: 0.7,
    lowpassHz: 4000,
    presenceDb: 2,
    warbleHz: 0.8,
    warbleCents: 8,
    roomMix: 0.45,
    semitoneShift: -2,
    art: { paper: "#241a0e", ink: "#d8b169", motif: "orbit" },
  },
  {
    id: "alex-auto",
    artist: "alex",
    label: "Alex · Auto",
    era: "hard-tuned",
    varies: "The AM-era smoothness snapped hard to the grid — glide zero, no wobble, tuning fully exposed.",
    autotuned: true,
    retuneGlideMs: 0,
    dryWet: 1,
    drive: 3.5,
    bits: 16,
    downsampleFactor: 1,
    highpassHz: 130,
    highpassQ: 0.7,
    lowpassHz: 6200,
    presenceDb: 6,
    warbleHz: 0,
    warbleCents: 0,
    roomMix: 0.32,
    semitoneShift: 0,
    art: { paper: "#12091c", ink: "#c08cff", motif: "burst" },
  },
  {
    id: "posty-1",
    artist: "posty",
    label: "Posty I",
    era: "Stoney · 2016",
    varies: "Warm and hazy under a hard tune — rounded top, plenty of room, the melodic-drawl end of autotune.",
    autotuned: true,
    retuneGlideMs: 0,
    dryWet: 1,
    drive: 4,
    bits: 16,
    downsampleFactor: 1,
    highpassHz: 130,
    highpassQ: 0.7,
    lowpassHz: 8000,
    presenceDb: 4,
    warbleHz: 0,
    warbleCents: 0,
    roomMix: 0.35,
    semitoneShift: 0,
    art: { paper: "#241813", ink: "#e3b98c", motif: "haze" },
  },
  {
    id: "posty-2",
    artist: "posty",
    label: "Posty II",
    era: "Hollywood's Bleeding · 2019",
    varies: "The stadium version: cleanest path here, brightest top, biggest reverb. Tuning is the only effect doing work.",
    autotuned: true,
    retuneGlideMs: 0,
    dryWet: 1,
    drive: 2.5,
    bits: 16,
    downsampleFactor: 1,
    highpassHz: 110,
    highpassQ: 0.7,
    lowpassHz: 9500,
    presenceDb: 5,
    warbleHz: 0,
    warbleCents: 0,
    roomMix: 0.45,
    semitoneShift: 0,
    art: { paper: "#140a10", ink: "#ff6f9c", motif: "burst" },
  },
  {
    id: "posty-3",
    artist: "posty",
    label: "Posty III",
    era: "Twelve Carat Toothache · 2022",
    varies: "Rougher and darker: real saturation and a touch of crush behind the tune, less polish than the other two.",
    autotuned: true,
    retuneGlideMs: 0,
    dryWet: 1,
    drive: 7,
    bits: 13,
    downsampleFactor: 2,
    highpassHz: 160,
    highpassQ: 0.8,
    lowpassHz: 6000,
    presenceDb: 6,
    warbleHz: 0,
    warbleCents: 0,
    roomMix: 0.3,
    semitoneShift: 0,
    art: { paper: "#16171a", ink: "#e2452f", motif: "glitch" },
  },
];

export const ARTISTS = [
  { id: "julian" as const, name: "Julian Casablancas", band: "The Strokes / The Voidz" },
  { id: "alex" as const, name: "Alex Turner", band: "Arctic Monkeys" },
  { id: "posty" as const, name: "Post Malone", band: "full autotune, by design" },
];

export const DEFAULT_VOICE = VOICES[1]; // Julian II — the one that started this

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Frequencies interpolate geometrically; a linear sweep sounds lopsided. */
const lerpHz = (a: number, b: number, t: number) => a * Math.pow(b / a, t);

export interface ResolvedParams extends VoiceParams {
  highpassQ: number;
  masterGain: number;
  gateDb: number;
  denoise: number;
}

/**
 * One voice + three macro knobs -> every parameter the audio graph wants.
 *
 * `match` walks each value from NEUTRAL to the voice. `robot` then overrides
 * on top: it kills the glide, crushes harder and drives hotter, so you can
 * have "90% Julian but fully robotic" - the two axes are deliberately
 * independent rather than one blended slider.
 */
export function resolveParams(
  voice: Voice,
  opts: { match: number; robot: number; volume: number; gateDb: number; denoise: number },
): ResolvedParams {
  const t = Math.min(1, Math.max(0, opts.match));
  const r = Math.min(1, Math.max(0, opts.robot));

  let retuneGlideMs = lerp(NEUTRAL.retuneGlideMs, voice.retuneGlideMs, t);
  let dryWet = lerp(NEUTRAL.dryWet, voice.dryWet, t);
  let drive = lerp(NEUTRAL.drive, voice.drive, t);
  let bits = lerp(NEUTRAL.bits, voice.bits, t);
  let downsampleFactor = lerp(NEUTRAL.downsampleFactor, voice.downsampleFactor, t);

  // Robot is a second, independent axis - not more of the same slider.
  retuneGlideMs *= 1 - r;
  dryWet = Math.max(dryWet, r);
  drive *= 1 + r * 0.8;
  bits = lerp(bits, 5, r * 0.85);
  downsampleFactor = lerp(downsampleFactor, 6, r * 0.75);

  return {
    retuneGlideMs,
    dryWet,
    drive,
    bits: Math.round(bits),
    downsampleFactor: Math.round(downsampleFactor),
    highpassHz: lerpHz(NEUTRAL.highpassHz, voice.highpassHz, t),
    highpassQ: lerp(0.7, voice.highpassQ, t),
    lowpassHz: lerpHz(NEUTRAL.lowpassHz, voice.lowpassHz, t),
    presenceDb: lerp(NEUTRAL.presenceDb, voice.presenceDb, t),
    warbleHz: lerp(NEUTRAL.warbleHz, voice.warbleHz, t),
    warbleCents: lerp(NEUTRAL.warbleCents, voice.warbleCents, t),
    roomMix: lerp(NEUTRAL.roomMix, voice.roomMix, t),
    semitoneShift: Math.round(lerp(0, voice.semitoneShift, t)),
    masterGain: opts.volume,
    gateDb: opts.gateDb,
    denoise: opts.denoise,
  };
}
