"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MicError,
  startVoiceGraph,
  type AdvancedParams,
  type Telemetry,
  type VoiceGraph,
} from "@/lib/audio/graph";
import { THE_STROKES, type Preset } from "@/lib/audio/presets";
import { maskFor, type ScaleChoice } from "@/lib/dsp/scales";

/**
 * Microphone -> effect chain, for the stage. The StrumLab useTuner pattern:
 * the graph lives in a ref (it is not render state), React state carries only
 * what the UI paints, and unmount tears the whole thing down.
 */

export type VoiceStatus = "off" | "opening" | "live" | "error";

function paramsFrom(preset: Preset): AdvancedParams {
  return {
    retuneGlideMs: preset.retuneGlideMs,
    dryWet: preset.dryWet,
    drive: preset.drive,
    bits: preset.bits,
    downsampleFactor: preset.downsampleFactor,
    highpassHz: preset.highpassHz,
    lowpassHz: preset.lowpassHz,
    masterGain: preset.masterGain,
  };
}

export function useVoiceFx() {
  const [status, setStatus] = useState<VoiceStatus>("off");
  const [message, setMessage] = useState<string | null>(null);
  const [preset, setPreset] = useState<Preset>(THE_STROKES);
  const [params, setParams] = useState<AdvancedParams>(paramsFrom(THE_STROKES));
  const [scale, setScale] = useState<ScaleChoice>({ kind: "chromatic" });
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  // Mirrored into state (not read off the ref) so renders see them appear.
  const [taps, setTaps] = useState<{ analyser: AnalyserNode; recorderStream: MediaStream } | null>(null);

  const graphRef = useRef<VoiceGraph | null>(null);
  // Live-selected values, readable from the async start() without staleness.
  const presetRef = useRef(preset);
  const scaleRef = useRef(scale);

  const stop = useCallback(() => {
    graphRef.current?.stop();
    graphRef.current = null;
    setStatus("off");
    setTelemetry(null);
    setTaps(null);
    setMessage(null);
  }, []);

  const start = useCallback(async () => {
    if (graphRef.current) return;
    setMessage(null);
    setStatus("opening");
    try {
      const graph = await startVoiceGraph(presetRef.current);
      graph.setScaleMask(maskFor(scaleRef.current));
      graph.onTelemetry(setTelemetry);
      graphRef.current = graph;
      setTaps({ analyser: graph.analyser, recorderStream: graph.recorderStream });
      setStatus("live");
    } catch (err) {
      graphRef.current?.stop();
      graphRef.current = null;
      setStatus("error");
      setMessage(err instanceof MicError ? err.message : "The microphone couldn't be started.");
    }
  }, []);

  const selectPreset = useCallback((next: Preset) => {
    presetRef.current = next;
    setPreset(next);
    setParams(paramsFrom(next));
    graphRef.current?.applyPreset(next);
  }, []);

  const updateParams = useCallback((patch: Partial<AdvancedParams>) => {
    setParams((prev) => ({ ...prev, ...patch }));
    graphRef.current?.setParams(patch);
  }, []);

  const selectScale = useCallback((next: ScaleChoice) => {
    scaleRef.current = next;
    setScale(next);
    graphRef.current?.setScaleMask(maskFor(next));
  }, []);

  useEffect(() => () => graphRef.current?.stop(), []);

  return {
    status,
    message,
    preset,
    params,
    scale,
    telemetry,
    /** null while the graph is down; components must handle both. */
    analyser: taps?.analyser ?? null,
    recorderStream: taps?.recorderStream ?? null,
    start,
    stop,
    selectPreset,
    updateParams,
    selectScale,
  };
}
