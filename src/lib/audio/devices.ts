/**
 * Input and output device selection.
 *
 * Two caveats the UI has to live with:
 *
 * 1. Labels are hidden until the page holds a microphone permission. Before
 *    that the browser returns entries with empty `label` strings, so the list
 *    is only worth showing once the mic has been opened at least once.
 * 2. Choosing an OUTPUT is far less supported than choosing an input.
 *    `AudioContext.setSinkId` is Chromium-only at the time of writing, so
 *    `canChooseOutput()` gates the control rather than offering a picker that
 *    silently does nothing in Safari or Firefox.
 */

export interface AudioDevice {
  deviceId: string;
  label: string;
}

/** True when this browser can route audio to a chosen output device. */
export function canChooseOutput(): boolean {
  return typeof AudioContext !== "undefined" && "setSinkId" in AudioContext.prototype;
}

function labelFor(d: MediaDeviceInfo, index: number, kind: string): string {
  if (d.label) return d.label;
  if (d.deviceId === "default") return `Default ${kind}`;
  return `${kind} ${index + 1}`;
}

export async function listDevices(): Promise<{ inputs: AudioDevice[]; outputs: AudioDevice[] }> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
    return { inputs: [], outputs: [] };
  }
  try {
    const all = await navigator.mediaDevices.enumerateDevices();
    const pick = (kind: MediaDeviceKind, noun: string) =>
      all
        .filter((d) => d.kind === kind && d.deviceId)
        .map((d, i) => ({ deviceId: d.deviceId, label: labelFor(d, i, noun) }));
    return { inputs: pick("audioinput", "Microphone"), outputs: pick("audiooutput", "Output") };
  } catch {
    return { inputs: [], outputs: [] };
  }
}

/** Fires when devices are plugged in or removed. Returns an unsubscribe. */
export function subscribeDevices(onChange: () => void): () => void {
  if (typeof navigator === "undefined" || !navigator.mediaDevices) return () => {};
  navigator.mediaDevices.addEventListener("devicechange", onChange);
  return () => navigator.mediaDevices.removeEventListener("devicechange", onChange);
}
