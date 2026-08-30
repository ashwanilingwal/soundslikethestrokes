"use client";

/**
 * A hard gate, not a dismissible toast. Echo cancellation is deliberately off
 * in the capture chain (it would fight the monitored output), so open
 * speakers WILL howl. Start stays disabled until this is ticked.
 */
export function HeadphoneWarning({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="card flex cursor-pointer items-start gap-3 p-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
      />
      <span className="text-sm leading-relaxed">
        <span className="font-semibold">Headphones are on.</span>{" "}
        <span className="text-fg-muted">
          The mic monitors straight to the output with no echo cancellation — through speakers it feedback-howls
          instantly. Wired beats Bluetooth here: Bluetooth adds 100–300&nbsp;ms of delay.
        </span>
      </span>
    </label>
  );
}
