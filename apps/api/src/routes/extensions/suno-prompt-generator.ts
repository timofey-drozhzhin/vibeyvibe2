import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { getDb } from "../../db/index.js";
import {
  songs,
  artists,
  artistSongs,
  vibes,
  songVibes,
  sunoPrompts,
} from "../../db/schema/index.js";
import { chatCompletion } from "../../services/openrouter/index.js";
import { getEnv } from "../../env.js";

const sunoPromptGenerator = new Hono();

const generateSchema = z.object({
  songId: z.number().int().positive(),
});

// ---------------------------------------------------------------------------
// Prompt Builder
// ---------------------------------------------------------------------------

function buildPrompt(
  song: { name: string },
  artistNames: string[],
  songVibeEntries: Array<{
    vibeName: string;
    vibeCategory: string;
    value: string;
  }>,
): string {
  const songTitle = song.name;
  const songArtist =
    artistNames.length > 0 ? artistNames.join(", ") : "Unknown Artist";

  const vibeDescription = songVibeEntries
    .map((sv) => `## ${sv.vibeName} (${sv.vibeCategory})\n${sv.value}`)
    .join("\n\n");

  return `- **Role:** You are an expert music producer and lyricist.
- **About your job:** Your job is to generate Song Lyrics, Styles (a prompt describing the style of music), and optionally decide Vocal Gender (main singer, i.e. male or female).

## Rules
Your final product must not mention any music author, copy/paste any original work, or use any copyrighted work. This means that you can describe the genre, but you cannot say copy Some-Author-Name.

## Your Job
Generate a Suno AI "lyrics" and "style" (prompt) for a song based on the Song Description provided below.

## Song Description
**Song Title:** ${songTitle}
**Song Artist:** ${songArtist}

*******
${vibeDescription}
*******

## Lyrics Guidelines (for Suno AI)
Lyrics rules:
- Make sure your lyrics match the lyrics requirements in the Song Description
- Use square brackets to identify the paragraph type, i.e. [Verse], [Chorus], etc.
- All notes/hints must be in square brackets, such as [whisper], [talking], [yelling], etc.

When generating lyrics, follow this:
- The Message: Understand the intent and the feel of the song; what it's trying to say, the emotions, the endgoal, the passion behind the words.
- Determine the type of message. Is the author simply sharing feelings, telling a story, trying to convince the audience, etc
- Point of View: Identify the point of view of the original song (e.g., first-person, third-person) and adopt the same perspective in your lyrics.
- Determine the energy, the tension and release points (e.g., quiet verses, explosive choruses)
- Identify the structure (e.g., Intro, Verse, Pre-Chorus, Chorus, Bridge) and the rhyme scheme (e.g., AABB, ABAB) of each section.
- Identify the length of the lyrics and the speed it should be delivered to match close to the duration and speed of the original song.
- Determine the accent, dialect, and any vocal imperfections. The only thing that will change, is that this song will be in English language, regardless of the original language.
- Ensure the natural stressed and unstressed syllables of your new words to addapt the same rhythmic cadence and bounce of the original vocal delivery.
- Deternmine if you need any special literary devices (e.g., heavy metaphors, direct conversational tone, repetitive hooks).
- Add bracketed performance tags indicating how lines should be sung based on the original vocal delivery (e.g., [Whispered], [Staccato], [Belting]).
- Include parentheses for background vocals, ad-libs, or harmonies exactly where they appear in the original song (e.g., "Walking down the street (down the street)").

Make sure you capture the characteristics of the lyrics in Song Description. Your goal is to find every unique detail that will set this song apart from generic songs.

## Style Guidelines (for Suno AI)
Style is a prompt to Suno AI describing the style of the music.
- The Style prompt must be a maximum of 1000 characters.
- Use descriptive keywords (describing genre or style), not long sentences.

When composing guidelines, using the Song Description, identify the most unique and defining characteristics of the song. Rewrite it into concentrated, descriptive prompt, focusing on the most unique elements (signature, imperfections, energy).

Establish the signature of the song:
- Establish the detailed genre and subgenres of the song
- Establish the voice characteristics, the gender
- Establish the instruments and any unique rhythmic or melodic elements (e.g., signature guitar riff, unique synth lead, specific drum pattern).
- Relay the energy level and mood, slightly exaggerating
- Establish a voice dialect (e.g., Southern US drawl, heavy New York street inflection, Caribbean Patois flavor, London Cockney cadence, AAVE slang flow).

Identify all imperfections:
- Find imperfections in instruments (e.g., fret buzz on acoustic guitar, blown-out distorted bass speaker, out-of-tune honky-tonk piano, lo-fi drum bleed, crackling synth cables, scraping violin bow).
- Find imperfections in the voice (e.g., raw voice cracks, aggressive vocal fry, sudden falsetto leaps, out-of-breath gasps, slurred/intoxicated delivery, heavy mic-breathing).
- Find anything else that makes this song unique

Push the borders
- Add adrenaline, emotion, passion, stretching the emotions
- Frequencies: Command a V-shaped mix or specific EQ profile (e.g., deep sub-bass lows, scooped muddy mids, high airy highs, sparkling treble, airy).
- Environment/Foley: Describe the sonic space and atmospheric textures (e.g., claustrophobic dry room, massive stadium reverb, lo-fi tape hiss, vinyl crackle, saturated tubes, ambient street noise bleed).
- Make sure the prompt maximizes ADRENALINE! SENSATION! GOOSEBUMPS! Extremity, energy, excitement. Make sure you describe the feel of the music - heavenly, jumpy, etc.

Re-examine:
- Finally, I want you to loop through every attribute in the "Song Characteristics" and make sure you didn't skip any important identifiers that makes this song so different.

**Check:**
- Did you describe the voice gender?
- Did you include the specific genre styles?
- Did you include specific instruments and their unique properties?
- Did you clearly specify the energy level and the tone of the song?
- Did you clearly specify the exact properties of the voice details (accent, tone, etc)?
- Did you specify the dynamics?
- Did you pull on extremes, make brights brighter, lows lower, highs higher?

**Final Output Format:**
Combine your synthesized elements into a single, comma-separated string of "attributes" (these are your concentrated attributes that you gathered from the "Song Characteristics"):
\`[Genre], [Energy Level & Mood], [Tempo & Groove], [Vocal Character + Accent + Imperfections], [Signature Instrumentation + Instrument Imperfections], [Mix Dynamics & Texture], etc...\`

## Final Output
Your final output should be in JSON format. It should not contain attribute categories, only attribute values. The format should be as follows:
\`\`\`
{
  "lyrics": "[Song Lyrics]",
  "style": "[Song Prompt]"
}
\`\`\``;
}

