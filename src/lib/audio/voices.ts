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
  /** Delay time in ms. 0 switches the echo stage off entirely. */
  echoMs: number;
  /** How much of each repeat feeds back in. Above ~0.6 it rings a long time. */
  echoFeedback: number;
  /** Level of the repeats against the dry signal. */
  echoMix: number;
  /** Transpose the snapped note. Negative = lower register. */
  semitoneShift: number;
}

/**
 * Which of the four buckets a voice sits in. `auto` holds exactly one
 * hard-tuned voice per singer, so that picking "Autotune" is followed by
 * picking a NAME rather than another album; the band buckets hold that
 * artist's eras.
 */
export type Category = "auto" | "strokes" | "am" | "pm";

export interface Voice extends VoiceParams {
  id: string;
  artist: "julian" | "alex" | "posty";
  category: Category;
  label: string;
  era: string;
  /** Short era/style descriptor used on the picker tiles. */
  eraShort: string;
  /** The one-line answer to "how is this different from the last one?" */
  varies: string;
  /** True for the hard-tuned variants, so the UI can flag them. */
  autotuned?: boolean;
  highpassQ: number;
  art: LabelArt;
  /**
   * Path to a real sleeve under /public/album-art. Optional on purpose: the
   * autotune voices are singers rather than records, and some eras (a demo,
   * a band with no matching release here) have nothing to show - those fall
   * back to the generated art, so a missing file degrades rather than breaks.
   */
  cover?: string;
  /**
   * background-position for `cover`. Sleeves are square and centre fine, but
   * a portrait photo cropped to a circle puts the face near the top of the
   * frame - centring one guillotines it.
   */
  coverPosition?: string;
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
  echoMs: 0,
  echoFeedback: 0,
  echoMix: 0,
  semitoneShift: 0,
};

