/**
 * Plain-English copy for every control, in one place.
 *
 * Labels gloss jargon with a slash ("room / reverb") so the same word works
 * for someone who knows the term and someone meeting it for the first time.
 * `whatItDoes` and `inTheWild` feed the (i) popovers and the sound guide, so
 * a control is explained identically wherever it appears.
 */

export interface ControlCopy {
  id: string;
  /** UI label. Slash-glossed where the term is jargon. */
  label: string;
  /** Under ~60 chars, shown beneath the slider. */
  oneLiner: string;
  /** What changes in the sound as you turn it up. */
  whatItDoes: string;
  /** How the technique is actually used on records. */
  inTheWild: string;
}

export const CONTROL_COPY: Record<string, ControlCopy> = {
  "match": {
    id: "match",
    label: "match / how much modelled voice",
    oneLiner: "1% is you, 100% is the full modelled character.",
    whatItDoes: "Crossfades between your own untouched voice and the full modelled character, scaling the tuning, tone shaping and grit up together. Low settings just tint your natural sound rather than replacing it.",
    inTheWild: "Records rarely commit to a fully processed vocal — engineers blend the treated version underneath the natural one so the character reads as attitude rather than as an obvious effect.",
  },
  "robot": {
    id: "robot",
    label: "robot / machine hardness",
    oneLiner: "Snaps pitch instantly and adds bite and crunch.",
    whatItDoes: "Pulls the pitch glide down to nothing so notes jump instead of sliding, and at the same time pushes harder into the crusher and the saturation. Turn it up and the voice stops sounding sung and starts sounding generated.",
    inTheWild: "Glide-free, stair-stepped pitch correction stopped being a repair tool in the late 1990s and became a deliberate lead-vocal sound, running from rap hooks through pop choruses to hyperpop.",
  },
  "volume": {
    id: "volume",
    label: "volume",
    oneLiner: "Output level; past 100% it pushes the limiter.",
    whatItDoes: "Sets how loud the finished voice leaves the app. Everything passes through a limiter on the way out, so pushing past 100% makes the sound denser and more squashed rather than genuinely louder.",
    inTheWild: "Mix engineers drive limiters on purpose for exactly this trade: give up some dynamic range and the vocal stays constantly forward instead of ducking behind a loud backing track.",
  },
  "retuneGlideMs": {
    id: "retuneGlideMs",
    label: "glide / retune speed",
    oneLiner: "0 ms snaps between notes; higher ms slides.",
    whatItDoes: "Controls how long the pitch takes to travel to the corrected note. At zero it jumps in hard steps between notes; raise it and the voice scoops and slides into pitch the way a singer does.",
    inTheWild: "Transparent tuning uses a slow enough setting that scoops and vibrato survive untouched, while the fastest setting is what produces the audible stair-step sound used as a stylistic choice on countless hooks.",
  },
  "semitoneShift": {
    id: "semitoneShift",
    label: "pitch shift / semitones",
    oneLiner: "Moves the tuned note up or down in semitones.",
    whatItDoes: "Transposes the corrected note in whole semitone steps — twelve of them is a full octave. Small moves recolour the voice slightly; large ones turn it into a completely different character.",
    inTheWild: "Octave-down doubles are a standard way to make a chorus feel bigger, and pitch-shifted voices are the backbone of both sped-up soul sampling and monster-voice sound design in film.",
  },
  "dryWet": {
    id: "dryWet",
    label: "blend / dry vs shifted",
    oneLiner: "How much shifted voice sits over the original.",
    whatItDoes: "Balances your untouched voice against the pitch-shifted one. Halfway you hear both at once, which reads as a doubled or harmonised vocal rather than a replaced one.",
    inTheWild: "Keeping some untreated voice in the blend is how producers add harmony and octave lines that thicken a lead without smearing the words.",
  },
  "drive": {
    id: "drive",
    label: "drive / distortion",
    oneLiner: "Warmth first, then grit, then full crunch.",
    whatItDoes: "Pushes the signal into soft clipping, rounding off the loudest peaks. A little adds body and makes the voice feel louder; a lot turns it fuzzy and aggressive.",
    inTheWild: "Sending vocals through valve preamps, guitar amps or a cheap distortion pedal is a long-standing way to make a clean, polite take sound urgent and shouted.",
  },
  "bits": {
    id: "bits",
    label: "bit depth / resolution",
    oneLiner: "Fewer bits = grainy, gritty digital fuzz.",
    whatItDoes: "Sets how finely the waveform's loudness is measured. High values are clean; as you drop it the sound is rounded to coarse steps and a gritty fuzz appears, most obvious under quiet passages.",
    inTheWild: "Low-resolution audio is now a genre signature rather than a limitation — the crunch of early samplers and handheld game chips was adopted wholesale by chiptune, lo-fi hip-hop and industrial vocals.",
  },
  "downsampleFactor": {
    id: "downsampleFactor",
    label: "sample rate crush / downsampling",
    oneLiner: "Higher settings sound duller and more metallic.",
    whatItDoes: "Throws samples away so the audio effectively runs at a lower rate. Higher settings dull the top end and add a ringing, metallic edge that doesn't move with the note you sing.",
    inTheWild: "Producers deliberately bounce audio through low sample rates to get vintage-sampler character, the same artefact that gives 12-bit drum machines and early rap records their grain.",
  },
  "warbleHz": {
    id: "warbleHz",
    label: "warble speed / vibrato rate",
    oneLiner: "Wobbles per second — slow sway to fast flutter.",
    whatItDoes: "Sets how many times a second the pitch sways up and down. Around five to seven it reads as a singer's vibrato; much slower feels like warped tape, and much faster turns buzzy.",
    inTheWild: "Tape and turntable speed instability produces exactly this, and engineers now add the slow sway (wow) and fast tremble (flutter) back in on purpose for a worn, secondhand feel.",
  },
  "warbleCents": {
    id: "warbleCents",
    label: "warble depth / pitch swing",
    oneLiner: "How far the pitch swings — 100 cents is a semitone.",
    whatItDoes: "Sets how far each wobble travels away from the note. A few cents is subtle, expressive vibrato; a hundred or more bends far enough to sound seasick and broken.",
    inTheWild: "Because singers use narrow vibrato as expression, small amounts read as simply human, while the wide setting gives the damaged-cassette drift that vaporwave and lo-fi built an aesthetic on.",
  },
  "highpassHz": {
    id: "highpassHz",
    label: "low cut / high-pass",
    oneLiner: "Removes everything below this — thins the voice.",
    whatItDoes: "Silences frequencies under the number you set. Raising it strips out rumble, handling noise and chest weight, and past a few hundred hertz the voice goes thin and boxy.",
    inTheWild: "Nearly every recorded vocal gets a low cut around 80–100 Hz to clear rumble and popped consonants; pushing it far higher and pairing it with a high cut is how the telephone and megaphone sounds are built.",
  },
  "lowpassHz": {
    id: "lowpassHz",
    label: "high cut / low-pass",
    oneLiner: "Removes everything above this — dulls the top.",
    whatItDoes: "Silences frequencies above the number you set. Pulling it down takes away air and sibilance first, then clarity, until the voice sounds like it's coming through a wall.",
    inTheWild: "Squeezing a vocal between a high cut and a low cut is the standard radio, phone-call or next-room treatment used on a verse so the full-range chorus lands harder.",
  },
  "presenceDb": {
    id: "presenceDb",
    label: "presence / vocal bite",
    oneLiner: "Boosts around 1.8 kHz — cuts through the mix.",
    whatItDoes: "Lifts a band around 1.8 kHz, where consonants and the hard edge of a voice live. A few dB makes the words pop forward; too much gets shouty and harsh.",
    inTheWild: "Engineers reach for a presence boost when a vocal is buried but already loud enough, because the real fix is clarity in that upper-mid band rather than more level.",
  },
  "roomMix": {
    id: "roomMix",
    label: "room / reverb",
    oneLiner: "How much space the voice sits in.",
    whatItDoes: "Sends the voice into a modelled space and mixes the reflections back in. A little places the voice in a room; a lot pushes it further away and softens its edges.",
    inTheWild: "Reverb is really a depth control — a dry vocal sits right in front of the listener, and adding room is how a mix sets backing vocals and atmosphere behind the lead.",
  },
  "echoMs": {
    id: "echoMs",
    label: "echo time / delay",
    oneLiner: "Gap between repeats, in milliseconds.",
    whatItDoes: "Sets how long after the original sound the first repeat arrives. Below roughly 120 ms it thickens the voice rather than reading as an echo; longer settings become distinct, rhythmic repeats.",
    inTheWild: "Slapback — a single short repeat somewhere around 80–140 ms — is the rockabilly and early rock-and-roll vocal sound, while longer delays are usually set to the song's tempo so repeats land on the beat.",
  },
  "echoFeedback": {
    id: "echoFeedback",
    label: "echo repeats / feedback",
    oneLiner: "How many times each echo comes back.",
    whatItDoes: "Feeds the echo back into itself so every repeat spawns another. Low gives you one or two; high trails on for ages and eventually builds into a wash of sound.",
    inTheWild: "Dub production treats this as a played instrument, with the engineer riding the repeats up on a single shouted word so it rains back across the following bar.",
  },
  "echoMix": {
    id: "echoMix",
    label: "echo level / delay mix",
    oneLiner: "How loud the repeats sit under the voice.",
    whatItDoes: "Balances the echoes against the direct voice. Low keeps them as a hint of depth behind you; high lets the repeats compete with the line you're singing now.",
    inTheWild: "Delay is normally kept well below the dry vocal so it registers as space rather than clutter, then pushed up only on the last word of a phrase where nothing else is in the way.",
  },
  "noiseReduction": {
    id: "noiseReduction",
    label: "room removal / how much",
    oneLiner: "How much of the measured room to subtract.",
    whatItDoes:
      "Sets how aggressively the measured room fingerprint is taken out of the signal. Low settings thin the hiss while leaving the voice completely untouched; high settings strip more but can start to sound watery, because bins that were mostly noise get pulled down alongside the quiet parts of your voice.",
    inTheWild:
      "Engineers back this off until the noise is merely quiet rather than gone. Pushing subtraction too far produces a burbling artefact called musical noise, and a slightly hissy vocal reads as more natural than a clean one that warbles.",
  },
  "gateDb": {
    id: "gateDb",
    label: "noise gate / silence floor",
    oneLiner: "Anything quieter than this is muted.",
    whatItDoes: "Sets a loudness floor and shuts off anything below it completely. Raising it silences room noise between phrases, but set it too high and quiet word endings and breaths get chopped off.",
    inTheWild: "Gates are standard on live vocals and multi-mic sessions, where an open microphone would otherwise feed back or pick up the drum kit whenever the singer stops.",
  },
  "denoise": {
    id: "denoise",
    label: "smart denoise / adaptive gate",
    oneLiner: "Learns the room, then mutes what isn't voice.",
    whatItDoes: "Measures the steady background level of your room and only opens for sound that repeats regularly, the way a voice does. It needs a moment of listening before it settles, and it may stay shut on whispered or very breathy input.",
    inTheWild: "Broadcast and podcast chains work the same way — measure the room floor, then duck it — which is why a whispered aside sometimes disappears entirely on a noise-suppressed call.",
  },
  "noiseCancellation": {
    id: "noiseCancellation",
    label: "noise cancelling / browser filter",
    oneLiner: "The browser's own fan-and-hiss remover.",
    whatItDoes: "Hands your microphone to the browser's built-in suppressor, which strips constant sounds like fans, air conditioning and hiss before the app hears anything. It can also thin out sustained singing, because a held note looks steady too.",
    inTheWild: "Video-call software leans on this heavily, which is exactly why musicians switch it off before playing down a call — the suppressor hears a sustained tone as noise and starts removing it.",
  },
  "key": {
    id: "key",
    label: "key / scale",
    oneLiner: "Snap only to notes in one key, not all 12.",
    whatItDoes: "Limits the target notes to a chosen scale instead of every semitone. Correction becomes musical rather than literal, and in-between notes get pulled to the nearest note that belongs in the key.",
    inTheWild: "Setting the key is the first move in any tuning session, because it stops the processor from confidently locking a bluesy bend onto a note that isn't in the song.",
  },
};

/** Falls back to the id so a new control never renders a blank label. */
export function copyFor(id: string): ControlCopy {
  return (
    CONTROL_COPY[id] ?? { id, label: id, oneLiner: "", whatItDoes: "", inTheWild: "" }
  );
}
