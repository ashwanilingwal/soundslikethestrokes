/**
 * Presets as CSV, so a sound can leave the browser and come back.
 *
 * CSV rather than JSON because the point is that a person can open it: a
 * two-column parameter/value file reads fine in a spreadsheet, in a text
 * editor, or pasted into a message. Every value is a plain number or a short
 * identifier, so there is nothing to escape and no nesting to flatten.
 *
 * Import is deliberately forgiving about SHAPE and strict about VALUES: it
 * accepts unknown rows, missing rows and any ordering, but silently discards
 * anything out of range. A hand-edited file with one nonsense number should
 * load the rest rather than fail entirely.
 */

import { VOICES, type Voice, type VoiceParams } from "./voices";

/** Every numeric field a preset carries, with the range import enforces. */
const FIELDS: Record<string, [min: number, max: number, integer?: boolean]> = {
  match: [0, 1],
  robot: [0, 1],
  volume: [0, 2.5],
  retuneGlideMs: [0, 400],
  dryWet: [0, 1],
  drive: [1, 20],
  bits: [4, 16, true],
  downsampleFactor: [1, 16, true],
  highpassHz: [40, 2000],
  highpassQ: [0.1, 4],
  lowpassHz: [800, 20000],
  presenceDb: [-6, 18],
  warbleHz: [0, 12],
  warbleCents: [0, 100],
  roomMix: [0, 1],
  echoMs: [0, 500],
  echoFeedback: [0, 0.75],
  echoMix: [0, 0.6],
  semitoneShift: [-12, 12, true],
  gateDb: [-75, -25],
  denoise: [0, 1],
};

export interface PresetFile {
  voiceId: string;
  macros: { match: number; robot: number; volume: number };
  cleanup: { gateDb: number; denoise: number };
  params: Partial<VoiceParams>;
}

export interface ImportResult {
  preset: PresetFile | null;
  /** Human-readable notes about anything dropped, for the UI to surface. */
  warnings: string[];
}

function csvEscape(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function toCsv(preset: PresetFile): string {
  const voice = VOICES.find((v) => v.id === preset.voiceId);
  const rows: [string, string | number][] = [
    ["voice", preset.voiceId],
    ["match", preset.macros.match],
    ["robot", preset.macros.robot],
    ["volume", preset.macros.volume],
    ["gateDb", preset.cleanup.gateDb],
    ["denoise", preset.cleanup.denoise],
  ];
  for (const [key, value] of Object.entries(preset.params)) {
    if (typeof value === "number") rows.push([key, value]);
  }
  // A leading comment names the voice in words. Spreadsheets show it as a
  // stray first column, which is a fair price for the file being readable.
  const header = `# soundslikethestrokes preset — ${voice ? `${voice.label} (${voice.era})` : preset.voiceId}`;
  const body = rows.map(([k, v]) => `${csvEscape(k)},${csvEscape(String(v))}`).join("\n");
  return `${header}\nparameter,value\n${body}\n`;
}

export function fromCsv(text: string): ImportResult {
  const warnings: string[] = [];
  const macros = { match: 0.7, robot: 0, volume: 1.1 };
  const cleanup = { gateDb: -50, denoise: 0.7 };
  const params: Record<string, number> = {};
  let voiceId = "";

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const comma = line.indexOf(",");
    if (comma < 0) continue;
    const key = line.slice(0, comma).trim().replace(/^"|"$/g, "");
    const raw = line.slice(comma + 1).trim().replace(/^"|"$/g, "");
    if (!key || key === "parameter") continue;

    if (key === "voice") {
      if (VOICES.some((v) => v.id === raw)) voiceId = raw;
      else warnings.push(`Unknown voice "${raw}" — kept the current one.`);
      continue;
    }

    const range = FIELDS[key];
    if (!range) {
      warnings.push(`Ignored unknown setting "${key}".`);
      continue;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      warnings.push(`Ignored "${key}": "${raw}" is not a number.`);
      continue;
    }
    const [min, max, integer] = range;
    if (n < min || n > max) {
      warnings.push(`Ignored "${key}": ${n} is outside ${min}–${max}.`);
      continue;
    }
    const value = integer ? Math.round(n) : n;

    if (key === "match" || key === "robot" || key === "volume") macros[key] = value;
    else if (key === "gateDb" || key === "denoise") cleanup[key] = value;
    else params[key] = value;
  }

  if (!voiceId && Object.keys(params).length === 0) {
    return { preset: null, warnings: ["That file had no settings this app recognises."] };
  }

  return {
    preset: {
      voiceId: voiceId || VOICES[0].id,
      macros,
      cleanup,
      params: params as Partial<VoiceParams>,
    },
    warnings,
  };
}

/** Filename for a downloaded preset, safe on every OS. */
export function presetFilename(voice: Voice): string {
  const slug = `${voice.label} ${voice.eraShort}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `soundslikethestrokes-${slug}.csv`;
}