export const VOICES: Voice[] = [
  {
    id: "julian-1",
    artist: "julian",
    category: "strokes",
    label: "Julian I",
    era: "Is This It · 2001",
    eraShort: "Garage '01",
    varies: "Narrow telephone band and hard clipping — the small-amp vocal. Driest and most distorted of the four.",
    retuneGlideMs: 40,
    dryWet: 1,
    drive: 13,
    bits: 9,
    downsampleFactor: 4,
    highpassHz: 520,
    highpassQ: 0.9,
    lowpassHz: 2800,
    presenceDb: 13,
    warbleHz: 0,
    warbleCents: 0,
    roomMix: 0.04,
    echoMs: 0,
    echoFeedback: 0,
    echoMix: 0,
    semitoneShift: 0,
    art: { paper: "#e8e2d6", ink: "#c8102e", motif: "bar" },
    cover: "/album-art/isthisit.jpg",
  },
  {
    id: "julian-2",
    artist: "julian",
    category: "strokes",
    label: "Julian II",
    era: "I'll Try Anything Once · 2006 demo",
    eraShort: "Demo '06",
    varies: "Keeps the low end and veils the top instead of cutting it — warm and hazy, with a room around it. Sung glide, not a hard snap.",
    retuneGlideMs: 85,
    dryWet: 1,
    drive: 11,
    bits: 12,
    downsampleFactor: 2,
    highpassHz: 180,
    highpassQ: 0.7,
    lowpassHz: 2300,
    presenceDb: 3,
    warbleHz: 2.6,
    warbleCents: 22,
    roomMix: 0.32,
    echoMs: 0,
    echoFeedback: 0,
    echoMix: 0,
    semitoneShift: 0,
    art: { paper: "#2a1a10", ink: "#e8a33d", motif: "haze" },
    cover: "/album-art/try-anything.jpg",
  },
  {
    id: "julian-3",
    artist: "julian",
    category: "strokes",
    label: "Julian III",
    era: "The Voidz · 2014→",
    eraShort: "Warped '14",
    varies: "Heavy digital crush and a seasick pitch wobble. Hard snap, darkest band — the most obviously processed.",
    retuneGlideMs: 0,
    dryWet: 1,
    drive: 15,
    bits: 6,
    downsampleFactor: 6,
    highpassHz: 380,
    highpassQ: 0.9,
    lowpassHz: 3000,
    presenceDb: 9,
    warbleHz: 7,
    warbleCents: 70,
    roomMix: 0.18,
    echoMs: 165,
    echoFeedback: 0.5,
    echoMix: 0.32,
    semitoneShift: 0,
    art: { paper: "#0d1207", ink: "#b8f24a", motif: "glitch" },
  },
  {
    id: "julian-4",
    artist: "julian",
    category: "strokes",
    label: "Julian IV",
    era: "The New Abnormal · 2020",
    eraShort: "Falsetto '20",
    varies: "Lifted five semitones into the falsetto register — brightest, cleanest and wettest of the four, with almost none of the dirt.",
    retuneGlideMs: 55,
    dryWet: 1,
    drive: 2,
    bits: 16,
    downsampleFactor: 1,
    highpassHz: 120,
    highpassQ: 0.7,
    lowpassHz: 11000,
    presenceDb: 6,
    warbleHz: 0.5,
    warbleCents: 4,
    roomMix: 0.62,
    echoMs: 360,
    echoFeedback: 0.38,
    echoMix: 0.3,
    // Shifting up thins the formants as well as the pitch, and that thinning
    // is most of what makes a shifted voice read as falsetto rather than
    // simply higher.
    semitoneShift: 5,
    art: { paper: "#101a2e", ink: "#ff7ac6", motif: "orbit" },
    cover: "/album-art/newabnormal.jpg",
  },
  {
    id: "julian-auto",
    artist: "julian",
    category: "auto",
    label: "Julian · Auto",
    era: "hard-tuned",
    eraShort: "Julian",
    varies: "Julian II's warm haze with the glide killed and the wet locked at 100% — every syllable stair-steps onto the grid.",
    autotuned: true,
    retuneGlideMs: 0,
    dryWet: 1,
    drive: 9,
    bits: 14,
    downsampleFactor: 1,
    highpassHz: 210,
    highpassQ: 0.7,
    lowpassHz: 3400,
    presenceDb: 11,
    warbleHz: 0,
    warbleCents: 0,
    roomMix: 0.22,
    echoMs: 190,
    echoFeedback: 0.28,
    echoMix: 0.2,
    semitoneShift: 0,
    art: { paper: "#0a0f18", ink: "#5fd2f2", motif: "burst" },
    cover: "/album-art/julian.jpg",
    coverPosition: "center 25%",
  },
  {
    id: "alex-1",
    artist: "alex",
    category: "am",
    label: "Alex I",
    era: "Whatever People Say I Am · 2006",
    eraShort: "Sheffield '06",
    varies: "Bright, dry and barely coloured — wide-open top with a hard consonant edge. The least processed voice here.",
    retuneGlideMs: 120,
    dryWet: 1,
    drive: 4.5,
    bits: 16,
    downsampleFactor: 1,
    highpassHz: 190,
    highpassQ: 0.7,
    lowpassHz: 8800,
    presenceDb: 12,
    warbleHz: 0,
    warbleCents: 0,
    roomMix: 0.03,
    echoMs: 0,
    echoFeedback: 0,
    echoMix: 0,
    semitoneShift: 0,
    art: { paper: "#111417", ink: "#dfe6ea", motif: "dots" },
    cover: "/album-art/whateverpeople.jpg",
  },
  {
    id: "alex-2",
    artist: "alex",
    category: "am",
    label: "Alex II",
    era: "AM · 2013",
    eraShort: "Desert '13",
    varies: "Smoother and rounder than the early one: gentle saturation, softer top, and real room behind it.",
    retuneGlideMs: 30,
    dryWet: 1,
    drive: 6,
    bits: 16,
    downsampleFactor: 1,
    highpassHz: 95,
    highpassQ: 0.7,
    lowpassHz: 4400,
    presenceDb: 1,
    warbleHz: 0,
    warbleCents: 0,
    roomMix: 0.26,
    echoMs: 105,
    echoFeedback: 0.2,
    echoMix: 0.18,
    semitoneShift: 0,
    art: { paper: "#0b0b0c", ink: "#f2ede4", motif: "arc" },
    cover: "/album-art/am.jpg",
  },
  {
    id: "alex-3",
    artist: "alex",
    category: "am",
    label: "Alex III",
    era: "Tranquility Base Hotel & Casino · 2018",
    eraShort: "Lounge '18",
    varies: "Dropped two semitones into the lounge-crooner register — close, dark and wet, with almost no bite.",
    retuneGlideMs: 140,
    dryWet: 1,
    drive: 3,
    bits: 16,
    downsampleFactor: 1,
    highpassHz: 105,
    highpassQ: 0.7,
    lowpassHz: 3400,
    presenceDb: -2,
    warbleHz: 1.2,
    warbleCents: 10,
    roomMix: 0.75,
    echoMs: 380,
    echoFeedback: 0.5,
    echoMix: 0.5,
    semitoneShift: -2,
    art: { paper: "#241a0e", ink: "#d8b169", motif: "orbit" },
    cover: "/album-art/casinobase.jpg",
  },
  {
    id: "alex-4",
    artist: "alex",
    category: "am",
    label: "Alex IV",
    era: "The Car · 2022",
    eraShort: "Strings '22",
    varies: "Silky orchestral croon with real vibrato — down one semitone, warmer and far more expressive than Tranquility Base.",
    retuneGlideMs: 95,
    dryWet: 1,
    drive: 2.5,
    bits: 16,
    downsampleFactor: 1,
    highpassHz: 115,
    highpassQ: 0.7,
    lowpassHz: 6000,
    presenceDb: 5,
    // The one voice with a singer's vibrato rather than tape wobble.
    warbleHz: 4,
    warbleCents: 26,
    roomMix: 0.4,
    echoMs: 240,
    echoFeedback: 0.22,
    echoMix: 0.2,
    semitoneShift: -1,
    art: { paper: "#1c1b18", ink: "#b9c2b0", motif: "haze" },
    cover: "/album-art/the-car.jpg",
  },
  {
    id: "alex-auto",
    artist: "alex",
    category: "auto",
    label: "Alex · Auto",
    era: "hard-tuned",
    eraShort: "Alex",
    varies: "The AM-era smoothness snapped hard to the grid — glide zero, no wobble, tuning fully exposed.",
    autotuned: true,
    retuneGlideMs: 0,
    dryWet: 1,
    drive: 4,
    bits: 16,
    downsampleFactor: 1,
    highpassHz: 140,
    highpassQ: 0.7,
    lowpassHz: 7200,
    presenceDb: 9,
    warbleHz: 0,
    warbleCents: 0,
    roomMix: 0.14,
    echoMs: 0,
    echoFeedback: 0,
    echoMix: 0,
    semitoneShift: 0,
    art: { paper: "#12091c", ink: "#c08cff", motif: "burst" },
    cover: "/album-art/alex-turner.jpg",
    coverPosition: "center 25%",
  },
  {
    id: "posty-auto",
    artist: "posty",
    category: "auto",
    label: "Posty · Auto",
    era: "hard-tuned",
    eraShort: "Posty",
    varies: "The archetype the other two are measured against: clean path, wide reverb, and nothing but the tune doing the work.",
    autotuned: true,
    retuneGlideMs: 0,
    dryWet: 1,
    drive: 3,
    bits: 16,
    downsampleFactor: 1,
    highpassHz: 120,
    highpassQ: 0.7,
    lowpassHz: 9000,
    presenceDb: 5,
    warbleHz: 0,
    warbleCents: 0,
    roomMix: 0.32,
    echoMs: 280,
    echoFeedback: 0.32,
    echoMix: 0.26,
    semitoneShift: 0,
    art: { paper: "#1a0d14", ink: "#ff8fb8", motif: "burst" },
    cover: "/album-art/post-malone.jpg",
    coverPosition: "center 25%",
  },
  {
    id: "posty-1",
    artist: "posty",
    category: "pm",
    label: "Posty I",
    era: "Stoney · 2016",
    eraShort: "Trap-soul '16",
    varies: "Warm and hazy under a hard tune — rounded top, plenty of room, the melodic-drawl end of autotune.",
    autotuned: true,
    retuneGlideMs: 0,
    dryWet: 1,
    drive: 6,
    bits: 14,
    downsampleFactor: 1,
    highpassHz: 170,
    highpassQ: 0.7,
    lowpassHz: 6800,
    presenceDb: 7,
    warbleHz: 0,
    warbleCents: 0,
    roomMix: 0.2,
    echoMs: 150,
    echoFeedback: 0.24,
    echoMix: 0.2,
    semitoneShift: 0,
    art: { paper: "#241813", ink: "#e3b98c", motif: "haze" },
  },
  {
    id: "posty-2",
    artist: "posty",
    category: "pm",
    label: "Posty II",
    era: "Hollywood's Bleeding · 2019",
    eraShort: "Stadium '19",
    varies: "The stadium version: cleanest path here, brightest top, biggest reverb. Tuning is the only effect doing work.",
    autotuned: true,
    retuneGlideMs: 0,
    dryWet: 1,
    drive: 2,
    bits: 16,
    downsampleFactor: 1,
    highpassHz: 100,
    highpassQ: 0.7,
    lowpassHz: 13000,
    presenceDb: 8,
    warbleHz: 0,
    warbleCents: 0,
    roomMix: 0.58,
    echoMs: 330,
    echoFeedback: 0.38,
    echoMix: 0.32,
    semitoneShift: 0,
    art: { paper: "#140a10", ink: "#ff6f9c", motif: "burst" },
    cover: "/album-art/hollywoodbleeding.jpg",
  },
  {
    id: "posty-3",
    artist: "posty",
    category: "pm",
    label: "Posty III",
    era: "Twelve Carat Toothache · 2022",
    eraShort: "Rough '22",
    varies: "Rougher and darker: real saturation and a touch of crush behind the tune, less polish than the other two.",
    autotuned: true,
    retuneGlideMs: 0,
    dryWet: 1,
    drive: 11,
    bits: 10,
    downsampleFactor: 3,
    highpassHz: 210,
    highpassQ: 0.8,
    lowpassHz: 4800,
    presenceDb: 10,
    warbleHz: 0.6,
    warbleCents: 6,
    roomMix: 0.22,
    echoMs: 0,
    echoFeedback: 0,
    echoMix: 0,
    semitoneShift: 0,
    art: { paper: "#16171a", ink: "#e2452f", motif: "glitch" },
  },
];