// ---------------------------------------------------------------------------
// POST /generate — Generate a Suno prompt from song vibes
// ---------------------------------------------------------------------------

sunoPromptGenerator.post(
  "/generate",
  zValidator("json", generateSchema),
  async (c) => {
    const { songId } = c.req.valid("json");
    const db = getDb();

    // 1. Fetch the song (any context)
    const [song] = await db
      .select()
      .from(songs)
      .where(eq(songs.id, songId))
      .limit(1);

    if (!song) {
      return c.json({ error: "Song not found" }, 404);
    }

    // 2. Fetch artists for this song
    const songArtists = await db
      .select({ name: artists.name })
      .from(artistSongs)
      .innerJoin(artists, eq(artistSongs.artist_id, artists.id))
      .where(eq(artistSongs.song_id, songId));

    const artistNames = songArtists.map((a) => a.name);

    // 3. Fetch this song's vibes (song_vibes joined with vibes)
    const songVibeRows = await db
      .select({
        vibeName: vibes.name,
        vibeCategory: vibes.vibe_category,
        value: songVibes.value,
      })
      .from(songVibes)
      .innerJoin(vibes, eq(songVibes.vibe_id, vibes.id))
      .where(
        and(
          eq(songVibes.song_id, songId),
          eq(vibes.archived, false),
        ),
      );

    if (songVibeRows.length === 0) {
      return c.json(
        { error: "No vibes found for this song. Generate vibes first." },
        400,
      );
    }

    // 4. Build prompt and call OpenRouter
    const prompt = buildPrompt(song, artistNames, songVibeRows);

    const env = getEnv();
    const model = env.VIBES_SUNO_PROMPT_OPENROUTER_MODEL;
    if (!model) {
      return c.json(
        { error: "Suno prompt generation is not configured. Set VIBES_SUNO_PROMPT_OPENROUTER_MODEL." },
        503,
      );
    }

    let rawResponse: string;
    try {
      rawResponse = await chatCompletion(
        [{ role: "user", content: prompt }],
        { model },
      );
    } catch (err: any) {
      const message = err?.message ?? "AI generation failed";
      if (message.includes("not configured")) {
        return c.json(
          { error: "AI generation is not configured. Set OPENROUTER_API_KEY." },
          503,
        );
      }
      return c.json({ error: message }, 502);
    }

    // 5. Parse JSON response (handle potential markdown code fences)
    let parsed: { lyrics?: string; style?: string };
    try {
      let cleaned = rawResponse.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned
          .replace(/^```(?:json)?\n?/, "")
          .replace(/\n?```$/, "");
      }
      parsed = JSON.parse(cleaned);
    } catch {
      return c.json(
        { error: "Failed to parse AI response as JSON", rawResponse },
        422,
      );
    }

    // 6. Create a suno_prompts record linked to the song
    const promptName = `${song.name} - Suno Prompt`;
    const [created] = await db
      .insert(sunoPrompts)
      .values({
        name: promptName,
        context: "suno",
        lyrics: parsed.lyrics?.trim() || null,
        prompt: parsed.style?.trim() || null,
        song_id: songId,
      })
      .returning();

    return c.json({
      data: {
        id: created.id,
        name: created.name,
        songId,
      },
    });
  },
);

export default sunoPromptGenerator;
