import { config } from "dotenv";
config();

import { getDb } from "./index.js";
import { songAttributes } from "./schema/index.js";

const attributes = [
  { name: "genre", attribute_category: "genre", description: "Detailed genres from primary to least, ordered by greatest influence (e.g. \"Bubblegum Pop, Trap Metal\" or \"90s East Coast Boom-Bap, Street Rap\")" },
  { name: "era_influence", attribute_category: "genre", description: "Decade or period the sound draws from (e.g. \"late 80s synth-pop\", \"2010s SoundCloud rap\", \"70s Philly soul\")" },
  { name: "cultural_origin", attribute_category: "genre", description: "Regional or cultural roots and specific stylistic niche (e.g. \"Korean idol pop\", \"Lagos Afrobeat\", \"European Italo-Disco\", \"Caribbean Dancehall\")" },

  { name: "song_structure", attribute_category: "structure", description: "Exact section-by-section flow of the song (e.g. \"Intro -> Verse 1 -> Pre-Chorus -> Chorus -> Verse 2 -> Pre-Chorus -> Chorus -> Bridge -> Final Chorus -> Outro\")" },
  { name: "section_sizes", attribute_category: "structure", description: "Relative size, weight, and repetition of each section (e.g. \"short 4-bar verses, massive 16-bar choruses that repeat the hook 4x\", \"bridge is a single spoken line\", \"outro stretches 2 minutes\")" },
  { name: "duration", attribute_category: "structure", description: "Total song length (e.g. \"3:42\", \"7:12 extended mix\")" },
  { name: "intro_style", attribute_category: "structure", description: "How the song opens and sets the tone (e.g. \"ambient pad swell for 8 bars\", \"cold open straight into vocals\", \"acapella hook then beat drops\", \"30-second spoken monologue over vinyl crackle\")" },
  { name: "outro_style", attribute_category: "structure", description: "How the song closes (e.g. \"fade out over repeating chorus\", \"abrupt hard stop\", \"instrumental decay into silence\", \"reprise of intro melody\", \"crowd noise fade\")" },
  { name: "energy_arc", attribute_category: "structure", description: "How dynamic energy rises and falls across the full timeline (e.g. \"low simmering verse builds into explosive chorus, drops to near-silence at bridge, erupts into double-time final chorus\", \"steady escalation from start to finish with no release\")" },
  { name: "transitions", attribute_category: "structure", description: "Type and feel of connections between sections (e.g. \"riser sweeps into each chorus\", \"drum fill transitions\", \"silence gaps between verse and chorus\", \"reversed vocal crossfade\", \"beat drops out leaving only bass before chorus hits\")" },
  { name: "section_contrast", attribute_category: "structure", description: "How different sections feel from each other (e.g. \"rapped verses vs melodic sung chorus\", \"acoustic verse into full-band chorus\", \"whispered bridge against screamed chorus\", \"kids church choir chorus vs street-rap verses\")" },

  { name: "key", attribute_category: "composition", description: "Musical key, scale, and mode (e.g. \"C minor natural\", \"F# Dorian\", \"E major pentatonic\")" },
  { name: "tempo", attribute_category: "composition", description: "BPM, grid feel, and any fluctuation (e.g. \"92 BPM tight grid\", \"140 BPM half-time feel\", \"starts 70 BPM accelerates to 120 by final chorus\", \"loose human tempo drift\")" },
  { name: "time_signature", attribute_category: "composition", description: "Rhythmic meter (e.g. \"4/4\", \"3/4 waltz\", \"6/8 compound\", \"alternates 7/8 and 4/4\")" },
  { name: "chord_progression", attribute_category: "composition", description: "Specific chord sequences per section (e.g. \"verse: i-VI-III-VII, chorus: I-V-vi-IV\", \"single chord drone throughout\", \"jazz ii-V-I turnarounds with chromatic passing chords\")" },
  { name: "melody", attribute_category: "composition", description: "Core melodic hooks, contour, and motifs (e.g. \"descending minor pentatonic hook with call-and-response between vocal and synth\", \"one-note chant melody\", \"soaring octave-leap chorus hook\")" },

  { name: "rhythmic_feel", attribute_category: "rhythm", description: "How the beat physically sits and moves (e.g. \"straight and mechanical\", \"swung 16ths\", \"heavy syncopation\", \"lazy behind-the-beat drag\", \"tight and punchy\")" },
  { name: "drum_pattern", attribute_category: "rhythm", description: "Drum style, pattern, and character (e.g. \"trap hi-hats with rolling triplets\", \"four-on-the-floor house kick\", \"boom-bap breakbeat\", \"live jazz brushes\", \"no drums — percussion-free\")" },
  { name: "bass_groove", attribute_category: "rhythm", description: "Bass rhythm, character, and role (e.g. \"808 sub-bass slides\", \"fingerstyle Motown walking bass\", \"distorted synth bass pulsing on downbeats\", \"bass drops only on chorus\")" },
  { name: "percussion_elements", attribute_category: "rhythm", description: "Non-drum percussion adding texture (e.g. \"shaker and finger snaps on 2 and 4\", \"tabla and hand drums\", \"cowbell driving the groove\", \"none\")" },

  { name: "primary_instruments", attribute_category: "instrumentation", description: "Dominant instruments carrying the song (e.g. \"detuned honky-tonk piano, 808 kit\", \"clean electric guitar arpeggios, analog Moog bass\")" },
  { name: "secondary_instruments", attribute_category: "instrumentation", description: "Supporting or textural instruments (e.g. \"ambient string pads, marimba accents\", \"organ swells in chorus only\", \"orchestral brass stabs\")" },
  { name: "instrument_technique", attribute_category: "instrumentation", description: "Specific playing styles, unorthodox methods, and what makes them different (e.g. \"palm-muted guitar with heavy pick scrapes\", \"bowed electric bass\", \"prepared piano with objects on strings\", \"slap bass with thumb muting\")" },
  { name: "instrument_effects", attribute_category: "instrumentation", description: "Effects processing on instruments (e.g. \"heavy flanger on guitar\", \"bit-crushed synth leads\", \"reversed reverb piano swells\", \"tremolo on Rhodes\")" },
  { name: "arrangement_dynamics", attribute_category: "instrumentation", description: "When and how instrumental elements enter, exit, and layer across the timeline (e.g. \"drums drop out in verse 2, strings enter at bridge, full band at final chorus\", \"instruments added one by one each 8 bars\", \"everything cuts except vocals for 2 beats before chorus drops\")" },

  { name: "vocal_cast", attribute_category: "vocals", description: "Who sings what and where — maps out each distinct voice and their role across sections (e.g. \"solo male rapper on verses, female soul singer on hook/chorus\", \"single vocalist throughout\", \"male lead on verses, male-female duet on chorus, children's choir on bridge\", \"rapper A on verse 1, rapper B on verse 2, singer on all hooks\")" },
  { name: "vocal_timbre", attribute_category: "vocals", description: "Physical texture and tonal quality of each voice in the cast (e.g. \"rapper: warm and husky; hook singer: raspy soul tone with raw grit\", \"bright and nasal throughout\", \"deep resonant baritone\")" },
  { name: "vocal_range", attribute_category: "vocals", description: "Pitch range and register used (e.g. \"alto chest voice\", \"tenor with falsetto in chorus\", \"spans 3 octaves from low growl to whistle register\")" },
  { name: "vocal_style", attribute_category: "vocals", description: "Delivery technique (e.g. \"belting\", \"whisper-singing\", \"rapid-fire rap\", \"spoken-word\", \"yodeling between registers\", \"melodic sing-rap\")" },
  { name: "vocal_sync", attribute_category: "vocals", description: "How the voice rides and locks with the beat (e.g. \"tight rhythmic phrasing locked to grid\", \"lazy dragging behind the beat\", \"staccato machine-gun syllables\", \"free-flowing over bar lines\", \"syncopated pushes ahead of the beat\")" },
  { name: "vocal_emotion", attribute_category: "vocals", description: "Emotional intensity and character of delivery (e.g. \"vulnerable and pleading\", \"aggressive and confrontational\", \"detached and deadpan\", \"manic and unhinged\", \"joyful and carefree\")" },
  { name: "vocal_accent", attribute_category: "vocals", description: "Cultural, regional, or dialectal inflection (e.g. \"Southern US drawl\", \"heavy New York street inflection\", \"Caribbean Patois flavor\", \"London roadman cadence\", \"AAVE with Trinidadian accent\", \"neutral/no notable accent\")" },
  { name: "vocal_effects", attribute_category: "vocals", description: "Processing and effects on the voice (e.g. \"heavy autotune\", \"dry with no reverb\", \"vocoder harmonies\", \"telephone EQ filter on verse\", \"heavy slapback delay\")" },
  { name: "backing_vocals", attribute_category: "vocals", description: "Backing vocal style, placement, role, and where they appear (e.g. \"lush choir harmonies on chorus only\", \"call-and-response ad-libs throughout\", \"gang vocal shouts on hook\", \"layered self-harmonies stacked 6 deep\", \"kid's choir on bridge\", \"none\")" },

  { name: "language", attribute_category: "lyrics", description: "Language or languages sung in (e.g. \"English\", \"Korean with English chorus\", \"Spanish and English code-switching\")" },
  { name: "lyrical_subject", attribute_category: "lyrics", description: "Topic category of what the song is about (e.g. \"relationships\", \"street life and survival\", \"politics and world order\", \"money and materialism\", \"self-empowerment\", \"partying and nightlife\", \"spirituality and faith\", \"mental health\", \"nostalgia and memory\")" },
  { name: "lyrical_message", attribute_category: "lyrics", description: "The core message or intent — what the author is trying to tell the listener (e.g. \"cautionary tale about greed consuming everything\", \"celebrating overcoming struggle\", \"processing unresolved grief\", \"pure wordplay and flexing with no deeper message\", \"cry for help disguised as a party song\", \"warning to enemies\")" },
  { name: "lyrical_tone", attribute_category: "lyrics", description: "Emotional stance and attitude of the words themselves (e.g. \"vengeful payback\", \"carefree joy\", \"bitter resentment\", \"hopeful yearning\", \"feeling misunderstood\", \"cocky braggadocio\", \"grateful and reflective\", \"defeated and resigned\")" },
  { name: "narrative_style", attribute_category: "lyrics", description: "The type and mode of lyrical content (e.g. \"storytelling with beginning, middle, end\", \"emotional venting and confessional\", \"boasting and flexing\", \"repetitive wordplay and hooks\", \"spoken-word poetry\", \"abstract imagery with no literal narrative\", \"conversational as if talking to someone\", \"anthem — rallying cry meant to be chanted\")" },
  { name: "narrative_pov", attribute_category: "lyrics", description: "Point of view and how it shifts across the song (e.g. \"first-person throughout\", \"third-person storytelling\", \"second-person — speaking directly to 'you'\", \"first-person verses shift to third-person chorus\", \"alternating perspectives between verse 1 and verse 2\", \"omniscient narrator in verses, first-person confession in bridge\")" },
  { name: "rhyme_scheme", attribute_category: "lyrics", description: "Rhyming patterns per section with internal rhymes noted (e.g. \"AABB couplets in verse, ABAB in chorus\", \"dense multisyllabic internal rhymes\", \"free verse no rhyme\", \"chorus is a single repeated phrase\")" },
  { name: "poetic_devices", attribute_category: "lyrics", description: "Literary and rhetorical techniques used (e.g. \"heavy metaphor and simile\", \"alliteration in hooks\", \"anaphora — each verse starts with 'I remember'\", \"ironic contrast between upbeat sound and dark lyrics\", \"none — straightforward and literal\")" },
  { name: "lyrical_flow", attribute_category: "lyrics", description: "Cadence, meter, and rhythmic phrasing of words (e.g. \"rapid-fire 16th note syllables\", \"slow deliberate phrasing with long pauses\", \"sing-song nursery rhyme cadence\", \"conversational and loose\", \"triplet flow\")" },
  { name: "lyrical_density", attribute_category: "lyrics", description: "How packed or sparse the words are per section (e.g. \"wall-to-wall words no breathing room\", \"minimal 4 lines per verse\", \"chorus is one repeated word\", \"dense verses but wide-open sparse chorus\")" },

  { name: "production_style", attribute_category: "production", description: "Overall sonic approach and era (e.g. \"polished maximalist pop\", \"lo-fi bedroom with tape hiss\", \"raw live recording\", \"hyper-processed futuristic\", \"stripped acoustic\")" },
  { name: "mix_character", attribute_category: "production", description: "Sonic quality, vocal placement, and depth (e.g. \"vocal up front and dry, intimate feel\", \"vocals buried in reverb wall, stadium sound\", \"bass-heavy low-end dominant\", \"bright and crispy highs\")" },
  { name: "stereo_field", attribute_category: "production", description: "Panning and spatial layout (e.g. \"guitars hard-panned left and right, drums dead center\", \"wide immersive stereo\", \"narrow mono-focused\", \"elements ping-pong between channels\")" },
  { name: "sound_design", attribute_category: "production", description: "Non-musical sounds, foley, and sonic textures (e.g. \"vinyl crackle throughout\", \"rain and thunder in intro\", \"glitch artifacts and digital noise\", \"field recording of city traffic under verse\", \"none\")" },
  { name: "sampling", attribute_category: "production", description: "Notable samples and their treatment (e.g. \"chops a 70s soul vocal into the hook\", \"pitch-shifted classical piano sample\", \"breakbeat from classic funk record\", \"none\")" },

  { name: "overall_mood", attribute_category: "mood", description: "Overarching emotional atmosphere in precise terms (e.g. \"euphoric\", \"creeping dread\", \"simmering tension\", \"bittersweet nostalgia\", \"manic and frantic\", \"anthemic and triumphant\")" },
  { name: "danceability", attribute_category: "mood", description: "Type and intensity of movement it drives (e.g. \"club-ready four-on-the-floor pulse\", \"head-nod groove\", \"mosh pit energy\", \"slow sway\", \"sit and listen — not danceable\")" },

  { name: "pace", attribute_category: "energy", description: "Perceived speed and momentum of the track regardless of BPM (e.g. \"breakneck and relentless\", \"slow heavy crawl\", \"gradually accelerating\", \"stop-start lurching\", \"half-time crawl despite high BPM\")" },
  { name: "intensity", attribute_category: "energy", description: "How hard the track hits and how much force it carries (e.g. \"explosive and overwhelming\", \"gentle and delicate\", \"simmering just below boiling\", \"crushing and suffocating\", \"featherlight\")" },
  { name: "tension", attribute_category: "energy", description: "Suspense, anxiety, and release quality (e.g. \"anxious and taut\", \"relaxed and loose\", \"building with no release\", \"constant tension-release cycle\", \"unresolved and unsettling\")" },
  { name: "energy_texture", attribute_category: "energy", description: "Physical quality and shape of the energy (e.g. \"bouncy and springy\", \"heavy and grinding\", \"floaty and weightless\", \"jagged and angular\", \"smooth and flowing\", \"sticky and syrupy\")" },
  { name: "atmosphere", attribute_category: "energy", description: "Immersive or altered-state quality of the sonic space (e.g. \"surreal and dreamlike\", \"hypnotic and trance-inducing\", \"psychedelic and disorienting\", \"claustrophobic and suffocating\", \"vast and cinematic\", \"underwater and submerged\")" },

  { name: "signature_quirks", attribute_category: "signature", description: "One-of-a-kind imperfections, oddities, and distinguishing details that make this song unlike any other (e.g. \"snare slightly off-grid giving a human lurch\", \"cough left in at 2:14\", \"guitar intentionally detuned\", \"vocalist laughs mid-line in verse 2\", \"record scratch used as melodic instrument\")" },
  { name: "signature_moments", attribute_category: "signature", description: "The defining, most memorable musical events or passages that everyone remembers (e.g. \"3-minute vocoder solo as outro\", \"beat completely switches genre at bridge\", \"acapella breakdown at 2:30\", \"orchestra swells as drums cut for 4 bars before final chorus\", \"guitar solo over key change\", \"entire crowd chant section\")" },
];

async function seedAttributes() {
  const db = getDb();

  console.log(`Inserting ${attributes.length} song attributes...`);

  let inserted = 0;
  let skipped = 0;

  for (const attr of attributes) {
    try {
      await db.insert(songAttributes).values({
        name: attr.name,
        context: "anatomy",
        attribute_category: attr.attribute_category,
        description: attr.description,
      }).onConflictDoNothing();
      inserted++;
    } catch (err: any) {
      if (err.message?.includes("UNIQUE constraint")) {
        skipped++;
      } else {
        throw err;
      }
    }
  }

  console.log(`Done! Inserted: ${inserted}, Skipped (already exist): ${skipped}`);
  process.exit(0);
}

seedAttributes().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
