"use client";

import { useRef } from "react";
import type { SourceKind } from "@/hooks/useVoiceFx";

function fmt(seconds: number): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Where the audio comes from. The file path runs the exact same chain as the
 * microphone - it is a different source node, not a different effect - so a
 * track can be pitched and mangled the same way a voice is.
 *
 * Decoding happens in the page; the file is never uploaded anywhere.
 */
export function SourceBar({
  source,
  fileName,
  fileDuration,
  onSource,
  onFile,
}: {
  source: SourceKind;
  fileName: string | null;
  fileDuration: number;
  onSource: (k: SourceKind) => void;
  onFile: (f: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="seg-row shrink-0" role="group" aria-label="input source">
        <button
          type="button"
          className={`seg ${source === "mic" ? "seg-on" : ""}`}
          aria-pressed={source === "mic"}
          onClick={() => onSource("mic")}
        >
          🎙 Mic
        </button>
        <button
          type="button"
          className={`seg ${source === "file" ? "seg-on" : ""}`}
          aria-pressed={source === "file"}
          onClick={() => (fileName ? onSource("file") : inputRef.current?.click())}
        >
          ♫ File
        </button>
      </div>

      {source === "file" && (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button type="button" className="btn btn-sm shrink-0" onClick={() => inputRef.current?.click()}>
            {fileName ? "change" : "choose"}
          </button>
          <span className="min-w-0 flex-1 truncate text-[11px] text-fg-muted" title={fileName ?? undefined}>
            {fileName ?? "mp3, wav, m4a, flac or ogg — stays on your machine"}
          </span>
          {fileDuration > 0 && <span className="num shrink-0 text-[11px] text-fg-dim">{fmt(fileDuration)}</span>}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.m4a,.flac,.ogg,.aac"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          if (f) onFile(f);
          // Clear, so picking the SAME file again still fires a change event.
          e.target.value = "";
        }}
      />
    </div>
  );
}
