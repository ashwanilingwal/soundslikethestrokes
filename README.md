# soundslikethestrokes

Speak into your mic, hear yourself live as a hard-autotuned, saturated,
band-limited robot — the Post Malone / T-Pain pitch snap crossed with a
blown-out Strokes megaphone vocal. Everything runs in the browser; no audio
ever leaves your machine.

Six era-inspired voices — three Julian Casablancas (Is This It, the I'll Try
Anything Once demo, The Voidz) and three Alex Turner (Whatever People Say I
Am, AM, Tranquility Base) — each card saying what actually differs from its
siblings.

Three controls do the work: **how much** of that voice you want (1% is your
own, 100% is full character), **robot** for the hard autotuned snap, and
**volume**. Everything else — glide, key, overdrive, bitcrush, EQ, presence,
transpose, warble, room and noise removal — hides behind a fine-tuning panel.
There's also a record button that captures the processed output.

Room noise is removed by a gate that learns your room's level while you're
quiet and requires a *periodic* signal to open, so a fan and a quiet vowel at
the same volume are told apart by periodicity rather than level.

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
npx tsx scripts/hardtune-eval.ts   # 13 offline DSP checks, no browser needed
npx tsc --noEmit && npm run lint && npm run build
```

Then open `/soundcheck` — it drives the whole audio chain with an oscillator
and prints PASS/FAIL lines, so everything except the final listen is testable
without a microphone. Run it against a production build too (`npm run start`),
since the audio worklet is assembled from serialised source at runtime.

See [AGENTS.md](AGENTS.md) for the architecture, the DSP internals and the
constraints that are easy to break.
