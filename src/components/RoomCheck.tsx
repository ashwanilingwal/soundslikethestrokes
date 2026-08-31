"use client";

import { assessRoom } from "@/lib/roomCheck";
import { InfoButton } from "./InfoButton";

/**
 * Tells you whether your room is quiet enough BEFORE you record, and offers
 * the fix in the same breath.
 *
 * This lived inside the fine-tuning panel, where it was useless: a person who
 * does not know their room is noisy has no reason to open a drawer labelled
 * "tweak the sound". It reads the level the gate already measures while
 * nobody is speaking, so there is nothing to press to find out.
 *
 * Kept to one line when the room is quiet - the common case should cost no
 * attention and no vertical space.
 */
export function RoomCheck({
  noiseFloor,
  live,
  learnProgress,
  hasNoiseProfile,
  onLearn,
  onClear,
}: {
  noiseFloor: number;
  live: boolean;
  learnProgress: number;
  hasNoiseProfile: boolean;
  onLearn: () => void;
  onClear: () => void;
}) {
  const room = assessRoom(noiseFloor, live);
  const measuring = learnProgress < 1;
  // No news is good news. A permanent "your room is fine" badge is a line of
  // furniture that costs a card's worth of height on every screen and tells
  // you nothing you need; the strip appears only when it has something to
  // say. That is also what keeps the deck on one screen.
  const silent = !measuring && !hasNoiseProfile && (room.verdict === "quiet" || room.verdict === "unknown");
  if (silent) return null;
  // Once a print exists the verdict is stale by design: it describes the room
  // going in, not what survives the subtraction.
  const actionable = live && !measuring && !hasNoiseProfile && (room.verdict === "some" || room.verdict === "noisy");

  return (
    <div className={`room-check room-${measuring ? "measuring" : hasNoiseProfile ? "fixed" : room.verdict}`}>
      <span className="room-dot" aria-hidden />
      <span className="room-line">
        <span className="room-label">
          {measuring ? "listening to the room…" : hasNoiseProfile ? "room removed" : room.label}
          {live && !measuring && (
            <span className="room-db num">{room.dbfs > -Infinity ? ` ${Math.round(room.dbfs)} dB` : ""}</span>
          )}
        </span>
        {(actionable || measuring) && (
          <span className="room-detail">
            {measuring ? "Stay silent — whatever it hears now is what gets subtracted." : room.detail}
          </span>
        )}
        {/* Said out loud rather than hidden in the popover: no amount of
            processing beats a mic that never hears the fan in the first
            place, so a noisy room is exactly when to mention it. */}
        {room.verdict === "noisy" && !measuring && !hasNoiseProfile && (
          <span className="room-tip">
            A plug-in microphone helps more than any of this — closer to you, further from your fans.
          </span>
        )}
      </span>

      {measuring ? (
        <span className="room-progress" aria-label="measuring">
          <span className="room-progress-fill" style={{ width: `${learnProgress * 100}%` }} />
        </span>
      ) : hasNoiseProfile ? (
        <button type="button" className="btn btn-sm" onClick={onClear}>
          undo
        </button>
      ) : (
        actionable && (
          <button type="button" className="btn btn-sm btn-hot" onClick={onLearn}>
            clean it up
          </button>
        )
      )}

      <InfoButton
        term="room check"
        whatItDoes="Reads how loud your room is whenever you stop talking, and rates it. Below about -58 dB nothing needs doing; louder than roughly -46 dB the noise rides under your voice and confuses the pitch tracker, which is when cleaning up actually helps."
        inTheWild="A dedicated microphone is the bigger win: it sits closer to your mouth and further from your laptop's fans, so it picks up far less room to begin with. Any plug-in USB or XLR mic beats a built-in one, and pointing it away from the machine helps more than any amount of processing."
      />
    </div>
  );
}
