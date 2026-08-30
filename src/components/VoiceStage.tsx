"use client";

import { useState } from "react";
import { useRecorder } from "@/hooks/useRecorder";
import { useVoiceFx } from "@/hooks/useVoiceFx";
import { AdvancedPanel } from "./AdvancedPanel";
import { HeadphoneWarning } from "./HeadphoneWarning";
import { MicButton } from "./MicButton";
import { PitchReadout } from "./PitchReadout";
import { PresetCards } from "./PresetCards";
import { RecorderBar } from "./RecorderBar";

export function VoiceStage() {
  const fx = useVoiceFx();
  const recorder = useRecorder(fx.recorderStream);
  const [headphonesOk, setHeadphonesOk] = useState(false);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 py-10">
      <header className="flex flex-col items-center gap-1 text-center">
        {/* One unbroken 20-char word: size to the viewport, never wrap or clip. */}
        <h1 className="wordmark text-[clamp(1.35rem,7vw,3rem)]">soundslikethestrokes</h1>
        <p className="text-sm text-fg-muted">
          speak normally. hear a hard-tuned, blown-out, weirdly beautiful robot. live.
        </p>
      </header>

      <HeadphoneWarning checked={headphonesOk} onChange={setHeadphonesOk} />

      <div className="flex justify-center py-2">
        <MicButton
          status={fx.status}
          message={fx.message}
          disabled={!headphonesOk && fx.status !== "live"}
          onStart={() => void fx.start()}
          onStop={fx.stop}
        />
      </div>

      <PitchReadout telemetry={fx.telemetry} live={fx.status === "live"} />

      <PresetCards currentId={fx.preset.id} onSelect={fx.selectPreset} />

      <AdvancedPanel params={fx.params} scale={fx.scale} onParams={fx.updateParams} onScale={fx.selectScale} />

      <RecorderBar
        status={recorder.status}
        elapsed={recorder.elapsed}
        clip={recorder.clip}
        canRecord={fx.status === "live"}
        onStart={recorder.start}
        onStop={recorder.stop}
      />

      <footer className="pt-2 text-center text-xs text-fg-dim">
        everything runs in your browser — nothing is uploaded anywhere.
      </footer>
    </main>
  );
}
