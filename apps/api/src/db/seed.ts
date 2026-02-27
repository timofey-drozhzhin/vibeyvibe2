import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../../.env") });

import { getDb } from "./index.js";
import {
  songs, artists, albums, artistSongs, albumSongs,
  songProfiles, vibes,
  binSources, binSongs,
  sunoPromptCollections, sunoPrompts, sunoCollectionPrompts,
  sunoSongPlaylists, sunoSongs,
} from "./schema/index.js";
import { user, account } from "./schema/auth.js";
import { eq, and } from "drizzle-orm";

// ─── Vibes ────────────────────────────────────────────────────────────────
const vibesSeedData = [
  // GENRE
  { name: "Genre", vibe_category: "genre", description: "Detailed genres from primary to least, ordered by greatest influence", instructions: "Start with a general genre, but then list genre specifics that makes this song different within it's own genre", examples: "Bubblegum Pop, Trap Metal, East Coast Boom-Bap, Street Rap" },
  { name: "Era Influence", vibe_category: "genre", description: "Decade or period the sound draws from", instructions: "What era of music is this being influenced by? Start with the year, but list the specific style from that time period that influenced", examples: "late 80s synth-pop, 2010s SoundCloud rap, 70s Philly soul" },
  { name: "Cultural Origin", vibe_category: "genre", description: "Regional or cultural roots and specific stylistic niche", instructions: "What culture and the style within the culture is this song being influenced by?", examples: "Korean idol pop, Lagos Afrobeat, European Italo-Disco, Caribbean Dancehall, Polska Polka" },

  // STRUCTURE
  { name: "Song Structure", vibe_category: "structure", description: "Exact section-by-section flow of the song", instructions: "Identify the song structure. Is there an intro? Are there verses? Is there a chorus? List the entire structural flow.", examples: "Intro -> Verse 1 -> Pre-Chorus -> Chorus -> Verse 2 -> Pre-Chorus -> Chorus -> Bridge -> Final Chorus -> Outro" },
  { name: "Verse Style", vibe_category: "structure", description: "Verse characteristics", instructions: "Examine the verses (if any). Identify the size of the verse, vocals (gender, vocal arrangement, ensemble size), weight (emotional intensity, energy, etc), repetition (does it repeat words, phrases or the entire thing, and how often)", examples: "long, structured as 2 parallel 4-line halves. Female, solo arrangement. Lighthearted, quirky and upbeat romantic energy." },
  { name: "Chorus Style", vibe_category: "structure", description: "Chorus characteristics", instructions: "Examine the chorus (if any). Identify the size of the chorus, vocals (gender, vocal arrangement, ensemble size), weight (emotional intensity, energy, etc), repetition (does it repeat words, phrases or the entire thing, and how often)", examples: "short 4-bar. Upbeat, high energy and catchy. Male, solo arrangement. Repeats the beginning phrase twice." },
  { name: "Intro Style", vibe_category: "structure", description: "Intro unique characteristics", instructions: "Examine the intro of the song, even if it doesn't have intro lyrics. Note the duration, instrumentation used. Does the music ease-in, or does it begin right away.", examples: "15-second slow fade-in. Ambient synth pads. 8-bar cold open of heavy guitar. 10-second acapella before sudden bass drop. Immediately starts with the verse." },
  { name: "Outro Style", vibe_category: "structure", description: "How the song closes", instructions: "Examine the ending of the song. Determine if it ends on a definitive note, fades out, breaks down into specific elements. Note vocals, musical instrument, energy.", examples: "Abrupt heavy guitar stop. Low-energy solo piano decay. Crowd noise fade. High energy repeating chorus." },
  { name: "Duration", vibe_category: "structure", description: "Total song length", instructions: "Identify the total running time of the audio provided. Note if it is a specific mix format based on length.", examples: "3:42, 7:12 extended mix" },
  { name: "Energy Arc", vibe_category: "structure", description: "How dynamic energy rises and falls across the full timeline", instructions: "Map the intensity from start to finish. Identify the build, peak, drop, and resolution.", examples: "low simmering verse builds into explosive chorus, drops to near-silence at bridge, erupts into double-time final chorus, steady escalation from start to finish with no release" },
  { name: "Transitions", vibe_category: "structure", description: "Type and feel of connections between sections", instructions: "Identify how the song moves between major sections. Note the techniques, fills, or effects used to bridge gaps.", examples: "riser sweeps into each chorus, drum fill transitions, silence gaps between verse and chorus, reversed vocal crossfade, beat drops out leaving only bass before chorus hits" },
  { name: "Section Contrast", vibe_category: "structure", description: "How different sections feel from each other", instructions: "Compare distinct song parts. Highlight primary differences in instrumentation, vocal delivery, or energy.", examples: "rapped verses vs melodic sung chorus, acoustic verse into full-band chorus, whispered bridge against screamed chorus, kids church choir chorus vs street-rap verses" },

  // COMPOSITION
  { name: "Key", vibe_category: "composition", description: "Musical key, scale, and mode", instructions: "Identify the primary tonal center of the song, including the root note and the specific scale or mode used.", examples: "C minor natural, F# Dorian, E major pentatonic" },
  { name: "Tempo", vibe_category: "composition", description: "BPM, grid feel, and any fluctuation", instructions: "Determine the approximate beats per minute (BPM). Note if the tempo stays strict, fluctuates, or changes entirely during the song.", examples: "92 BPM tight grid, 140 BPM half-time feel, starts 70 BPM accelerates to 120 by final chorus, loose human tempo drift" },
  { name: "Time Signature", vibe_category: "composition", description: "Rhythmic meter", instructions: "Identify the number of beats per measure and the note value that gets the beat. Note any odd meters or shifts in time signature.", examples: "4/4, 3/4 waltz, 6/8 compound, alternates 7/8 and 4/4" },
  { name: "Chord Progression", vibe_category: "composition", description: "Specific chord sequences per section", instructions: "Analyze the underlying harmonic movement. Detail the chord patterns used in distinct sections using Roman numeral analysis or general descriptions.", examples: "verse: i-VI-III-VII, chorus: I-V-vi-IV; single chord drone throughout; jazz ii-V-I turnarounds with chromatic passing chords" },
  { name: "Melody", vibe_category: "composition", description: "Core melodic hooks, contour, and motifs", instructions: "Describe the primary musical phrases sung or played. Focus on the shape of the melody, its catchiness, and how instruments interact with it.", examples: "descending minor pentatonic hook with call-and-response between vocal and synth, one-note chant melody, soaring octave-leap chorus hook" },

  // RHYTHM
  { name: "Rhythmic Feel", vibe_category: "rhythm", description: "How the beat physically sits and moves", instructions: 'Describe the "pocket" or groove of the track. Is it rigid and quantized, or loose and swung?', examples: "straight and mechanical, swung 16ths, heavy syncopation, lazy behind-the-beat drag, tight and punchy" },
  { name: "Drum Pattern", vibe_category: "rhythm", description: "Drum style, pattern, and character", instructions: "Identify the primary drum loop or beat. Note the specific kit type and the rhythmic pattern played by the kick, snare, and hi-hats.", examples: "trap hi-hats with rolling triplets, four-on-the-floor house kick, boom-bap breakbeat, live jazz brushes, no drums — percussion-free" },
  { name: "Bass Groove", vibe_category: "rhythm", description: "Bass rhythm, character, and role", instructions: "Analyze the low-end foundation. Describe the tone of the bass instrument and how it interacts rhythmically with the drums.", examples: "808 sub-bass slides, fingerstyle Motown walking bass, distorted synth bass pulsing on downbeats, bass drops only on chorus" },
  { name: "Percussion Elements", vibe_category: "rhythm", description: "Non-drum percussion adding texture", instructions: "Listen for auxiliary rhythmic instruments outside the main drum kit. Detail what they are and where they hit in the measure.", examples: "shaker and finger snaps on 2 and 4, tabla and hand drums, cowbell driving the groove, none" },

  // INSTRUMENTATION
  { name: "Primary Instruments", vibe_category: "instrumentation", description: "Dominant instruments carrying the song", instructions: "Identify the main instruments that drive the melodic and harmonic foundation of the track.", examples: "detuned honky-tonk piano, 808 kit; clean electric guitar arpeggios, analog Moog bass" },
  { name: "Secondary Instruments", vibe_category: "instrumentation", description: "Supporting or textural instruments", instructions: "Identify background instruments that add depth, color, or texture but do not lead the song.", examples: "ambient string pads, marimba accents; organ swells in chorus only; orchestral brass stabs" },
  { name: "Instrument Technique", vibe_category: "instrumentation", description: "Specific playing styles, unorthodox methods, and what makes them different", instructions: "Listen for unique ways the instruments are physically played. Describe any distinct articulations or unconventional techniques.", examples: "palm-muted guitar with heavy pick scrapes, bowed electric bass, prepared piano with objects on strings, slap bass with thumb muting" },
  { name: "Instrument Effects", vibe_category: "instrumentation", description: "Effects processing on instruments", instructions: "Detail any obvious audio effects applied to the instruments to change their natural tone.", examples: "heavy flanger on guitar, bit-crushed synth leads, reversed reverb piano swells, tremolo on Rhodes" },
  { name: "Arrangement Dynamics", vibe_category: "instrumentation", description: "When and how instrumental elements enter, exit, and layer across the timeline", instructions: "Map how the instrumentation builds or strips away over time. Note specific sections where elements drop out or stack together.", examples: "drums drop out in verse 2, strings enter at bridge, full band at final chorus; instruments added one by one each 8 bars; everything cuts except vocals for 2 beats before chorus drops" },

  // VOCALS
  { name: "Vocal Cast", vibe_category: "vocals", description: "Who sings what and where — maps out each distinct voice and their role across sections", instructions: "Identify all distinct vocalists on the track. Note their gender/tone and assign which sections of the song they perform.", examples: "solo male rapper on verses, female soul singer on hook/chorus; single vocalist throughout; male lead on verses, male-female duet on chorus, children's choir on bridge; rapper A on verse 1, rapper B on verse 2, singer on all hooks" },
  { name: "Vocal Timbre", vibe_category: "vocals", description: "Physical texture and tonal quality of each voice in the cast", instructions: "Describe the unique sonic character of the singer's voice. Use physical and textural adjectives.", examples: "rapper: warm and husky; hook singer: raspy soul tone with raw grit; bright and nasal throughout; deep resonant baritone" },
  { name: "Vocal Range", vibe_category: "vocals", description: "Pitch range and register used", instructions: "Identify how high or low the vocalist is singing, and note what vocal register (chest, head, falsetto) they are utilizing.", examples: "alto chest voice, tenor with falsetto in chorus, spans 3 octaves from low growl to whistle register" },
  { name: "Vocal Style", vibe_category: "vocals", description: "Delivery technique", instructions: "Describe how the vocalist is delivering the performance. Is it sung, rapped, spoken, or something else?", examples: "belting, whisper-singing, rapid-fire rap, spoken-word, yodeling between registers, melodic sing-rap" },
  { name: "Vocal Sync", vibe_category: "vocals", description: "How the voice rides and locks with the beat", instructions: "Analyze the rhythmic timing of the vocals relative to the instrumental track.", examples: "tight rhythmic phrasing locked to grid, lazy dragging behind the beat, staccato machine-gun syllables, free-flowing over bar lines, syncopated pushes ahead of the beat" },
  { name: "Vocal Emotion", vibe_category: "vocals", description: "Emotional intensity and character of delivery", instructions: "Determine the feeling or attitude the vocalist is projecting through their performance.", examples: "vulnerable and pleading, aggressive and confrontational, detached and deadpan, manic and unhinged, joyful and carefree" },
  { name: "Vocal Accent", vibe_category: "vocals", description: "Cultural, regional, or dialectal inflection", instructions: "Listen for any specific regional accents or cultural dialects present in the pronunciation of the words.", examples: "Southern US drawl, heavy New York street inflection, Caribbean Patois flavor, London roadman cadence, AAVE with Trinidadian accent, neutral/no notable accent" },
  { name: "Vocal Effects", vibe_category: "vocals", description: "Processing and effects on the voice", instructions: "Detail any obvious studio effects applied to the lead vocals.", examples: "heavy autotune, dry with no reverb, vocoder harmonies, telephone EQ filter on verse, heavy slapback delay" },
  { name: "Backing Vocals", vibe_category: "vocals", description: "Backing vocal style, placement, role, and where they appear", instructions: "Identify any secondary vocals supporting the lead. Describe what they are doing (harmonies, ad-libs) and where they occur.", examples: "lush choir harmonies on chorus only, call-and-response ad-libs throughout, gang vocal shouts on hook, layered self-harmonies stacked 6 deep, kid's choir on bridge, none" },

  // LYRICS
  { name: "Language", vibe_category: "lyrics", description: "Language or languages sung in", instructions: "Identify the primary language of the lyrics, noting if multiple languages are used.", examples: "English, Korean with English chorus, Spanish and English code-switching" },
  { name: "Lyrical Subject", vibe_category: "lyrics", description: "Topic category of what the song is about", instructions: "Determine the broad thematic category of the lyrics. What is the overarching topic?", examples: "relationships, street life and survival, politics and world order, money and materialism, self-empowerment, partying and nightlife, spirituality and faith, mental health, nostalgia and memory" },
  { name: "Lyrical Message", vibe_category: "lyrics", description: "The core message or intent — what the author is trying to tell the listener", instructions: "Analyze the deeper meaning of the lyrics. What specific point, story, or moral is the artist conveying?", examples: "cautionary tale about greed consuming everything, celebrating overcoming struggle, processing unresolved grief, pure wordplay and flexing with no deeper message, cry for help disguised as a party song, warning to enemies" },
  { name: "Lyrical Tone", vibe_category: "lyrics", description: "Emotional stance and attitude of the words themselves", instructions: "Evaluate the attitude or mood of the written lyrics, separate from the musical delivery.", examples: "vengeful payback, carefree joy, bitter resentment, hopeful yearning, feeling misunderstood, cocky braggadocio, grateful and reflective, defeated and resigned" },
  { name: "Narrative Style", vibe_category: "lyrics", description: "The type and mode of lyrical content", instructions: "Describe how the lyrics are structured conceptually. Is it a literal story, abstract poetry, or conversational?", examples: "storytelling with beginning, middle, end; emotional venting and confessional; boasting and flexing; repetitive wordplay and hooks; spoken-word poetry; abstract imagery with no literal narrative; conversational as if talking to someone; anthem — rallying cry meant to be chanted" },
  { name: "Narrative POV", vibe_category: "lyrics", description: "Point of view and how it shifts across the song", instructions: "Identify the perspective from which the lyrics are delivered (1st, 2nd, or 3rd person) and note if it changes between sections.", examples: "first-person throughout, third-person storytelling, second-person — speaking directly to 'you', first-person verses shift to third-person chorus, alternating perspectives between verse 1 and verse 2, omniscient narrator in verses, first-person confession in bridge" },
  { name: "Rhyme Scheme", vibe_category: "lyrics", description: "Rhyming patterns per section with internal rhymes noted", instructions: "Analyze the structural pattern of rhymes at the end of lines, as well as any notable rhyming within the lines themselves.", examples: "AABB couplets in verse, ABAB in chorus; dense multisyllabic internal rhymes; free verse no rhyme; chorus is a single repeated phrase" },
  { name: "Poetic Devices", vibe_category: "lyrics", description: "Literary and rhetorical techniques used", instructions: "Identify any advanced lyrical techniques such as metaphors, similes, alliteration, or irony.", examples: "heavy metaphor and simile, alliteration in hooks, anaphora — each verse starts with 'I remember', ironic contrast between upbeat sound and dark lyrics, none — straightforward and literal" },
  { name: "Lyrical Flow", vibe_category: "lyrics", description: "Cadence, meter, and rhythmic phrasing of words", instructions: "Describe the rhythm and pacing of how the words are delivered.", examples: "rapid-fire 16th note syllables, slow deliberate phrasing with long pauses, sing-song nursery rhyme cadence, conversational and loose, triplet flow" },
  { name: "Lyrical Density", vibe_category: "lyrics", description: "How packed or sparse the words are per section", instructions: "Evaluate the word count relative to the music. Are the sections crammed with lyrics or are they sparse with room to breathe?", examples: "wall-to-wall words no breathing room, minimal 4 lines per verse, chorus is one repeated word, dense verses but wide-open sparse chorus" },

  // PRODUCTION
  { name: "Production Style", vibe_category: "production", description: "Overall sonic approach and era", instructions: "Describe the overarching aesthetic of the recording and production. Does it sound modern, retro, clean, or gritty?", examples: "polished maximalist pop, lo-fi bedroom with tape hiss, raw live recording, hyper-processed futuristic, stripped acoustic" },
  { name: "Mix Character", vibe_category: "production", description: "Sonic quality, vocal placement, and depth", instructions: "Analyze the frequency balance and spatial depth of the mix. Note where the vocals sit relative to the instrumental.", examples: "vocal up front and dry, intimate feel; vocals buried in reverb wall, stadium sound; bass-heavy low-end dominant; bright and crispy highs" },
  { name: "Stereo Field", vibe_category: "production", description: "Panning and spatial layout", instructions: "Listen to the left and right channels. Describe how wide the mix is and if specific elements are panned aggressively.", examples: "guitars hard-panned left and right, drums dead center; wide immersive stereo; narrow mono-focused; elements ping-pong between channels" },
  { name: "Sound Design", vibe_category: "production", description: "Non-musical sounds, foley, and sonic textures", instructions: "Identify any environmental sounds, noises, or purely textural audio elements that aren't traditional instruments.", examples: "vinyl crackle throughout, rain and thunder in intro, glitch artifacts and digital noise, field recording of city traffic under verse, none" },
  { name: "Sampling", vibe_category: "production", description: "Notable samples and their treatment", instructions: "Determine if the track utilizes audio recorded from other songs or media, and describe how it was manipulated.", examples: "chops a 70s soul vocal into the hook, pitch-shifted classical piano sample, breakbeat from classic funk record, none" },

  // MOOD
  { name: "Overall Mood", vibe_category: "mood", description: "Overarching emotional atmosphere in precise terms", instructions: "Summarize the primary emotion or feeling the track evokes in the listener.", examples: "euphoric, creeping dread, simmering tension, bittersweet nostalgia, manic and frantic, anthemic and triumphant" },
  { name: "Danceability", vibe_category: "mood", description: "Type and intensity of movement it drives", instructions: "Evaluate how the rhythm and groove compel physical movement. What kind of dancing does it suit?", examples: "club-ready four-on-the-floor pulse, head-nod groove, mosh pit energy, slow sway, sit and listen — not danceable" },

  // ENERGY
  { name: "Pace", vibe_category: "energy", description: "Perceived speed and momentum of the track regardless of BPM", instructions: "Describe the subjective feeling of speed. Does the song feel fast and urgent or slow and sluggish, regardless of the actual tempo?", examples: "breakneck and relentless, slow heavy crawl, gradually accelerating, stop-start lurching, half-time crawl despite high BPM" },
  { name: "Intensity", vibe_category: "energy", description: "How hard the track hits and how much force it carries", instructions: "Evaluate the sheer sonic force and weight of the song.", examples: "explosive and overwhelming, gentle and delicate, simmering just below boiling, crushing and suffocating, featherlight" },
  { name: "Tension", vibe_category: "energy", description: "Suspense, anxiety, and release quality", instructions: "Analyze how the song builds anticipation. Does it resolve that anticipation, or leave the listener hanging?", examples: "anxious and taut, relaxed and loose, building with no release, constant tension-release cycle, unresolved and unsettling" },
  { name: "Energy Texture", vibe_category: "energy", description: "Physical quality and shape of the energy", instructions: "Use tactile adjectives to describe how the energy of the song feels.", examples: "bouncy and springy, heavy and grinding, floaty and weightless, jagged and angular, smooth and flowing, sticky and syrupy" },
  { name: "Atmosphere", vibe_category: "energy", description: "Immersive or altered-state quality of the sonic space", instructions: 'Describe the ambient "space" the song creates. Does it transport the listener to a specific psychological or environmental space?', examples: "surreal and dreamlike, hypnotic and trance-inducing, psychedelic and disorienting, claustrophobic and suffocating, vast and cinematic, underwater and submerged" },

  // SIGNATURE
  { name: "Signature Quirks", vibe_category: "signature", description: "One-of-a-kind imperfections, oddities, and distinguishing details that make this song unlike any other", instructions: "Listen very closely for tiny, easily missed details, mistakes, or unique studio choices that give the track distinct character.", examples: "snare slightly off-grid giving a human lurch, cough left in at 2:14, guitar intentionally detuned, vocalist laughs mid-line in verse 2, record scratch used as melodic instrument" },
  { name: "Signature Moments", vibe_category: "signature", description: "The defining, most memorable musical events or passages that everyone remembers", instructions: 'Identify the "wow" moments of the song. What is the most iconic, standout section that defines the entire track?', examples: "3-minute vocoder solo as outro, beat completely switches genre at bridge, acapella breakdown at 2:30, orchestra swells as drums cut for 4 bars before final chorus, guitar solo over key change, entire crowd chant section" },
];