export const ARTISTS = [
  { id: "julian" as const, name: "Julian Casablancas", band: "The Strokes / The Voidz" },
  { id: "alex" as const, name: "Alex Turner", band: "Arctic Monkeys" },
  { id: "posty" as const, name: "Post Malone", band: "full autotune, by design" },
];

/** Autotune is the headline feature, so it is also where you land. */
export const DEFAULT_VOICE = VOICES.find((v) => v.id === "julian-auto") ?? VOICES[0];

/**
 * The first of the two picker steps. Autotune leads: it is the headline
 * feature, and it is the one bucket organised by SINGER rather than by album,
 * because "I want the robot voice" is a different question from "I want that
 * record's vocal sound".
 */
export const CATEGORIES: { id: Category; label: string; hint: string }[] = [
  { id: "auto", label: "Autotune", hint: "hard-snapped — pick a singer" },
  { id: "strokes", label: "The Strokes", hint: "Julian Casablancas, by era" },
  { id: "am", label: "Arctic Monkeys", hint: "Alex Turner, by era" },
  { id: "pm", label: "Post Malone", hint: "by era" },
];

export function voicesIn(category: Category): Voice[] {
  return VOICES.filter((v) => v.category === category);
}

export function artistName(artist: Voice["artist"]): string {
  return ARTISTS.find((a) => a.id === artist)?.name ?? artist;
}

