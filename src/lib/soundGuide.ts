/**
 * Long-form explanations for /guide: what each control does to the signal and
 * how the technique is used on records.
 *
 * Data, not markup, so the page component stays presentation-only and the
 * same wording can be reused anywhere else that needs it.
 */

export interface GuideEntry {
  term: string;
  /** One sentence a non-musician understands. */
  plain: string;
  /** What is physically happening to the signal. */
  deeper: string;
  /** A concrete experiment in this app, and what you will hear. */
  tryThis: string;
}

export interface GuideSection {
  id: string;
  title: string;
  blurb: string;
  entries: GuideEntry[];
}

export interface SoundGuide {
  intro: string;
  sections: GuideSection[];
}

export const SOUND_GUIDE: SoundGuide = {
  intro: "Everything in here is one signal path: your microphone, a pitch tracker, a distortion stage, two filters, a room and a delay, and a limiter on the way out. The voices are characters built out of those controls — an era's mic, band, grit and tuning behaviour applied to whatever you actually sing — not recreations of anybody's voice. This page explains what each control is physically doing, why records have used these tricks for seventy years, and what to move to hear it for yourself.",
  sections: [
    {
      id: "pitch",
      title: "Pitch and autotune",
      blurb: "The tuner is the engine everything else hangs off. It listens for the pitch of your voice a few hundred times a second, decides which note you meant, and moves you there — and every argument about autotune is really an argument about how fast that move happens.",
      entries: [
        {
          term: "glide / retune speed",
          plain: "How fast your voice gets dragged onto the nearest correct note — instantly, or with a human slide.",
          deeper: "The app measures your pitch, picks the nearest allowed note, and travels there over the time you set. At 0 ms the pitch teleports the instant it changes its mind, so a sung line becomes a staircase of flat steps with nothing in between. Longer glides let your own scoops, bends and vibrato survive, because the correction never catches up before you have already moved.",
          tryThis: "On Julian II, hold one long \"ahh\" and slide your voice upward, then pull glide from its resolved ~85 ms down to 0 and do it again. At 85 ms you hear yourself sliding; at 0 the slide is chopped into discrete notes. That artefact was an accident of the first pitch-correction software in 1997 and a deliberate lead-vocal sound within about a year — the 1998 hit that made everyone notice it, then rap hooks, then pop choruses, then hyperpop.",
        },
        {
          term: "key / scale",
          plain: "Tell it what key the song is in and it will only tune you to notes that belong there.",
          deeper: "Chromatic leaves all twelve notes switched on, so the tuner picks whatever is nearest — including the note between the two you meant. Choosing a key switches five of the twelve off, so every correction has to land somewhere musical, and the wrong-note lurch on a held vowel disappears. This is the first move in any real tuning session, before anyone touches a slider.",
          tryThis: "Set Chromatic, pick an Autotune voice, and slide slowly from your lowest comfortable note to your highest — you will hear all twelve semitones on the way up. Now choose A minor and repeat: the same slide lands on seven steps per octave instead of twelve, and it stops sounding like a chromatic run and starts sounding like a melody.",
        },
        {
          term: "pitch shift / semitones",
          plain: "Moves the tuned note up or down in whole steps, up to an octave either way.",
          deeper: "Once the tuner has decided your note, this adds or subtracts semitones before the shifter resamples your voice to reach it — twelve steps is a full octave. The shifter stretches the whole sound, so the resonances of your throat and mouth move with the pitch instead of staying put. That is why shifting up sounds thin and small rather than simply higher, and shifting down sounds heavy and oversized.",
          tryThis: "Julian IV sits at +5, and that formant thinning is most of why it reads as falsetto rather than as you an octave up. Pull the shift to 0 and the character collapses back into your ordinary voice. Then set -12 and speak: that is the film monster-voice trick, and also the octave-down double producers stack under a chorus to make it feel wider.",
        },
        {
          term: "blend / dry vs shifted",
          plain: "How much of the tuned voice you hear against your own untouched one.",
          deeper: "Your raw voice and the shifted copy are simply added together, so at halfway you hear both at once. With a shift applied, that reads as two singers — a harmony line, not a replaced vocal. With no shift, the two copies differ slightly in timing, which is heard as thickness rather than as an effect.",
          tryThis: "Set pitch shift to -12 and blend to 0.5, then sing a simple line: you and an octave below, at once. Push blend to 1.0 and the top voice vanishes, leaving only the low one — the same reason engineers keep a little untreated voice in the blend when they want a harmony to thicken a lead without smearing the words.",
        },
      ],
    },
    {
      id: "dirt",
      title: "Saturation, crush and wobble",
      blurb: "Grit is not a garnish on these records — it is often the whole vocal sound. There are three unrelated kinds of it in here (analogue-style clipping, digital coarseness, and unstable pitch), and learning to hear them apart is most of the skill.",
      entries: [
        {
          term: "drive / distortion",
          plain: "Pushes the voice into distortion — first warmth, then grit, then a full shout.",
          deeper: "The signal is pushed through a curve that rounds off the loudest peaks instead of letting them through, and flattening a wave adds harmonics that were never in your voice. Because the peaks come down while the body stays where it is, the vocal also gets denser and reads as louder without the meter moving much. Past about 10 the added harmonics dominate and consonants start to spit.",
          tryThis: "Julian I sits at drive 13 with the low cut at 520 Hz. Drop drive to 1 and it becomes a thin, clean phone voice; walk it back up and at 4–6 you just sound urgent, while by 13 it is the small-amp shout. That is how this was got in practice long before plugins: a vocal mic into a distortion pedal, a broken preamp, or a little guitar amp in the corner.",
        },
        {
          term: "bit depth / resolution",
          plain: "Coarsens how finely each instant of the waveform is measured; fewer bits means a gritty digital fuzz.",
          deeper: "Every sample's loudness gets rounded to one of a fixed number of steps — 16 bits gives tens of thousands of them, 6 bits gives 64. The rounding error is a buzzing fuzz that sits at a roughly constant level no matter how loud you are. So it hides under a belted note and swamps a quiet one, which is why crushed vocals sound almost clean when you push and filthy when you trail off.",
          tryThis: "Pick Julian III (6 bit), sing a loud note and let it fade to nothing — you can hear the fuzz walk out from under the note as you get quieter. Set bit depth to 16 and the same fade stays clean. Twelve-bit samplers and handheld game chips got this for free; chiptune, lo-fi hip-hop and industrial vocals then went looking for it on purpose.",
        },
        {
          term: "sample rate crush / downsampling",
          plain: "Throws samples away so the audio effectively runs at a lower rate, adding a dull metallic ring.",
          deeper: "At 4× only every fourth sample is used and each one is held until the next arrives, so the waveform becomes a staircase rather than a curve. Frequencies too high to be described at that reduced rate do not simply disappear — they fold back down into the audible range as new tones that have no musical relationship to what you sang. Those folded tones do not move with your note the way genuine harmonics do, and that is exactly what makes the effect read as machine rather than as distortion.",
          tryThis: "Set sample rate crush to 1× and sing a slow rising line, then set 8× and sing the same line. On the second pass a clanging layer sits on top that moves in the wrong direction as you climb. That inharmonic ring is the vintage-sampler character producers still chase by bouncing audio through old hardware.",
        },
        {
          term: "warble speed / vibrato rate",
          plain: "Adds a repeating wobble to the pitch; this sets how many wobbles per second.",
          deeper: "A slow oscillator continuously nudges the tuner's target sharp and flat, so the corrected note is never quite still. Between roughly 4.5 and 7 wobbles a second you are in the range a trained singer's vibrato occupies, and the ear files it as expression rather than as an effect. Below about 2 it stops sounding like a singer and starts sounding like a tape or a record running at an unsteady speed.",
          tryThis: "Julian II ships at 2.6 Hz with a 22-cent swing — deliberately just under vibrato speed, which is where its hazy bedroom-demo feel comes from. Push it to 6 Hz and the same voice suddenly has a singer's vibrato; drop it to 0.6 Hz and it is a warped cassette. Engineers spent decades trying to eliminate this instability from tape, and now add the slow sway and the fast tremble back in deliberately.",
        },
        {
          term: "warble depth / pitch swing",
          plain: "How far the wobble bends away from the note — 100 cents is a full semitone.",
          deeper: "This sets the distance each wobble travels, measured in cents (a cent is a hundredth of a semitone). Ten to twenty cents is inside the range a real singer moves through, so it just sounds human. Past about 50 the ear starts hearing the pitch actually travelling between notes rather than decorating one, and the voice reads as broken rather than expressive.",
          tryThis: "Julian III runs 7 Hz at 70 cents. Pull the depth to 15 cents and it becomes a slightly nervous singer; put it back to 70 and it is seasick. That wide, drifting version is the damaged-tape sound vaporwave and lo-fi built an entire aesthetic out of.",
        },
      ],
    },
    {
      id: "tone",
      title: "EQ and band-limiting",
      blurb: "Two filters and one boost do more for character here than anything else on the page. Removing frequencies is not damage — narrowing a vocal down to a small slice of the spectrum is one of the oldest arrangement tools there is.",
      entries: [
        {
          term: "low cut / high-pass",
          plain: "Deletes everything below the frequency you set.",
          deeper: "The filter lets the highs through and rolls off increasingly steeply below the number you choose, about 12 dB per octave. Set at 80–100 Hz it removes only rumble, desk thumps and the boom on a popped \"p\" — there is nothing musical in a voice down there. Push it into the hundreds and you start removing chest and body, and that removal is the actual sound of a small speaker.",
          tryThis: "Julian I has its low cut at 520 Hz. Drag it down to 80 and the same distortion suddenly sounds like a full-range vocal with a fuzz pedal on it; put it back to 520 and it is a megaphone again. Nothing else moved. Almost every vocal ever released has a low cut on it around 80–100 Hz; the megaphone is just that same control taken somewhere unreasonable.",
        },
        {
          term: "high cut / low-pass",
          plain: "Deletes everything above the frequency you set, pulling the top off the voice.",
          deeper: "It is the mirror image: above the corner frequency, everything is progressively removed. Air and sibilance go first, then detail, and by about 3 kHz the consonants blur and the voice sounds like it is coming through a wall. Squeeze it against a raised low cut and you are left with a narrow band — a telephone line is roughly 300 Hz to 3.4 kHz, so those two numbers literally build a phone call.",
          tryThis: "Set low cut 300, high cut 3400, drive 1 and room 0, and speak: that is a phone. Now push the high cut to 11000 and everything opens up. That contrast is the point — the lo-fi verse exists so the full-range chorus feels like a door opening, and doing it to your own voice for four bars is worth more than any amount of theory about it.",
        },
        {
          term: "presence / vocal bite",
          plain: "A boost around 1.8 kHz, where consonants live, that makes words cut through without making them louder.",
          deeper: "This lifts a band centred at 1.8 kHz — the attack of t, k and s, and the hard edge of a shouted vowel. Small speakers are most efficient in that region, so a lift there is what keeps a vocal audible on a phone, in a car, or under a loud guitar. Push it far and it turns shouty and tiring within about thirty seconds of listening.",
          tryThis: "Julian I carries +13 dB here. Set it to 0 and the words retreat behind the distortion even though nothing got quieter; put it back and they walk to the front. Then try +18 and listen to how hard the s and t sounds get. When a vocal is buried but already loud enough, this band is the fix — more level would only make the whole mix worse.",
        },
      ],
    },
    {
      id: "space",
      title: "Space: room and echo",
      blurb: "Reverb and delay are both just delayed copies of you, and the only difference is how many and how far apart. Together they are how a record decides whether the singer is in your face or across a hall.",
      entries: [
        {
          term: "room / reverb",
          plain: "Puts the voice in a space; more of it pushes you further away from the listener.",
          deeper: "A copy of your voice is smeared through a recording of how a room answers a single sharp click, which produces the thousands of overlapping reflections that room would make. Reflections arriving just after the direct sound are the only cue your ears get for distance, so this control is really a depth fader, not a prettiness fader. The space used here is deliberately dark — a bright reverb on a distorted vocal just turns into hiss.",
          tryThis: "Posty Auto sits at 0.32. Take it to 0 and the vocal is pressed flat against your face; go to 0.62 (Julian IV's setting) and you step back into a big space; go to 1.0 and you are at the back of it. Lead vocals on records are usually drier than people expect — most of the room you think you hear is on the backing vocals sitting behind the lead.",
        },
        {
          term: "echo time / delay",
          plain: "Sets the gap before the first repeat: short thickens the voice, long is an echo you can count.",
          deeper: "A delay line stores your voice and plays it back later. Under roughly 50 ms the ear fuses the copy with the original and hears one thicker sound rather than two events. Between about 80 and 140 ms it separates into a distinct repeat that is still tight against the word, and past 200 ms it becomes an echo with its own rhythm.",
          tryThis: "Set echo level 0.35 and feedback 0, then sweep the time. At around 110 ms you land on slapback — one short repeat, no tail — which is the Memphis rockabilly vocal sound, originally made by running tape between two machines and using the gap between the record and playback heads. At 360 ms (Julian IV) it is a modern spacious trail instead. Note that echo time is the one parameter the match macro leaves alone, because sweeping a delay line bends the pitch of whatever is already inside it.",
        },
        {
          term: "echo repeats / feedback",
          plain: "How many times each echo comes back before it dies away.",
          deeper: "The delay's output is fed back into its own input at the level you set, so every repeat spawns a quieter one. Around 0.3 you get two or three audible repeats; at 0.7 it rings on for seconds and starts building into a wash. Each pass also goes through a filter, so the repeats get darker and murkier as they decay rather than staying crisp — that progressive collapse is most of what makes it sound like a real space.",
          tryThis: "Set echo time 300, echo level 0.5, then shout one word and push feedback from 0 up to 0.7 while it is still ringing. In dub, this control is played rather than set — the engineer rides the repeats up on a single word so it rains back across the next bar, then pulls them down before the vocal returns.",
        },
        {
          term: "echo level / delay mix",
          plain: "How loud the repeats sit underneath you.",
          deeper: "This is the return level for the repeats against your direct voice. Because the echoes occupy exactly the same frequencies as the words causing them, anything much above a third of the dry level starts competing with the line you are singing now. Kept low, the same delay registers as depth and nobody consciously hears an effect at all.",
          tryThis: "Set echo time 250, feedback 0.4 and echo level to its maximum 0.6, then speak a fast sentence — you will lose the words. Pull it back to about 0.18 and the sentence is clear while the space stays. The standard move is to leave it there and only push it up on the last word of a phrase, where nothing else is in the way.",
        },
      ],
    },
    {
      id: "noise",
      title: "Noise control",
      blurb: "Three different things in this app can silence your microphone, and they fail in three different ways. Knowing which one just ate the end of your word is the difference between a usable take and ten minutes of confusion.",
      entries: [
        {
          term: "noise gate / silence floor",
          plain: "Anything quieter than this threshold is muted outright.",
          deeper: "The app follows the moment-to-moment level of your input and compares it to your threshold, opening in about 4 ms and closing over about 120 ms so it does not chop the tail off a word. It closes at a lower level than it opens at, which stops it chattering on and off during a breath. Your raw voice still reaches the pitch tracker either way — only the output is muted, so the tuner never loses its place.",
          tryThis: "The default is -50 dB. Stop talking and listen to your room vanish. Push it to -25 and word endings and breaths start getting clipped off; drop to -75 and your fridge is back in the mix. Gates matter most on a live stage, where an open vocal mic hears the drum kit and the monitors and will happily feed back the moment the singer stops.",
        },
        {
          term: "smart denoise / adaptive gate",
          plain: "Learns your room's background level, then only opens for sound that behaves like a voice.",
          deeper: "While the gate is shut, whatever is arriving must be the room, so the app tracks that floor — creeping up slowly over about two seconds and dropping fast — and sets its own bar above it, which means a noisy room raises its own threshold without you touching anything. It also asks the pitch tracker how regular the incoming sound is: a voice repeats itself many times a second, a fan does not. Both tests must pass to open, but only the level test has to keep passing to stay open, because unvoiced consonants like s and t have almost no regularity and would otherwise get their fronts bitten off.",
          tryThis: "The default is 0.7. With a fan or air conditioning running, set it to 0 and listen to the room arrive between your words, then take it back up. Then set it to 1.0 and whisper — a whisper has no periodic pitch to detect, so the gate stays shut. That is exactly why a whispered aside sometimes disappears completely on a video call.",
        },
        {
          term: "noise cancelling / browser filter",
          plain: "Hands your microphone to the browser's own noise remover before this app hears anything at all.",
          deeper: "This one is not part of the effect chain — it is a request to the browser, applied upstream, so it changes the signal that arrives and everything here is analysing an already-processed voice. It is tuned for speech on calls, so it removes steady broadband noise well. A long sustained sung note also looks steady, which is why it can start pulling your voice down in the middle of one. Automatic gain is deliberately never switched on here, because level pumping destabilises both the learned noise floor and the tuning.",
          tryThis: "Switch it on and hold one steady note for five seconds — listen for the note thinning or dipping partway through as the suppressor decides it is noise. Leave it off for singing and on for speaking in a loud room. This is the same reason musicians turn call software's noise suppression off before playing down a call.",
        },
        {
          term: "monitoring: headphones or speakers",
          plain: "Which one you choose changes the sound, because the speaker option turns on echo cancellation.",
          deeper: "In speaker mode the browser's echo canceller is enabled so that processed audio coming back into the microphone cannot build into feedback. It works by continuously subtracting a model of what was just played — and what was just played is your processed voice, so the canceller can duck or warble the effect while you are using it. Headphone mode switches all browser processing off and gives you the chain exactly as designed.",
          tryThis: "Set up a voice you like on headphones, then switch to speaker mode and sing the same line. Listen for the effect ducking or fluttering on sustained notes: that is the canceller doing its job on the wrong signal. Nothing is broken — it is the price of not wearing headphones, and it is why every serious overdub is tracked on cans.",
        },
      ],
    },
    {
      id: "macros",
      title: "The three macro controls",
      blurb: "These are the only controls most people should ever touch. Each one moves many parameters at once, and they are deliberately independent axes rather than three versions of the same knob.",
      entries: [
        {
          term: "match / how much modelled voice",
          plain: "1% is you barely touched, 100% is the full modelled character.",
          deeper: "This interpolates every parameter from a neutral starting point — your own voice, essentially untreated — toward the chosen voice's values, so glide, blend, drive, bit depth, both filters, presence, room and echo level all move together. It is a genuine crossfade of settings, not a preset with the volume turned down, which is why 20% really does sound like 20%. Echo time is the single exception and stays fixed, so a low blend gives you the same echo more quietly rather than a differently tuned one.",
          tryThis: "Speak the same sentence on Julian II at each chip: 1%, 50%, 70%, 100%. Somewhere around 50–70% it stops sounding like an effect and starts sounding like a decision, which is where most records live — the treated vocal blended under the natural one so the character reads as attitude. Note that picking an Autotune voice jumps this to 100% on purpose: at 70% the glide resolves to about 75 ms, which is not autotune at all.",
        },
        {
          term: "robot / machine hardness",
          plain: "A second, independent axis that kills the glide and pushes the crunch up at the same time.",
          deeper: "It scales the glide toward zero so notes jump instead of sliding, forces the blend to at least its own value so you cannot hear your untuned self underneath, multiplies the drive by up to 1.8, and pulls the bit depth toward 5 and the sample rate crush toward 6×. So it is doing two things the ear hears as one: making the pitch mechanical, and making the texture digital.",
          tryThis: "Choose Alex I, the least processed voice here, and sing a line with robot at 0, then at 1.0. The tune and the texture arrive together — that combination is what people mean by \"robot voice\", even though the older robot voices (talk boxes and vocoders, from the 1970s onward) worked on a completely different principle and had nothing to do with pitch correction.",
        },
        {
          term: "volume",
          plain: "Output level — but past 100% you are pushing a limiter, not actually getting louder.",
          deeper: "This sets the master gain, after which everything passes through a limiter and then a final soft clip that stops anything exceeding full scale. Below 100% it behaves like an ordinary fader. Above it, the loud parts hit the ceiling and get held there while the quiet parts keep rising, so the sound gets denser and more constant rather than bigger.",
          tryThis: "The default is 110%. Set it to 250%, then speak one quiet sentence and one loud one — the gap between them shrinks noticeably. That squashing is a deliberate trade mix engineers make all the time: give up dynamic range and the vocal stays glued to the front of the track instead of ducking behind it whenever the band gets loud.",
        },
      ],
    },
  ],
};
