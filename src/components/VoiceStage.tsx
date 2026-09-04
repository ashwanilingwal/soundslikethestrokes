"use client";

import Link from "next/link";
import { useRecorder } from "@/hooks/useRecorder";
import { useVoiceFx } from "@/hooks/useVoiceFx";
import { artistShort } from "@/lib/audio/voices";
import { AdSlot } from "./AdSlot";
import { AdvancedPanel } from "./AdvancedPanel";
import { useConsent } from "./ConsentProvider";
import { MacroBars } from "./MacroBars";
import { MonitorBadge } from "./MonitorBadge";
import { SourceBar } from "./SourceBar";
import { MonitorModal } from "./MonitorModal";
import { PitchReadout } from "./PitchReadout";
import { RoomCheck } from "./RoomCheck";
import { RecorderBar } from "./RecorderBar";
import { VinylButton } from "./VinylButton";
import { VoicePicker } from "./VoicePicker";

/**
 * Laid out to fit a single screen on both a phone and a desktop: the deck
 * (record + readout) and the controls sit side by side once there is width
 * for it, and stack on a phone. Only the fine-tuning panel, which is closed
 * by default, can push the page past one screen.
 *
 * `children` is the below-the-fold prose (SiteCopy). It arrives as a prop
 * rather than an import so it can stay a SERVER component - that keeps the
 * page's readable text in the initial HTML for crawlers without adding a byte
 * to this client bundle.
 */
export function VoiceStage({ children }: { children?: React.ReactNode }) {
  const fx = useVoiceFx();
  const recorder = useRecorder(fx.recorderStream);
  const consent = useConsent();

  const isFile = fx.source === "file";
  const graphUp = fx.status === "live";
  // A file needs a picked file before it can start; the mic needs the monitor
  // question answered, because that decides how the mic is opened.
  const blocked = isFile ? !fx.file : fx.monitor === null;
  // For a file, "active" means audibly playing - a paused file still holds a
  // decoded buffer and a live graph.
  const active = isFile ? fx.filePlaying : graphUp;

  /**
   * Record does not require going live first: if nothing is running it starts
   * the engine and records from the first sample. start() hands back the
   * recorder feed directly, because the graph is built inside this click and
   * its stream would not reach useRecorder as a prop until the next render.
   */
  const onRecord = async () => {
    if (recorder.status === "recording") {
      recorder.stop();
      return;
    }
    if (graphUp) {
      recorder.start();
      return;
    }
    recorder.startWith(await fx.start());
  };

  const onTransport = () => {
    if (isFile && graphUp) fx.toggleTransport();
    else if (graphUp) fx.stop();
    else void fx.start();
  };

  return (
    <>
      {fx.monitor === null && <MonitorModal onChoose={fx.selectMonitor} />}

      <main className="stage">
        <div className="win stage-window">
          <div className="win-title">
            <span>vocal deck · live pitch unit</span>
            <span className="win-dots" aria-hidden>
              <span className="win-dot" />
              <span className="win-dot" />
              <span className="win-dot" />
            </span>
          </div>

          <header className="flex items-center gap-2 px-1">
            <h1 className="stage-title wordmark min-w-0 flex-1 truncate text-[clamp(0.85rem,3.6vw,1.4rem)]">
              soundslikethestrokes
            </h1>
            <Link href="/guide" className="guide-link" title="What every control does">
              guide
            </Link>
            {fx.monitor && <MonitorBadge value={fx.monitor} onChange={fx.selectMonitor} />}
          </header>

          <div className="stage-grid">
          <section className="flex flex-col items-center gap-2">
            <VinylButton
              status={fx.status}
              message={fx.message}
              voice={fx.voice}
              disabled={blocked}
              active={active}
              idleLabel={isFile ? "PLAY" : "GO LIVE"}
              activeLabel={isFile ? "PAUSE" : "STOP"}
              onClick={onTransport}
            />
          </section>

          <section className="flex min-w-0 flex-col gap-2">
            <SourceBar
              source={fx.source}
              fileName={fx.fileName}
              fileDuration={fx.fileDuration}
              onSource={fx.selectSource}
              onFile={fx.pickFile}
            />
            <VoicePicker voice={fx.voice} onSelect={fx.selectVoice} />
<div className="card readout-card">
                          <PitchReadout telemetry={fx.telemetry} live={fx.status === "live"} />
              {/* On the deck, not buried in the panel: someone who does not know
                  their room is noisy will never open a drawer to find out. */}
              <RoomCheck
                noiseFloor={fx.noiseFloor}
                live={graphUp && !isFile}
                learnProgress={fx.learnProgress}
                hasNoiseProfile={fx.hasNoiseProfile}
                onLearn={fx.learnRoom}
                onClear={fx.clearRoom}
              />
            </div>
            <MacroBars
              match={fx.macros.match}
              robot={fx.macros.robot}
              volume={fx.macros.volume}
              voiceLabel={artistShort(fx.voice)}
              onChange={fx.setMacro}
            />
            <RecorderBar
              status={recorder.status}
              elapsed={recorder.elapsed}
              clip={recorder.clip}
              canRecord={!blocked}
              needsStart={!graphUp}
              onStart={() => void onRecord()}
              onStop={recorder.stop}
            />
          </section>
          </div>

          <AdvancedPanel
            params={fx.params}
            cleanup={fx.cleanup}
            scale={fx.scale}
            hasOverrides={fx.hasOverrides}
            noiseCancellation={fx.noiseCancellation}
            devices={fx.devices}
            inputDeviceId={fx.inputDeviceId}
            outputDeviceId={fx.outputDeviceId}
            canChooseOutput={fx.canChooseOutput}
            onInputDevice={fx.selectInputDevice}
            onOutputDevice={fx.selectOutputDevice}
            onOverride={fx.overrideParam}
            onCleanup={fx.setCleanupParam}
            onScale={fx.selectScale}
            onReset={fx.resetOverrides}
            onNoiseCancellation={fx.toggleNoiseCancellation}
            hasNoiseProfile={fx.hasNoiseProfile}
            onExport={fx.exportPreset}
            onImport={fx.importPreset}
          />
        </div>

        {/* Below the fold by design — see AdSlot. */}
        <AdSlot />
      </main>

      {/* Everything below here is OUTSIDE <main>, and that placement is the
          load-bearing part. .stage is a flex column whose window fills the
          screen via flex:1, which only works while there is free space to
          distribute — put a long article inside it and the container
          overflows, the free space goes to zero, and the deck silently
          collapses to its content height. Kept as siblings of a
          min-height:100dvh main, the deck fills the first screen no matter
          how much reading matter follows it. */}
      {children}

      {/* Sitting on the desktop rather than in the window — so it takes the
          light ink rather than the window's dark. */}
      <footer className="stage-footer text-center text-[10px] leading-tight text-white/60">
        Runs entirely in your browser. Era-inspired voice characters and original label art — not clones, not the real
        sleeves.
        {consent.trackingConfigured && consent.consent !== "unknown" && (
          <>
            {" · "}
            <button type="button" className="consent-reopen" onClick={consent.reconsider}>
              cookie choices
            </button>
          </>
        )}
      </footer>
    </>
  );
}
