# soundslikethestrokes

Speak into your mic, hear yourself live as a hard-autotuned, saturated,
band-limited robot — the Post Malone / T-Pain pitch snap crossed with a
blown-out Strokes megaphone vocal. Everything runs in the browser; no audio
ever leaves your machine.

Four presets: **I'll Try Anything Once** (warm, hazy bedroom-demo saturation),
**The Strokes** (telephone-band megaphone), **Posty** (hard chromatic snap,
glossy), and **Voidz** (seasick tape warble). Behind them, individual controls
for retune glide, key/scale, drive, bitcrush, EQ band, presence, noise gate,
warble, room and output boost — plus a record button that captures the
processed output.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3600 — **headphones recommended**. There is a
speakers mode that enables echo cancellation to stop the feedback howl, at the
cost of the browser's AEC occasionally ducking the effect.

## Deploying

Zero-config on Vercel — all routes are static and there is no server code or
env config:

```bash
npx vercel
```

A secure origin matters here: `getUserMedia` refuses to run over plain http,
so the deployed HTTPS build is the only way to use this off localhost.

## Verifying changes

```bash
npx tsx scripts/hardtune-eval.ts   # 11 offline DSP checks, no browser needed
npx tsc --noEmit && npm run lint && npm run build
```

Then open `/soundcheck` — it drives the whole audio chain with an oscillator
and prints PASS/FAIL lines, so everything except the final listen is testable
without a microphone. Run it against a production build too (`npm run start`),
since the audio worklet is assembled from serialised source at runtime.

See [AGENTS.md](AGENTS.md) for the architecture, the DSP internals and the
constraints that are easy to break.
