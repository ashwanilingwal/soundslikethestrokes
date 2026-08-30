# soundslikethestrokes

Speak into your mic, hear yourself live as a hard-autotuned, saturated,
band-limited robot — the Post Malone / T-Pain pitch snap crossed with a
blown-out Strokes megaphone vocal. Everything runs in the browser; no audio
ever leaves your machine.

Thirteen era-inspired voices in one dropdown, autotune first: Julian
Casablancas (Is This It, the I'll Try Anything Once demo, The Voidz, The New
Abnormal), Alex Turner (Whatever People Say I Am, AM, Tranquility Base, The
Car) and Post Malone (Stoney, Hollywood's Bleeding, Twelve Carat Toothache),
plus hard-tuned "auto" takes on Julian and Alex. Picking one tells you exactly
what differs from its siblings.

Each voice is a picture disc: its own generated label art fills the whole
record, which spins while you're live. The art is original geometry in an
era-appropriate palette — not the real album sleeves, which are copyrighted
and aren't reproduced here.

The whole thing fits on one screen, phone or desktop, with the fine-tuning
panel folded away.

Three controls do the work: **how much** of that voice you want (1% is your
own, 100% is full character), **robot** for the hard autotuned snap, and
**volume**. Everything else — glide, key, overdrive, bitcrush, EQ, presence,
transpose, warble, room and noise removal — hides behind a fine-tuning panel.
There's also a record button that captures the processed output.

Background noise gets handled two ways: cancellation (on by default) pulls
steady noise out from underneath your voice while you speak, and a gate
silences the gaps between words — it learns your room's level while you're
quiet and needs a *periodic* signal to open, so a fan and a quiet vowel at the
same volume are told apart by periodicity rather than level.

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
npx tsx scripts/hardtune-eval.ts   # 15 offline DSP checks, no browser needed
                                   # (two of them range-check every voice)
npx tsc --noEmit && npm run lint && npm run build
```

Then open `/soundcheck` — it drives the whole audio chain with an oscillator
and prints PASS/FAIL lines, so everything except the final listen is testable
without a microphone. Run it against a production build too (`npm run start`),
since the audio worklet is assembled from serialised source at runtime.

See [AGENTS.md](AGENTS.md) for the architecture, the DSP internals and the
constraints that are easy to break.
