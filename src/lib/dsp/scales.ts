/**
 * Scale masks and note maths for the UI. The kernel keeps its own private
 * copies of the midi conversions (it is forbidden to import anything - see
 * hardtuneKernel.ts); these exist for components and the eval script.
 */

/** 12 booleans, index 0 = C. 1 means the pitch class is allowed. */
export type ScaleMask = number[];

export const CHROMATIC: ScaleMask = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_STEPS = [0, 2, 3, 5, 7, 8, 10];

export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function maskFromSteps(root: number, steps: number[]): ScaleMask {
  const mask = new Array<number>(12).fill(0);
  for (const s of steps) mask[(root + s) % 12] = 1;
  return mask;
}

export function majorMask(root: number): ScaleMask {
  return maskFromSteps(root, MAJOR_STEPS);
}

export function minorMask(root: number): ScaleMask {
  return maskFromSteps(root, MINOR_STEPS);
}

export type ScaleChoice = { kind: "chromatic" } | { kind: "major" | "minor"; root: number };

export function maskFor(choice: ScaleChoice): ScaleMask {
  if (choice.kind === "chromatic") return CHROMATIC;
  return choice.kind === "major" ? majorMask(choice.root) : minorMask(choice.root);
}

export function scaleLabel(choice: ScaleChoice): string {
  if (choice.kind === "chromatic") return "Chromatic";
  return `${NOTE_NAMES[choice.root]} ${choice.kind}`;
}

export function hzToMidi(hz: number): number {
  return 69 + 12 * Math.log2(hz / 440);
}

export function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** "A3", "C#4"... from a (rounded) midi number. */
export function midiName(midi: number): string {
  const m = Math.round(midi);
  return `${NOTE_NAMES[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`;
}
