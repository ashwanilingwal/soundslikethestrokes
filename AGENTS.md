<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# soundslikethestrokes

Speak into the mic, hear yourself live as a hard-autotuned, saturated, band-limited
robot — the Post Malone / T-Pain snap plus the later-Strokes megaphone vocal.
Client-only Next.js app; nothing leaves the browser. Record button captures the
processed output for download.

## Routes

| Route | What |
|---|---|
| `/` | The stage: monitor-mode picker, go-live button, pitch readout, presets, knobs, recorder |
| `/soundcheck` | Hidden diagnostics: drives the chain with an oscillator (no mic), prints PASS/FAIL lines |

## Signal chain

```
getUserMedia (noiseSuppression/autoGainControl OFF, mono;
              echoCancellation OFF in headphones mode, ON in speaker mode)
  → MediaStreamSource
  → AudioWorkletNode "hardtune"   [NSDF pitch detect + semitone snap + grain shifter + dry/wet + bitcrush]
  → WaveShaper                    [tanh(drive·x)/tanh(drive), 4x oversample]
  → Biquad highpass → lowpass     [megaphone band-limit]
  → DynamicsCompressor limiter    [-3 dB, knee 3, ratio 20, 1 ms / 80 ms — StrumLab's settings]
  → master gain → destination
        ├→ AnalyserNode           [soundcheck taps]
        └→ MediaStreamDestination [MediaRecorder]
```

## Layering (violations are bugs)

```
lib/dsp       pure DSP, no React, no Web Audio        (kernel + scales)
lib/audio     Web Audio: graph.ts is the ONLY file constructing nodes; presets.ts is data
hooks/        React ↔ graph bridges (useVoiceFx, useRecorder)
components/   UI only — no DSP, no Web Audio, no literal colours (tokens from globals.css)
```

**`lib/dsp/hardtuneKernel.ts` may import nothing and reference nothing outside
itself.** The class is serialised with `HardtuneKernel.toString()` into the
worklet's Blob-URL module (see `PROCESSOR_SOURCE` in `lib/audio/graph.ts`), where
module scope does not exist. The same class runs directly under Node for the
offline eval. If a toolchain change ever mangles the serialised class, the
fallback is to ship the compiled kernel as `public/hardtune-worklet.js` and
`addModule()` that path instead.

## Kernel facts (at 48 kHz)

- Ring buffer 8192 samples (~170 ms), power-of-two masking.
- Pitch detect: McLeod/NSDF ported from StrumLab's `lib/listen/pitch.ts`, run on
  ×2-decimated input (voice < 1 kHz, so a 12 kHz Nyquist loses nothing and the
  O(n·maxLag) cost drops 4×). Window 1024 decimated samples ≈ 43 ms, hop 512
  input samples ≈ 10.7 ms, range 70–1000 Hz, clarity acquire 0.6 / hold 0.45.
- Snap: nearest allowed note under a 12-bool scale mask (chromatic default);
  ratio clamped [0.5, 2]. Retune glide 0 ms = the robotic instant snap (2 ms
  smoothing floor kills clicks only).
- Shifter: dual-tap crossfaded delay line ("Doppler wheel"), 33 ms grain,
  sin²/cos² fades. Its warble IS the aesthetic; TD-PSOLA is the v2 upgrade.
- Dry tap reads at the shifter's mean delay so dry/wet mixing can't comb-filter.
- Unvoiced: hold last ratio 200 ms (consonants at note-ends stay pitched), then
  relax to unity over 50 ms. Never bypass — a delay jump clicks.
- No allocation inside `process()`.

## Presets

| Param | The Strokes | Posty |
|---|---|---|
| retune glide | 40 ms | 0 ms |
| drive | 6 | 2 |
| bits / downsample | 10 / 3× | 16 / 1× (off) |
| band | 400–3200 Hz | 120–9000 Hz |
| master | 0.85 | 0.9 |

## Latency

≈35–60 ms end-to-end on wired headphones (hardware IO + render quanta + half a
grain). Bluetooth adds 100–300 ms and is useless for live monitoring — the UI
says so.

Two monitor modes, chosen before going live (a hard gate — Start is disabled
until one is picked). **Headphones**: echo cancellation off, the clean path.
**Speakers**: echo cancellation ON — the browser's AEC uses the page's own
output as its far-end reference, which is what breaks the voice → speakers →
mic feedback loop. The AEC may duck or warble the effect (a pitch-shifted copy
of the mic is exactly the correlated signal it exists to remove), so speakers
are the workable mode, headphones the good one. Switching modes while live
rebuilds the graph (AEC is a getUserMedia constraint).

## Verifying changes

```
npx tsx scripts/hardtune-eval.ts   # offline kernel eval: snap accuracy, scale mask, hold/relax
npx tsc --noEmit && npm run lint && npm run build
```

Then open `/soundcheck` in the browser and press run — it exercises the whole
chain with an oscillator and needs no microphone. Only the final listen (mic +
headphones) needs a human.

## v2 ideas

- TD-PSOLA shifter for cleaner tuning at the same latency.
- WAV export next to the webm/m4a clip.
- Formant preservation toggle; octave-down "Voidz" preset.
