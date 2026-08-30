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
| `/` | The stage: blocking monitor modal, spinning-vinyl transport, pitch readout, 3 macro bars, voice cards, fine tuning, recorder |
| `/soundcheck` | Hidden diagnostics: drives the chain with an oscillator (no mic), prints PASS/FAIL lines |

## Signal chain

```
getUserMedia (noiseSuppression/autoGainControl OFF, mono;
              echoCancellation OFF in headphones mode, ON in speaker mode)
  → MediaStreamSource
  → AudioWorkletNode "hardtune"   [noise gate + NSDF pitch detect + semitone snap +
                                   grain shifter + warble LFO + dry/wet + bitcrush]
  → WaveShaper                    [tanh(drive·x)/tanh(drive), 4x oversample]
  → Biquad highpass → peaking 1.8 kHz "presence" → lowpass   [megaphone band + mid bite]
  → master gain                   [> 1 allowed: this is the output boost]
       ↑ parallel send: lowpass → Convolver (synthesised dark room IR) → roomWet →
  → DynamicsCompressor limiter    [-3 dB, knee 3, ratio 20, 1 ms / 80 ms — StrumLab's settings,
                                   deliberately LAST so the boost can't slam the DAC]
  → destination
        ├→ AnalyserNode           [soundcheck taps]
        └→ MediaStreamDestination [MediaRecorder]
```

## Layering (violations are bugs)

