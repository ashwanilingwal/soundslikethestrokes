"use client";

import type { Clip, RecorderStatus } from "@/hooks/useRecorder";

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function RecorderBar({
  status,
  elapsed,
  clip,
  canRecord,
  onStart,
  onStop,
}: {
  status: RecorderStatus;
  elapsed: number;
  clip: Clip | null;
  canRecord: boolean;
  onStart: () => void;
  onStop: () => void;
}) {
  const recording = status === "recording";
  return (
    <div className="card flex flex-wrap items-center gap-2 px-3 py-2">
      {recording ? (
        <button type="button" className="btn btn-hot btn-sm" onClick={onStop}>
          <span className="rec-dot" aria-hidden /> stop · <span className="num">{fmt(elapsed)}</span>
        </button>
      ) : (
        <button type="button" className="btn btn-sm" disabled={!canRecord} onClick={onStart}>
          ● record
        </button>
      )}
      {clip ? (
        <>
          <audio controls src={clip.url} className="h-8 min-w-0 flex-1" />
          <a className="btn btn-sm" href={clip.url} download={`soundslikethestrokes.${clip.ext}`}>
            save
          </a>
        </>
      ) : (
        !recording && <span className="text-[11px] text-fg-dim">{canRecord ? "captures the effected output" : "go live first"}</span>
      )}
    </div>
  );
}
