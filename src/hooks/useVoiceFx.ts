"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MicError,
  startFileGraph,
  startVoiceGraph,
  type AdvancedParams,
  type MonitorMode,
  type Telemetry,
  type VoiceGraph,
} from "@/lib/audio/graph";
import { canChooseOutput, listDevices, subscribeDevices, type AudioDevice } from "@/lib/audio/devices";
import { DEFAULT_VOICE, resolveParams, type Voice, type VoiceParams } from "@/lib/audio/voices";
import { maskFor, type ScaleChoice } from "@/lib/dsp/scales";

/**
 * Microphone -> effect chain, for the stage.
 *
 * Two layers of control, deliberately:
 *   - the macros (match / robot / volume) plus the chosen voice are the
 *     source of truth, and resolveParams() turns them into every parameter;
 *   - the fine-tuning panel writes `overrides` on top, which are dropped the
 *     moment the voice or a macro changes, because those would otherwise
 *     silently recompute the value out from under a slider the user moved.
 */

export type VoiceStatus = "off" | "opening" | "live" | "error";

/** Microphone, or an audio file decoded and fed through the same chain. */
export type SourceKind = "mic" | "file";

const DEFAULT_MACROS = { match: 0.7, robot: 0, volume: 1.1 };
/** Not voice-derived, so these survive voice changes. */
const DEFAULT_CLEANUP = { gateDb: -50, denoise: 0.7 };