/**
 * Second-step option text. Under Autotune that is the singer's name; under a
 * band it is the era, since the singer is already implied by the bucket.
 */
export function optionLabel(voice: Voice): string {
  return voice.category === "auto" ? artistName(voice.artist) : voice.era;
}

/**
 * Button face: the album or the singer, without the year. Derived from `era`
 * rather than stored, so there is no second name to keep in sync.
 */
export function shortLabel(voice: Voice): string {
  return voice.eraShort;
}

/** The album behind an era, for tooltips and the description line. */
export function albumLabel(voice: Voice): string {
  return voice.category === "auto" ? artistName(voice.artist) : voice.era;
}

/**
 * What goes on the record's centre label: the album, without the year. The
 * disc is showing that sleeve, so naming it "Julian I" wasted the one place
 * a record traditionally tells you what it is.
 */
export function discLabel(voice: Voice): string {
  return voice.category === "auto" ? artistName(voice.artist) : voice.era.split(" · ")[0];
}

/**
 * The singer's face, used wherever a voice has no sleeve of its own - an
 * era with no artwork supplied, or the autotune voices, which are people
 * rather than records.
 */
export const ARTIST_PORTRAIT: Partial<Record<Voice["artist"], string>> = {
  julian: "/album-art/julian.jpg",
  alex: "/album-art/alex-turner.jpg",
  posty: "/album-art/post-malone.jpg",
};

