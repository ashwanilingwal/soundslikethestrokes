/**
 * Turning the gate's learned room level into a verdict a person can act on.
 *
 * The number itself is a linear amplitude the kernel measures while the gate
 * is shut - i.e. while nobody is speaking - so it describes the ROOM rather
 * than the signal. Thresholds are in dBFS because that is the only scale on
 * which "quiet" means the same thing at every input gain.
 */

export type RoomVerdict = "unknown" | "quiet" | "some" | "noisy";

export interface RoomState {
  verdict: RoomVerdict;
  dbfs: number;
  /** Short label for the status dot. */
  label: string;
  /** What this means for the recording, in one sentence. */
  detail: string;
}

/**
 * Boundaries chosen against what the effect can absorb, not against any
 * broadcast standard:
 *   below -58  the noise sits under the gate and never reaches the output
 *   -58..-46   audible in the gaps, and the pitch detector starts hunting
 *   above -46  loud enough to survive the gate and ride under the voice,
 *              which is the only case a room print really fixes
 */
export function assessRoom(noiseFloor: number, live: boolean): RoomState {
  if (!live || noiseFloor <= 0) {
    return { verdict: "unknown", dbfs: -Infinity, label: "room not measured", detail: "Go live and the room level appears here." };
  }
  const dbfs = 20 * Math.log10(noiseFloor);
  if (dbfs < -58) {
    return { verdict: "quiet", dbfs, label: "quiet room", detail: "Nothing here needs cleaning up." };
  }
  if (dbfs < -46) {
    return {
      verdict: "some",
      dbfs,
      label: "some background",
      detail: "Audible between words. A room print would tidy it, though it is not spoiling anything.",
    };
  }
  return {
    verdict: "noisy",
    dbfs,
    label: "noisy room",
    detail: "Loud enough to sit under your voice and confuse the tuner. Worth measuring it out.",
  };
}
