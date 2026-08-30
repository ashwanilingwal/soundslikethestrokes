"use client";

import { useRecorder } from "@/hooks/useRecorder";
import { useVoiceFx } from "@/hooks/useVoiceFx";
import { AdSlot } from "./AdSlot";
import { AdvancedPanel } from "./AdvancedPanel";
import { useConsent } from "./ConsentProvider";
import { MacroBars } from "./MacroBars";
import { MonitorBadge } from "./MonitorBadge";
import { MonitorModal } from "./MonitorModal";
import { PitchReadout } from "./PitchReadout";
import { RecorderBar } from "./RecorderBar";
import { VinylButton } from "./VinylButton";
import { VoicePicker } from "./VoicePicker";

/**
 * Laid out to fit a single screen on both a phone and a desktop: the deck
 * (record + readout) and the controls sit side by side once there is width
 * for it, and stack on a phone. Only the fine-tuning panel, which is closed
 * by default, can push the page past one screen.
 */
export function VoiceStage() {
  const fx = useVoiceFx();
  const recorder = useRecorder(fx.recorderStream);
  const consent = useConsent();

  return (
    <>
      {fx.monitor === null && <MonitorModal onChoose={fx.selectMonitor} />}

      <main className="stage">
        <header className="flex items-center gap-2">
          <h1 className="stage-title wordmark min-w-0 flex-1 truncate text-[clamp(1.05rem,4.6vw,1.9rem)]">
            soundslikethestrokes
          </h1>
          {fx.monitor && <MonitorBadge value={fx.monitor} onChange={fx.selectMonitor} />}
        </header>

        <div className="stage-grid">
          <section className="flex flex-col items-center gap-2">
            <VinylButton
              status={fx.status}
              message={fx.message}
              voice={fx.voice}
              disabled={fx.monitor === null}
              onStart={() => void fx.start()}
              onStop={fx.stop}
            />
          </section>

          <section className="flex min-w-0 flex-col gap-2">
            <VoicePicker voice={fx.voice} onSelect={fx.selectVoice} />
            <PitchReadout telemetry={fx.telemetry} live={fx.status === "live"} />
            <MacroBars
              match={fx.macros.match}
              robot={fx.macros.robot}
              volume={fx.macros.volume}
              voiceLabel={fx.voice.label}
              onChange={fx.setMacro}
            />
            <RecorderBar
              status={recorder.status}
              elapsed={recorder.elapsed}
              clip={recorder.clip}
              canRecord={fx.status === "live"}
              onStart={recorder.start}
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
          onOverride={fx.overrideParam}
          onCleanup={fx.setCleanupParam}
          onScale={fx.selectScale}
          onReset={fx.resetOverrides}
          onNoiseCancellation={fx.toggleNoiseCancellation}
        />

        {/* Below the fold by design — see AdSlot. */}
        <AdSlot />

        <footer className="stage-footer text-center text-[10px] leading-tight text-fg-dim">
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
      </main>
    </>
  );
}