export function useVoiceFx() {
  const [status, setStatus] = useState<VoiceStatus>("off");
  const [message, setMessage] = useState<string | null>(null);
  const [voice, setVoice] = useState<Voice>(DEFAULT_VOICE);
  const [macros, setMacros] = useState(DEFAULT_MACROS);
  const [cleanup, setCleanup] = useState(DEFAULT_CLEANUP);
  const [overrides, setOverrides] = useState<Partial<VoiceParams>>({});
  const [scale, setScale] = useState<ScaleChoice>({ kind: "chromatic" });
  /** null until the user has actively picked one - it doubles as the gate. */
  const [monitor, setMonitor] = useState<MonitorMode | null>(null);
  const [noiseCancellation, setNoiseCancellation] = useState(true);
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [taps, setTaps] = useState<{ analyser: AnalyserNode; recorderStream: MediaStream } | null>(null);
  const [source, setSource] = useState<SourceKind>("mic");
  const [file, setFile] = useState<File | null>(null);
  const [filePlaying, setFilePlaying] = useState(false);
  const [fileDuration, setFileDuration] = useState(0);
  const [devices, setDevices] = useState<{ inputs: AudioDevice[]; outputs: AudioDevice[] }>({
    inputs: [],
    outputs: [],
  });
  const [inputDeviceId, setInputDeviceId] = useState("");
  const [outputDeviceId, setOutputDeviceId] = useState("");

  const params: AdvancedParams = useMemo(
    () => ({ ...resolveParams(voice, { ...macros, ...cleanup }), ...overrides }),
    [voice, macros, cleanup, overrides],
  );

  const graphRef = useRef<VoiceGraph | null>(null);
  // Live values, readable from the async start() without staleness.
  const paramsRef = useRef(params);
  const scaleRef = useRef(scale);
  const monitorRef = useRef<MonitorMode | null>(null);
  const ncRef = useRef(true);
  const sourceRef = useRef<SourceKind>("mic");
  const fileRef = useRef<File | null>(null);
  const inputIdRef = useRef("");
  const outputIdRef = useRef("");

  // Push every recomputed parameter set at the running graph, and keep the
  // ref start() reads in sync. Cheap: the graph ramps continuous values and
  // only posts to the worklet when a worklet-side value actually changes.
  useEffect(() => {
    paramsRef.current = params;
    graphRef.current?.setParams(params);
  }, [params]);

  const stop = useCallback(() => {
    graphRef.current?.stop();
    graphRef.current = null;
    setStatus("off");
    setTelemetry(null);
    setTaps(null);
    setMessage(null);
    setFilePlaying(false);
  }, []);

  /** Resolves with the recorder feed, so a caller can record immediately. */
  const start = useCallback(async (): Promise<MediaStream | null> => {
    if (graphRef.current) return graphRef.current.recorderStream;
    setMessage(null);
    setStatus("opening");
    try {
      const useFile = sourceRef.current === "file" && fileRef.current;
      const graph = useFile
        ? await startFileGraph(paramsRef.current, fileRef.current!, {
            outputDeviceId: outputIdRef.current || undefined,
          })
        : await startVoiceGraph(paramsRef.current, {
            monitor: monitorRef.current ?? "headphones",
            noiseCancellation: ncRef.current,
            inputDeviceId: inputIdRef.current || undefined,
            outputDeviceId: outputIdRef.current || undefined,
          });
      graph.setScaleMask(maskFor(scaleRef.current));
      graph.onTelemetry(setTelemetry);
      graphRef.current = graph;
      setTaps({ analyser: graph.analyser, recorderStream: graph.recorderStream });
      setStatus("live");

      if (graph.file) {
        setFileDuration(graph.file.duration);
        graph.file.onEnded(() => setFilePlaying(false));
        graph.file.play();
        setFilePlaying(true);
      } else {
        // Device labels stay blank until a mic permission exists, so the
        // list is only worth re-reading once one has been granted.
        void listDevices().then(setDevices);
      }
      return graph.recorderStream;
    } catch (err) {
      graphRef.current?.stop();
      graphRef.current = null;
      setStatus("error");
      setMessage(
        err instanceof MicError
          ? err.message
          : sourceRef.current === "file"
            ? "That file couldn't be played."
            : "The microphone couldn't be started.",
      );
      return null;
    }
  }, []);

  const selectVoice = useCallback((next: Voice) => {
    setVoice(next);
    setOverrides({});
    // A voice labelled "auto" has to actually sound auto the moment it is
    // picked. At the default 70% match it would resolve to ~75 ms of glide,
    // which is a sung slide, not a snap - the one thing these voices exist
    // for. Jump match to full; the slider visibly moves, so pulling it back
    // is still obvious and available.
    if (next.autotuned) setMacros((prev) => ({ ...prev, match: 1 }));
  }, []);

  const setMacro = useCallback((patch: Partial<typeof DEFAULT_MACROS>) => {
    setMacros((prev) => ({ ...prev, ...patch }));
    // Volume is not derived from the voice, so it must not wipe fine-tuning.
    if (patch.match !== undefined || patch.robot !== undefined) setOverrides({});
  }, []);

  const setCleanupParam = useCallback((patch: Partial<typeof DEFAULT_CLEANUP>) => {
    setCleanup((prev) => ({ ...prev, ...patch }));
  }, []);

  const overrideParam = useCallback((patch: Partial<VoiceParams>) => {
    setOverrides((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetOverrides = useCallback(() => setOverrides({}), []);

  const selectScale = useCallback((next: ScaleChoice) => {
    scaleRef.current = next;
    setScale(next);
    graphRef.current?.setScaleMask(maskFor(next));
  }, []);

  const toggleNoiseCancellation = useCallback(
    (on: boolean) => {
      ncRef.current = on;
      setNoiseCancellation(on);
      const graph = graphRef.current;
      if (!graph) return;
      // Prefer retuning the live track; only rebuild if the browser refuses,
      // since a restart costs a visible dropout and re-prompts nothing.
      void graph.setNoiseCancellation(on).then((ok) => {
        if (!ok && graphRef.current) {
          stop();
          void start();
        }
      });
    },
    [start, stop],
  );

  const selectMonitor = useCallback(
    (next: MonitorMode) => {
      monitorRef.current = next;
      setMonitor(next);
      // Echo cancellation is a getUserMedia constraint, so a live graph has
      // to be rebuilt - a brief dropout beats making the choice sticky.
      if (graphRef.current) {
        stop();
        void start();
      }
    },
    [start, stop],
  );

  /**
   * Switching source tears the graph down: mic and file are different source
   * nodes on a context we do not reuse, and leaving the old one running would
   * mean two things feeding the chain at once.
   */
  const selectSource = useCallback(
    (next: SourceKind) => {
      if (next === sourceRef.current) return;
      sourceRef.current = next;
      setSource(next);
      if (graphRef.current) stop();
    },
    [stop],
  );

  const pickFile = useCallback(
    (next: File | null) => {
      fileRef.current = next;
      setFile(next);
      setFileDuration(0);
      if (next) {
        sourceRef.current = "file";
        setSource("file");
      }
      // A running graph holds the PREVIOUS file's decoded buffer, so it has
      // to go before the new one can play.
      if (graphRef.current) stop();
    },
    [stop],
  );

  /** File source: play/pause without tearing the decoded buffer down. */
  const toggleTransport = useCallback(() => {
    const t = graphRef.current?.file;
    if (!t) return;
    if (t.playing()) {
      t.pause();
      setFilePlaying(false);
    } else {
      t.play();
      setFilePlaying(true);
    }
  }, []);

  /** Microphone choice is a getUserMedia constraint, so it needs a restart. */
  const selectInputDevice = useCallback(
    (deviceId: string) => {
      inputIdRef.current = deviceId;
      setInputDeviceId(deviceId);
      if (graphRef.current && sourceRef.current === "mic") {
        stop();
        void start();
      }
    },
    [start, stop],
  );

  /** Output can be re-routed on the live context, no dropout needed. */
  const selectOutputDevice = useCallback((deviceId: string) => {
    outputIdRef.current = deviceId;
    setOutputDeviceId(deviceId);
    void graphRef.current?.setOutputDevice(deviceId);
  }, []);

  // Devices come and go (headset plugged in mid-session), so track the event
  // rather than reading the list once.
  useEffect(() => {
    let alive = true;
    const refresh = () => {
      void listDevices().then((d) => {
        if (alive) setDevices(d);
      });
    };
    refresh();
    const unsubscribe = subscribeDevices(refresh);
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => () => graphRef.current?.stop(), []);

  return {
    status,
    message,
    voice,
    macros,
    cleanup,
    params,
    hasOverrides: Object.keys(overrides).length > 0,
    scale,
    monitor,
    noiseCancellation,
    telemetry,
    /** null while the graph is down; components must handle both. */
    analyser: taps?.analyser ?? null,
    recorderStream: taps?.recorderStream ?? null,
    start,
    stop,
    selectVoice,
    setMacro,
    setCleanupParam,
    overrideParam,
    resetOverrides,
    selectScale,
    selectMonitor,
    toggleNoiseCancellation,
    source,
    file,
    fileName: file?.name ?? null,
    filePlaying,
    fileDuration,
    devices,
    inputDeviceId,
    outputDeviceId,
    canChooseOutput: canChooseOutput(),
    selectSource,
    pickFile,
    toggleTransport,
    selectInputDevice,
    selectOutputDevice,
  };
}