async function seed() {
  const db = getDb();

  console.log("Seeding database...");


  // ─── Dev User ──────────────────────────────────────────────────────────────
  const userId = "seed-admin-user-001";
  await db.insert(user).values({
    id: userId,
    name: "Admin",
    email: "admin@vibeyvibe.local",
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).onConflictDoNothing();

  await db.insert(account).values({
    id: "seed-admin-account-001",
    accountId: userId,
    providerId: "credential",
    userId: userId,
    password: "j8$k.osHo7!in4lhqIznisJ_REPLACE_ME",
    createdAt: new Date(),
    updatedAt: new Date(),
  }).onConflictDoNothing();

  console.log("  Admin user created");

  // ─── Artists (My Music) ──────────────────────────────────────────────────
  const [lunaEcho] = await db.insert(artists).values({
    name: "Luna Echo", context: "my_music", isni: "0000000121581532", image_path: null, rating: 0.8,
  }).returning();
  const [neonPulse] = await db.insert(artists).values({
    name: "Neon Pulse", context: "my_music", isni: "0000000234567890", image_path: null, rating: 0.7,
  }).returning();
  const [theWanderers] = await db.insert(artists).values({
    name: "The Wanderers", context: "my_music", isni: null, image_path: null, rating: 0.6,
  }).returning();

  console.log("  My Music artists created");

  // ─── Artists (Lab) ──────────────────────────────────────────────────────
  const [daftPunk] = await db.insert(artists).values({
    name: "Daft Punk", context: "lab", isni: "0000000118779068", image_path: null, rating: 0.9,
  }).returning();
  const [radiohead] = await db.insert(artists).values({
    name: "Radiohead", context: "lab", isni: "0000000121070864", image_path: null, rating: 0.9,
  }).returning();

  console.log("  Lab artists created");

  // ─── Albums (My Music) ───────────────────────────────────────────────────
  const [midnightFrequencies] = await db.insert(albums).values({
    name: "Midnight Frequencies", context: "my_music", ean: null, release_date: "2024-03-15", rating: 0.8, image_path: null,
  }).returning();
  const [digitalDreams] = await db.insert(albums).values({
    name: "Digital Dreams", context: "my_music", ean: null, release_date: "2023-11-20", rating: 0.7, image_path: null,
  }).returning();

  console.log("  My Music albums created");

  // ─── Songs (My Music) ────────────────────────────────────────────────────
  const [electricSunrise] = await db.insert(songs).values({
    name: "Electric Sunrise", context: "my_music", isrc: "USRC12345678", release_date: "2024-03-15", rating: 0.9, spotify_uid: null, apple_music_uid: null, youtube_uid: null,
  }).returning();
  const [neonNights] = await db.insert(songs).values({
    name: "Neon Nights", context: "my_music", isrc: "USRC12345679", release_date: "2024-03-15", rating: 0.7, spotify_uid: null,
  }).returning();
  const [crystalWaves] = await db.insert(songs).values({
    name: "Crystal Waves", context: "my_music", isrc: "USRC12345680", release_date: "2023-11-20", rating: 0.6, spotify_uid: null,
  }).returning();
  const [vaporTrail] = await db.insert(songs).values({
    name: "Vapor Trail", context: "my_music", isrc: null, release_date: "2024-01-10", rating: 0.5,
  }).returning();
  const [shadowDance] = await db.insert(songs).values({
    name: "Shadow Dance", context: "my_music", isrc: null, release_date: null, rating: null,
  }).returning();

  console.log("  My Music songs created");

  // ─── Songs (Lab) ────────────────────────────────────────────────────────
  const [aroundTheWorld] = await db.insert(songs).values({
    name: "Around the World", context: "lab", isrc: "FRZ039800212", release_date: "1997-03-17", rating: 0.8, spotify_uid: "3nsfB1vus2qaloUdcBZvDu",
  }).returning();
  const [everythingInItsRightPlace] = await db.insert(songs).values({
    name: "Everything In Its Right Place", context: "lab", isrc: "GBAYE0000696", release_date: "2000-10-02", rating: 0.9, spotify_uid: "2kJwzbxV2ppN0wnMTKaqnC",
  }).returning();

  console.log("  Lab songs created");

  // ─── Artist-Song Relationships ───────────────────────────────────────────
  await db.insert(artistSongs).values([
    { artist_id: lunaEcho.id, song_id: electricSunrise.id },
    { artist_id: lunaEcho.id, song_id: neonNights.id },
    { artist_id: neonPulse.id, song_id: crystalWaves.id },
    { artist_id: daftPunk.id, song_id: aroundTheWorld.id },
    { artist_id: radiohead.id, song_id: everythingInItsRightPlace.id },
  ]).onConflictDoNothing();

  console.log("  Artist-song relationships created");

  // ─── Album-Song Relationships ────────────────────────────────────────────
  await db.insert(albumSongs).values([
    { album_id: midnightFrequencies.id, song_id: electricSunrise.id },
    { album_id: midnightFrequencies.id, song_id: neonNights.id },
    { album_id: digitalDreams.id, song_id: crystalWaves.id },
  ]).onConflictDoNothing();

  console.log("  Album-song relationships created");

  // ─── Bin Sources ─────────────────────────────────────────────────────────
  const [ytSource] = await db.insert(binSources).values({
    name: "YouTube Discoveries", context: "bin", url: "https://youtube.com",
  }).returning();
  const [scSource] = await db.insert(binSources).values({
    name: "SoundCloud Finds", context: "bin", url: "https://soundcloud.com",
  }).returning();

  console.log("  Bin sources created");

  // ─── Bin Songs ───────────────────────────────────────────────────────────
  await db.insert(binSongs).values([
    { name: "Lo-fi Beat #42", context: "bin", asset_path: null, lyrics: null, notes: "Great vibe", rating: 0.7, bin_source_id: ytSource.id },
    { name: "Underground Remix", context: "bin", asset_path: null, lyrics: null, notes: null, rating: 0.5, bin_source_id: ytSource.id },
    { name: "Ambient Texture", context: "bin", asset_path: null, lyrics: null, notes: "Use for intro", rating: null, bin_source_id: scSource.id },
  ]);

  console.log("  Bin songs created");

  // ─── Suno Prompt Collections ─────────────────────────────────────────────
  const [chillVibes] = await db.insert(sunoPromptCollections).values({
    name: "Chill Vibes", context: "suno", description: "Relaxing electronic tracks",
  }).returning();
  const [energeticBangers] = await db.insert(sunoPromptCollections).values({
    name: "Energetic Bangers", context: "suno", description: "High energy dance tracks",
  }).returning();

  console.log("  Suno prompt collections created");

  // ─── Suno Prompts ────────────────────────────────────────────────────────
  const [lofiSunset] = await db.insert(sunoPrompts).values({
    name: "Lo-fi Sunset", context: "suno", lyrics: "Watching the sun go down...", prompt: "lo-fi hip hop, warm, vinyl crackle, sunset vibes", notes: "For chill collection", song_profile_id: null,
  }).returning();
  const [danceFloor] = await db.insert(sunoPrompts).values({
    name: "Dance Floor", context: "suno", lyrics: "Feel the beat drop...", prompt: "electronic dance, heavy bass, 128 BPM, festival energy", notes: "For energetic collection", song_profile_id: null,
  }).returning();

  console.log("  Suno prompts created");

  // ─── Suno Collection-Prompt Relationships ────────────────────────────────
  await db.insert(sunoCollectionPrompts).values([
    { collection_id: chillVibes.id, prompt_id: lofiSunset.id },
    { collection_id: energeticBangers.id, prompt_id: danceFloor.id },
  ]).onConflictDoNothing();

  console.log("  Suno collection-prompt relationships created");

  // ─── Suno Song Playlists ─────────────────────────────────────────────────
  const [bestGenerations] = await db.insert(sunoSongPlaylists).values({
    name: "Best Generations", context: "suno", description: "Top picks from Suno",
  }).returning();

  console.log("  Suno song playlists created");

  // ─── Suno Songs ──────────────────────────────────────────────────────────
  await db.insert(sunoSongs).values({
    name: "Generated Lo-fi Track", context: "suno", suno_uid: "suno_abc123", image_path: null, suno_prompt_id: lofiSunset.id, bin_song_id: null, suno_song_playlist_id: bestGenerations.id,
  });

  console.log("  Suno songs created");

  // ─── Vibes ─────────────────────────────────────────────────────────────

  // Migration: rename old slug-format names to title case
  const vibeRenameMap: Record<string, string> = {
    "genre": "Genre",
    "era_influence": "Era Influence",
    "cultural_origin": "Cultural Origin",
    "song_structure": "Song Structure",
    "verse_style": "Verse Style",
    "chorus_style": "Chorus Style",
    "intro_style": "Intro Style",
    "outro_style": "Outro Style",
    "duration": "Duration",
    "energy_arc": "Energy Arc",
    "transitions": "Transitions",
    "section_contrast": "Section Contrast",
    "key": "Key",
    "tempo": "Tempo",
    "time_signature": "Time Signature",
    "chord_progression": "Chord Progression",
    "melody": "Melody",
    "rhythmic_feel": "Rhythmic Feel",
    "drum_pattern": "Drum Pattern",
    "bass_groove": "Bass Groove",
    "percussion_elements": "Percussion Elements",
    "primary_instruments": "Primary Instruments",
    "secondary_instruments": "Secondary Instruments",
    "instrument_technique": "Instrument Technique",
    "instrument_effects": "Instrument Effects",
    "arrangement_dynamics": "Arrangement Dynamics",
    "vocal_cast": "Vocal Cast",
    "vocal_timbre": "Vocal Timbre",
    "vocal_range": "Vocal Range",
    "vocal_style": "Vocal Style",
    "vocal_sync": "Vocal Sync",
    "vocal_emotion": "Vocal Emotion",
    "vocal_accent": "Vocal Accent",
    "vocal_effects": "Vocal Effects",
    "backing_vocals": "Backing Vocals",
    "language": "Language",
    "lyrical_subject": "Lyrical Subject",
    "lyrical_message": "Lyrical Message",
    "lyrical_tone": "Lyrical Tone",
    "narrative_style": "Narrative Style",
    "narrative_pov": "Narrative POV",
    "rhyme_scheme": "Rhyme Scheme",
    "poetic_devices": "Poetic Devices",
    "lyrical_flow": "Lyrical Flow",
    "lyrical_density": "Lyrical Density",
    "production_style": "Production Style",
    "mix_character": "Mix Character",
    "stereo_field": "Stereo Field",
    "sound_design": "Sound Design",
    "sampling": "Sampling",
    "overall_mood": "Overall Mood",
    "danceability": "Danceability",
    "pace": "Pace",
    "intensity": "Intensity",
    "tension": "Tension",
    "energy_texture": "Energy Texture",
    "atmosphere": "Atmosphere",
    "signature_quirks": "Signature Quirks",
    "signature_moments": "Signature Moments",
  };

  let vibeRenamed = 0;
  for (const [oldName, newName] of Object.entries(vibeRenameMap)) {
    const existing = await db
      .select({ id: vibes.id })
      .from(vibes)
      .where(and(eq(vibes.name, oldName), eq(vibes.context, "lab")))
      .limit(1);
    if (existing.length > 0) {
      await db
        .update(vibes)
        .set({ name: newName, updated_at: new Date().toISOString() })
        .where(eq(vibes.id, existing[0].id));
      vibeRenamed++;
    }
  }
  if (vibeRenamed > 0) {
    console.log(`  Renamed ${vibeRenamed} vibes from slug to title case`);
  }

  let vibeInserted = 0;
  let vibeUpdated = 0;
  let vibeUnchanged = 0;

  for (const vibe of vibesSeedData) {
    const existing = await db
      .select()
      .from(vibes)
      .where(
        and(
          eq(vibes.name, vibe.name),
          eq(vibes.context, "lab")
        )
      )
      .limit(1);

    if (existing.length > 0) {
      const row = existing[0];
      const needsUpdate =
        row.description !== vibe.description ||
        row.instructions !== (vibe.instructions ?? null) ||
        row.examples !== (vibe.examples ?? null) ||
        row.vibe_category !== vibe.vibe_category;

      if (needsUpdate) {
        await db
          .update(vibes)
          .set({
            description: vibe.description,
            instructions: vibe.instructions ?? null,
            examples: vibe.examples ?? null,
            vibe_category: vibe.vibe_category,
            updated_at: new Date().toISOString(),
          })
          .where(eq(vibes.id, row.id));
        vibeUpdated++;
      } else {
        vibeUnchanged++;
      }
    } else {
      await db.insert(vibes).values({
        name: vibe.name,
        context: "lab",
        vibe_category: vibe.vibe_category,
        description: vibe.description,
        instructions: vibe.instructions ?? null,
        examples: vibe.examples ?? null,
      });
      vibeInserted++;
    }
  }

  // Archive replaced vibes
  for (const oldName of ["section_sizes"]) {
    const existing = await db
      .select()
      .from(vibes)
      .where(
        and(
          eq(vibes.name, oldName),
          eq(vibes.context, "lab")
        )
      )
      .limit(1);

    if (existing.length > 0 && !existing[0].archived) {
      await db
        .update(vibes)
        .set({ archived: true, updated_at: new Date().toISOString() })
        .where(eq(vibes.id, existing[0].id));
    }
  }

  console.log(`  Vibes seeded (inserted: ${vibeInserted}, updated: ${vibeUpdated}, unchanged: ${vibeUnchanged})`);

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
