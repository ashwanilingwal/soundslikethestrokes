/**
 * The sounds this app exists for, expressed as parameter sets. Everything
 * here is also individually reachable from the advanced panel; a preset is
 * just a starting point, not a mode.
 */

export interface Preset {
  id: string;
  label: string;
  tagline: string;
  /** 0 = instant snap (the robotic sound). */
  retuneGlideMs: number;
  /** 0 dry .. 1 fully shifted. */
  dryWet: number;
  /** tanh drive; 1 is nearly clean, 8+ is properly blown out. */
  drive: number;
  /** Bitcrusher: 16 bits + factor 1 = off. */
  bits: number;
  downsampleFactor: number;
  /** Megaphone band-limit. */
  highpassHz: number;
  highpassQ: number;
  lowpassHz: number;
  /** Peaking mid boost around 1.8 kHz - the shouty megaphone presence. */
  presenceDb: number;
  /** Noise gate open threshold; -75 means off. */
  gateDb: number;
  /** Pitch LFO: vibrato at small depths, broken-tape warble at big ones. */
  warbleHz: number;
  warbleCents: number;
  /** Reverb send. 0 is bone dry; the demo-tape sounds need real space. */
  roomMix: number;
  /** Output level into the limiter; > 1 is boost, the limiter catches it. */
  masterGain: number;
}

/**
 * The "I'll Try Anything Once" vocal: the First Impressions demo, not the
 * album. Julian close on a cheap mic in a room, warm and hazy rather than
 * megaphone-thin - so the low cut stays low (180 Hz keeps the chest), the top
 * is veiled instead of shredded, and the drive is high but soft-clipped so it
 * reads as saturated tape rather than fuzz pedal. The glide is deliberately
 * NOT zero: he slides between notes, and a hard robotic snap would be Posty,
 * not Julian. Room and a slow shallow warble do the rest.
 */
export const ITAO: Preset = {
  id: "itao",
  label: "I'll Try Anything Once",
  tagline: "warm bedroom demo, saturated and hazy",
  retuneGlideMs: 70,
  dryWet: 1,
  drive: 11,
  bits: 12,
  downsampleFactor: 2,
  highpassHz: 180,
  highpassQ: 0.7,
  lowpassHz: 2600,
  presenceDb: 5,
  gateDb: -50,
  warbleHz: 1.5,
  warbleCents: 12,
  roomMix: 0.38,
  masterGain: 1.15,
};

/**
 * Heavy saturation through a tight telephone band with a shouty mid bump,
 * gated so the dirt only chews on the voice, and just enough glide that the
 * tuning reads as a sung line rather than a MIDI file.
 */
export const THE_STROKES: Preset = {
  id: "strokes",
  label: "The Strokes",
  tagline: "blown-out megaphone, half-broken PA",
  retuneGlideMs: 40,
  dryWet: 1,
  drive: 9,
  bits: 10,
  downsampleFactor: 3,
  highpassHz: 400,
  highpassQ: 0.9,
  lowpassHz: 3400,
  presenceDb: 9,
  gateDb: -48,
  warbleHz: 0,
  warbleCents: 0,
  roomMix: 0.12,
  masterGain: 1.1,
};

/** Hard chromatic snap, mostly clean signal path - the tune IS the effect. */
export const POSTY: Preset = {
  id: "posty",
  label: "Posty",
  tagline: "hard autotune, glossy and wide",
  retuneGlideMs: 0,
  dryWet: 1,
  drive: 2,
  bits: 16,
  downsampleFactor: 1,
  highpassHz: 120,
  highpassQ: 0.7,
  lowpassHz: 9000,
  presenceDb: 3,
  gateDb: -52,
  warbleHz: 0,
  warbleCents: 0,
  roomMix: 0.18,
  masterGain: 1,
};

/** The modulation-heavy one: hard snap plus a seasick pitch LFO and crush. */
export const VOIDZ: Preset = {
  id: "voidz",
  label: "Voidz",
  tagline: "seasick warble, melted tape robot",
  retuneGlideMs: 0,
  dryWet: 1,
  drive: 10,
  bits: 8,
  downsampleFactor: 4,
  highpassHz: 300,
  highpassQ: 0.9,
  lowpassHz: 2800,
  presenceDb: 6,
  gateDb: -48,
  warbleHz: 5,
  warbleCents: 55,
  roomMix: 0.25,
  masterGain: 1.1,
};

export const PRESETS: Preset[] = [ITAO, THE_STROKES, POSTY, VOIDZ];
