"use client";

import { useRecorder } from "@/hooks/useRecorder";
import { useVoiceFx } from "@/hooks/useVoiceFx";
import { AdvancedPanel } from "./AdvancedPanel";
import { MacroBars } from "./MacroBars";
import { MonitorBadge } from "./MonitorBadge";
import { MonitorModal } from "./MonitorModal";
import { PitchReadout } from "./PitchReadout";
import { RecorderBar } from "./RecorderBar";
import { VinylButton } from "./VinylButton";
import { VoiceCards } from "./VoiceCards";

export function VoiceStage() {
  const fx = useVoiceFx();
  const recorder = useRecorder(fx.recorderStream);

  return (
    <>
      {fx.monitor === null && <MonitorModal onChoose={fx.selectMonitor} />}

      <main className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 py-8">
        <header className="flex items-start gap-3">
          <div className="min-w-0 flex-1 text-center">
            {/* One unbroken 20-char word: size to the viewport, never wrap or clip. */}
            <h1 className="wordmark text-[clamp(1.35rem,7vw,3rem)]">soundslikethestrokes</h1>
            <p className="mt-1 text-sm text-fg-muted">speak normally. come out the other side as someone else.</p>
          </div>
          {fx.monitor && <MonitorBadge value={fx.monitor} onChange={fx.selectMonitor} />}
        </header>

        <div className="flex justify-center py-1">
          <VinylButton
            status={fx.status}
            message={fx.message}
            label={fx.voice.label}
            disabled={fx.monitor === null}
            onStart={() => void fx.start()}
            onStop={fx.stop}
          />
        </div>

        <PitchReadout telemetry={fx.telemetry} live={fx.status === "live"} />

        <MacroBars
          match={fx.macros.match}
          robot={fx.macros.robot}
          volume={fx.macros.volume}
          voiceLabel={fx.voice.label}
          onChange={fx.setMacro}
        />

        <VoiceCards currentId={fx.voice.id} onSelect={fx.selectVoice} />

        <AdvancedPanel
          params={fx.params}
          cleanup={fx.cleanup}
          scale={fx.scale}
          hasOverrides={fx.hasOverrides}
          onOverride={fx.overrideParam}
          onCleanup={fx.setCleanupParam}
          onScale={fx.selectScale}
          onReset={fx.resetOverrides}
        />

        <RecorderBar
          status={recorder.status}
          elapsed={recorder.elapsed}
          clip={recorder.clip}
          canRecord={fx.status === "live"}
          onStart={recorder.start}
          onStop={recorder.stop}
        />

        <footer className="pt-2 text-center text-xs text-fg-dim">
          Everything runs in your browser — nothing is uploaded. These are era-inspired voice characters, not clones.
        </footer>
      </main>
    </>
  );
}
