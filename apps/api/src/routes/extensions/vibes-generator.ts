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
} from "../../db/schema/index.js";
import { chatCompletion } from "../../services/openrouter/index.js";

const vibesGenerator = new Hono();

const generateSchema = z.object({
  songId: z.number().int().positive(),
});

// ---------------------------------------------------------------------------
// Prompt Builder
// ---------------------------------------------------------------------------

function buildPrompt(
  song: { name: string; release_date?: string | null },
  artistNames: string[],
  activeVibes: Array<{
    id: number;
    name: string;
    vibe_category: string;
    description: string | null;
    instructions: string | null;
    examples: string | null;
  }>,
): string {
  const songTitle = song.name;
  const songArtist =
    artistNames.length > 0 ? artistNames.join(", ") : "Unknown Artist";
  const releaseDate = song.release_date || "Unknown";

  const vibeEntries = activeVibes
    .map(
      (v) =>
        `### ${v.name}\nId: ${v.id}\nCategory: ${v.vibe_category}` +
        `\nDescription: ${v.description ?? ""}` +
        `\nInstruction: ${v.instructions ?? ""}` +
        `\nExamples: ${v.examples ?? ""}` +
        `\nAttribute Value:\n`,
    )
    .join("\n");

  return `**Role:** You are an expert music producer and lyricist.
**About your job:** Your job is to describe the song in detail using the provided attributes.

## Context
**Song Title:** ${songTitle}
**Song Author:** ${songArtist}
**Release Date:** ${releaseDate}

## Attributes
Below is a list of song attributes and their descriptions, separated by categories. You must fully familiarize yourself with every attribute, before describing the song.

*******
${vibeEntries}
*******

## Your Job
Your job is to profile the song "${songTitle}" by "${songArtist}", released on or about ${releaseDate} using the attributes provided below. You will first research the song, locate and examine the lyrics, and understand all details describing style of the song.

You will then loop through each Attribute in the \`## Attributes\` section, and answer the Attribute Value for each attribute.
The point of this exercise is to capture every detail that makes this song different. Every squeak, every unique element. And every element and emotion that captures this song in great detail. The more specific terms you use, the better.

Our final output should be in JSON format. It should not contain attribute categories, only attribute values. The format should be as follows:
\`\`\`
{
  "[id]": "[Attribute Value]",
  "[id]": "[Attribute Value]"
}
\`\`\`

## Checks before finalizing your output
Before you finalize your output, make sure to check the following:
- Did you answer every attribute? If not, go back and answer it.
- Did you include every single attribute in JSON output? If not, include all attributes, even if the value is empty.
- Did you make up new attributes in the JSON output? If so, remove them. Only include the attributes that were provided.
- Were you specific in your descriptions, not generic? E.g. Instead of describing the instrument of a "flute", say "a wooden flute with a warm tone".

## Rules
- Your final product must not mention any music authors, copy/paste any original work, or use any copyrighted work. This means that you can describe the song style, but you cannot say copy Some-Author-Name.
- Be clear and descriptive, using selective words instead of long sentences. E.g. instead of "The song has an intense feeling of excitement", say "euphoric".`;
}

// ---------------------------------------------------------------------------
// POST /generate — Generate vibes for a song using AI
// ---------------------------------------------------------------------------

vibesGenerator.post(
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

    // 3. Fetch all active (non-archived) vibes
    const activeVibes = await db
      .select()
      .from(vibes)
      .where(eq(vibes.archived, false));

    if (activeVibes.length === 0) {
      return c.json({ error: "No active vibes found" }, 400);
    }

    // 4. Build prompt and call OpenRouter
    const prompt = buildPrompt(song, artistNames, activeVibes);

    let rawResponse: string;
    try {
      rawResponse = await chatCompletion([{ role: "user", content: prompt }]);
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
    let parsed: Record<string, string>;
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

    // 6. Build a set of valid vibe IDs for validation
    const vibeIdSet = new Set(activeVibes.map((v) => v.id));

    // 7. Upsert song_vibes rows
    let upserted = 0;
    let skipped = 0;

    for (const [vibeIdStr, value] of Object.entries(parsed)) {
      const vibeId = Number(vibeIdStr);
      if (!vibeIdSet.has(vibeId) || typeof value !== "string" || !value.trim()) {
        skipped++;
        continue;
      }

      const [existing] = await db
        .select()
        .from(songVibes)
        .where(
          and(eq(songVibes.song_id, songId), eq(songVibes.vibe_id, vibeId)),
        )
        .limit(1);

      if (existing) {
        await db
          .update(songVibes)
          .set({ value: value.trim() })
          .where(
            and(eq(songVibes.song_id, songId), eq(songVibes.vibe_id, vibeId)),
          );
      } else {
        await db.insert(songVibes).values({
          song_id: songId,
          vibe_id: vibeId,
          value: value.trim(),
        });
      }
      upserted++;
    }

    return c.json({
      data: {
        songId,
        totalVibes: activeVibes.length,
        upserted,
        skipped,
      },
    });
  },
);

export default vibesGenerator;