/**
 * What to show on a tile or a disc: the sleeve if there is one, otherwise the
 * artist. Returns null only if neither exists, which is the generated-art
 * fallback - it should not happen while every artist has a portrait, but the
 * data allows it and a missing file should degrade rather than blank out.
 *
 * Portraits are framed high: the photos are portrait orientation, and
 * centring one inside a circle guillotines the face.
 */
export function coverFor(voice: Voice): { url: string; position: string } | null {
  if (voice.cover) return { url: voice.cover, position: voice.coverPosition ?? "center" };
  const portrait = ARTIST_PORTRAIT[voice.artist];
  return portrait ? { url: portrait, position: "center 25%" } : null;
}

/** "Julian", "Alex", "Posty" — for prose like "How much Julian". */
export function artistShort(voice: Voice): string {
  return voice.label.split(" ")[0];
}

/** The small print under a button: the year, or "auto". */
export function yearLabel(voice: Voice): string {
  return voice.category === "auto" ? "auto" : (voice.era.split(" · ")[1] ?? "");
}

/**
 * Moving between buckets keeps the singer when the target bucket has one -
 * going from "Julian II" to Autotune should land on Julian, not Alex.
 */
export function voiceForCategory(category: Category, current: Voice): Voice {
  const options = voicesIn(category);
  return options.find((v) => v.artist === current.artist) ?? options[0];
}

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
    // Echo TIME is not interpolated - sweeping a delay line pitch-bends the
    // repeats. Only its level fades in with match, so a 20% blend is the
    // same echo, quieter, rather than a differently-tuned one.
    echoMs: voice.echoMs,
    echoFeedback: lerp(0, voice.echoFeedback, t),
    echoMix: lerp(0, voice.echoMix, t),
    semitoneShift: Math.round(lerp(0, voice.semitoneShift, t)),
    masterGain: opts.volume,
    gateDb: opts.gateDb,
    denoise: opts.denoise,
  };
}