```
lib/dsp       pure DSP, no React, no Web Audio        (kernel + scales)
lib/audio     Web Audio: graph.ts is the ONLY file constructing nodes; presets.ts is data
hooks/        React ↔ graph bridges (useVoiceFx, useRecorder)
components/   UI only — no DSP, no Web Audio, no literal colours (tokens from globals.css)
              The vinyl transport is CSS-only: grooves are a repeating radial
              gradient and the sheen sits OUTSIDE the rotating element, so the
              highlight stays put while the disc turns under it.
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
- Transpose (`semitoneShift`) is applied to the *snapped* note, so it stays on
  the grid. Alex III uses −2 for the lower register.
- Warble = pitch LFO multiplied into the playback ratio (0–10 Hz, 0–100 cents):
  vibrato at small depths, melted-tape robot at large ones.
- No allocation inside `process()`.

### The noise gate, and why its position is load-bearing

Level alone cannot separate a laptop fan from a quiet vowel — they sit at the
same dB. So the gate uses two signals:

1. **Level vs a learned floor.** While the gate is shut, whatever is arriving
   *is* the room, so `noiseFloor` tracks it (up slowly over 2 s, down fast over
   150 ms, so a fan is learned but a held note can never drag the floor up to
   swallow the voice). Open threshold = `max(userThreshold, floor × (1 + 6 ×
   denoise))`.
2. **Periodicity.** A voice scores high NSDF clarity; fans, hiss and traffic
   score near zero. The detector already computes it, so it is free here.

Clarity is required to OPEN but never to STAY open — unvoiced consonants
(s, t, k) have almost no periodicity, and demanding it continuously bites the
front off every word.

Separately, the **browser's own noise suppressor** (`noiseSuppression` in
getUserMedia, default on) does the job the gate cannot: it attenuates steady
noise *underneath* the voice while you speak, where the gate can only silence
the gaps between words. Toggling it retunes the live track via
`applyConstraints`; if the browser refuses in place, the hook rebuilds the
graph. `autoGainControl` stays off regardless — a pumping input destabilises
both the learned floor and the tuning.

**The ring buffer gets the RAW input and the gate is applied at the OUTPUT.**
Do not "optimise" this back to gating before the ring: the gate's own
condition reads clarity, clarity comes from the detector, and the detector
reads the ring — gate the ring and a shut gate feeds it silence, clarity pins
to 0, and the gate can never satisfy the condition to reopen. Room noise
reaching the detector is harmless, because acquiring a note needs clarity 0.6.
Eval check `j` guards the whole arrangement: noise and a tone at *identical*
amplitude, where only the tone gets through.

## Voices and the macro model

Six era-inspired characters — not voice clones, and the UI says so. Each
card states what differs from its siblings, because "Julian I / II / III"
communicates nothing on its own.

| Voice | Era | What differs |
|---|---|---|
| Julian I | Is This It · 2001 | Narrow 450–3200 Hz telephone band, hard clipping, driest |
| Julian II | I'll Try Anything Once · 2006 demo | Warm 180–2600 Hz, keeps the chest, roomy, sung glide |
| Julian III | The Voidz · 2014→ | 8-bit crush, 5 Hz/55¢ seasick warble, hard snap |
| Julian IV | The New Abnormal · 2020 | **+5 semitones** into falsetto, brightest and wettest, least dirt |
| Julian · Auto | hard-tuned | Julian II's haze, glide 0, wet locked |
| Alex I | Whatever People Say I Am · 2006 | Bright, dry, barely coloured; wide 150–7000 Hz |
| Alex II | AM · 2013 | Smoother, softer top, real room |
| Alex III | Tranquility Base · 2018 | **−2 semitones**, dark 90–4000 Hz, wettest, least bite |
| Alex IV | The Car · 2022 | −1 semitone, silky, the only true singer's vibrato (4.5 Hz/18¢) |
| Alex · Auto | hard-tuned | AM smoothness, glide 0, no wobble |
| Posty I | Stoney · 2016 | Warm/hazy under a hard tune, rounded top |
| Posty II | Hollywood's Bleeding · 2019 | Cleanest path, brightest, biggest reverb |
| Posty III | Twelve Carat Toothache · 2022 | Rougher: real saturation + crush behind the tune |

Voices carrying `autotuned: true` **jump `match` to 100% when selected**. At
the default 70% they would resolve to ~75 ms of glide — a sung slide, which is
the one thing these voices exist to not be. The slider visibly moves, so
pulling it back stays obvious. Eval check `l` guards the invariant.

Voices are chosen from one dropdown (`components/VoicePicker.tsx`) grouped by
`voiceGroups()`. **Autotune leads the list**, since it is the headline feature
and burying it under three artist groups hides it; Post Malone has no
non-autotuned entries, so his artist group is dropped rather than rendered
empty.

### Label art

Every voice carries an `art` spec (`paper` / `ink` / `motif`) rendered by
`components/LabelArt.tsx` as inline SVG. It fills the **whole record face** —
a picture disc — with `.vinyl-grooves` riding on top as a translucent overlay
so it still reads as pressed vinyl rather than a sticker on a black circle.
The centre label is a solid `ink` disc so PLAY/STOP stays legible over
whatever the motif is doing underneath.

**This is original generated geometry in an era-appropriate palette, NOT the
real sleeves**, which are copyrighted and are deliberately not reproduced
anywhere in this app. Any new palette must keep `paper` and `ink` legible
against each other, since they are used as both artwork and label text.

### One-screen layout

The stage is sized to fit a single screen without scrolling. Verified with no
overflow at 360×640, 375×667, 375×812, 390×844, 414×896, 768×1024, 1280×800,
1440×720 and 1920×1080; a 320×568 (2016 SE-class) phone still overflows by
~15 px. Three height breakpoints progressively shrink the record and tighten
gaps (`≤720px`), then clamp the voice description and drop the footer
(`≤660px` / `≤620px`). Only the fine-tuning panel, closed by default, can push
past one screen — that is deliberate.

**Julian II is the default.** It targets the First Impressions *demo*, not the
album cut: warm and hazy, not megaphone-thin — hence the low cut at 180 Hz and
a glide that is deliberately NOT zero, because he slides between notes and a
hard robotic snap reads as Post Malone, not Julian.

`resolveParams()` in `lib/audio/voices.ts` is the single source of truth for
what the graph receives. Three macros feed it:

- **match** (1–100%) interpolates every parameter from `NEUTRAL` (your own
  voice, barely touched) to the voice's own values. Frequencies interpolate
  geometrically; a linear Hz sweep sounds lopsided.
- **robot** (0–100%) is a *separate axis* applied on top: kills the glide,
  crushes harder, drives hotter, forces full wet. "90% Julian but fully
  robotic" is a valid, reachable state — that is why it is not one blended
  slider.
- **volume** feeds master gain, which sits before the limiter.

The fine-tuning panel writes `overrides` on top of the resolved set. Those are
dropped when the voice or a macro changes, since they would otherwise be
silently recomputed out from under a slider the user moved. `gateDb` and
`denoise` are *not* voice-derived and therefore survive voice changes.

## Latency

≈35–60 ms end-to-end on wired headphones (hardware IO + render quanta + half a
grain). Bluetooth adds 100–300 ms and is useless for live monitoring — the UI
says so.

Two monitor modes, chosen in a blocking modal before anything else (the
transport is disabled until then, and the choice shrinks to a 🎧/🔊 badge in
the header that can switch it later). **Headphones**: echo cancellation off, the clean path.
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

## Deploying (Vercel)

Zero config — `vercel` or a Git import is enough. Every route is static, there
is no server code, no database and no env vars; the DSP runs entirely in the
visitor's browser. Notes that actually matter:

- **HTTPS is the point.** `getUserMedia` only works on a secure origin, so a
  deployed build is the first place this runs anywhere other than localhost.
  (`MicError`'s `insecure` branch is what a plain-http origin hits.)
- **`Permissions-Policy: microphone=(self)`** is set in `next.config.ts`. Same
  origin is already the browser default; it is explicit because the whole app
  dies without mic access, and `self` rather than `*` keeps an embedding
  iframe from inheriting it silently.
- **The Blob-URL worklet survives production minification** — verified by
  running the soundcheck against `next start`, not just `next dev` (SWC keeps
  the class intact and the `__name` shim covers name-mangling helpers). Re-run
  that check after any toolchain bump; it is the one thing about this app that
  a build change can quietly break.
- **If a Content-Security-Policy is ever added**, it must allow `blob:` in
  `script-src` and `worker-src`, or `audioWorklet.addModule()` fails and the
  app goes silent. There is no CSP today.

Verify a production build locally before deploying:

```
npm run build && npm run start -- --port 3601   # or the soundslikethestrokes-prod launch config
```

then open `/soundcheck` on 3601 and press run — all of A–G must PASS.

## v2 ideas

- TD-PSOLA shifter for cleaner tuning at the same latency.
- WAV export next to the webm/m4a clip.
- Formant preservation toggle; octave-down "Voidz" preset.
