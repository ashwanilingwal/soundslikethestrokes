"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Records the processed output (the graph's post-limiter recorder stream)
 * with MediaRecorder. Chrome and Firefox get webm/opus; Safari has no webm
 * encoder, so it falls back to audio/mp4.
 */

export type RecorderStatus = "idle" | "recording";

export interface Clip {
  url: string;
  mimeType: string;
  ext: string;
  seconds: number;
}

function pickMime(): { mimeType: string; ext: string } {
  if (typeof MediaRecorder !== "undefined") {
    if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
      return { mimeType: "audio/webm;codecs=opus", ext: "webm" };
    }
    if (MediaRecorder.isTypeSupported("audio/mp4")) {
      return { mimeType: "audio/mp4", ext: "m4a" };
    }
  }
  return { mimeType: "", ext: "webm" }; // let the browser choose
}

export function useRecorder(stream: MediaStream | null) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [clip, setClip] = useState<Clip | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAtRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clipUrlRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    if (!stream || recorderRef.current) return;
    const { mimeType, ext } = pickMime();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const seconds = (performance.now() - startedAtRef.current) / 1000;
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType });
      if (clipUrlRef.current) URL.revokeObjectURL(clipUrlRef.current);
      const url = URL.createObjectURL(blob);
      clipUrlRef.current = url;
      setClip({ url, mimeType: recorder.mimeType || mimeType, ext, seconds });
      recorderRef.current = null;
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
      setStatus("idle");
    };
    recorderRef.current = recorder;
    startedAtRef.current = performance.now();
    setElapsed(0);
    tickRef.current = setInterval(() => {
      setElapsed((performance.now() - startedAtRef.current) / 1000);
    }, 200);
    recorder.start();
    setStatus("recording");
  }, [stream]);

  // The stream dies with the graph; a recorder left running on a dead stream
  // would produce a truncated-but-valid clip, so finish it cleanly.
  useEffect(() => {
    if (!stream && recorderRef.current) recorderRef.current.stop();
  }, [stream]);

  useEffect(
    () => () => {
      recorderRef.current?.stop();
      if (tickRef.current) clearInterval(tickRef.current);
      if (clipUrlRef.current) URL.revokeObjectURL(clipUrlRef.current);
    },
    [],
  );

  return { status, elapsed, clip, start, stop };
}
