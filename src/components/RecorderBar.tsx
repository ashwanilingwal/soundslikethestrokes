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
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        {recording ? (
          <button type="button" className="btn btn-hot" onClick={onStop}>
            <span className="rec-dot" aria-hidden /> stop · <span className="num">{fmt(elapsed)}</span>
          </button>
        ) : (
          <button type="button" className="btn" disabled={!canRecord} onClick={onStart}>
            ● record
          </button>
        )}
        {!canRecord && !recording && <span className="text-xs text-fg-dim">go live first — this captures the effected output</span>}
      </div>
      {clip && (
        <div className="flex flex-wrap items-center gap-3">
          <audio controls src={clip.url} className="h-9 max-w-full flex-1" />
          <a className="btn" href={clip.url} download={`soundslikethestrokes.${clip.ext}`}>
            download · <span className="num">{fmt(clip.seconds)}</span>
          </a>
        </div>
      )}
    </div>
  );
}
