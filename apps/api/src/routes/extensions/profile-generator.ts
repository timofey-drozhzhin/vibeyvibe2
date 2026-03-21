import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "../../db/index.js";
import {
  songs,
  artists,
  artistSongs,
  profiles,
  aiQueue,
} from "../../db/schema/index.js";
import { vibesSchema, getActiveSchema, getSchemaNodeCount, schemaToPrompt } from "../../features/vibes/index.js";
import { processNextJob, getOpenRouterModels } from "../../services/ai-queue/index.js";
import { getEnv } from "../../env.js";

const profileGenerator = new Hono();

const generateSchema = z.object({
  songId: z.number().int().positive(),
  model: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAllowedModels(): string[] {
  const env = getEnv();
  const raw = env.PROFILE_GENERATION_MODELS;
  if (!raw) return [];
  return raw.split(",").map((m) => m.trim()).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Prompt Builder
// ---------------------------------------------------------------------------

function buildPrompt(
  song: { name: string; release_date?: string | null },
  artistNames: string[],
): string {
  const songTitle = song.name;
  const songArtist =
    artistNames.length > 0 ? artistNames.join(", ") : "Unknown Artist";
  const releaseDate = song.release_date || "Unknown";

  const activeSchema = getActiveSchema(vibesSchema);
  const typeDefinitions = schemaToPrompt(activeSchema);

  return `**Role:** You are an expert music producer and lyricist.
**About your job:** Your job is to describe the song in detail using the provided type definitions.

## Context
**Song Title:** ${songTitle}
**Song Author:** ${songArtist}
**Release Date:** ${releaseDate}

## Type Definitions
Below is the structure you must fill in. Each field has an instruction (after //) describing what to listen for and an example value. Array fields (marked with []) mean you should produce one or more entries.

\`\`\`
${typeDefinitions}
\`\`\`

## Your Job
Profile the song "${songTitle}" by "${songArtist}", released on or about ${releaseDate}. Research the song, locate and examine the lyrics, and understand all details describing the style of the song.

Fill in every field in the type definitions above. The point of this exercise is to capture every detail that makes this song different. Every squeak, every unique element. Every element and emotion in great detail. The more specific terms you use, the better.

Return your output as a JSON object matching the type definitions above. For example:
\`\`\`json
{
  "genre": {
    "genre": "Bubblegum Pop, Trap Metal",
    "era_influence": "late 80s synth-pop"
  },
  "vocals": {
    "cast": [
      {
        "role": "solo male rapper on verses",
        "timbre": "warm and husky",
        "languages": ["English"]
      }
    ],
    "vocal_effects": "heavy autotune"
  }
}
\`\`\`

## Checks before finalizing your output
- Did you fill in every field? If not, go back and fill it in.
- For array fields (like vocal cast), did you create an entry for each distinct item? E.g. one entry per vocalist.
- Did you add fields not in the type definitions? If so, remove them.
- Were you specific, not generic? E.g. "a wooden flute with a warm tone" instead of just "flute".

## Rules
- Your final product must not mention any music authors, copy/paste any original work, or use any copyrighted work. You can describe the song style but cannot name-drop specific artists.
- Be clear and descriptive, using selective words instead of long sentences. E.g. instead of "The song has an intense feeling of excitement", say "euphoric".`;
}

// ---------------------------------------------------------------------------
// GET /models — List available models for profile generation
// ---------------------------------------------------------------------------

profileGenerator.get("/models", (c) => {
  const models = getAllowedModels();
  if (models.length === 0) {
    return c.json(
      { error: "Profile generation is not configured. Set PROFILE_GENERATION_MODELS." },
      503,
    );
  }
  return c.json({ data: models });
});

// ---------------------------------------------------------------------------
// POST /generate — Queue a profile generation job
// ---------------------------------------------------------------------------

profileGenerator.post(
  "/generate",
  zValidator("json", generateSchema),
  async (c) => {
    const { songId, model } = c.req.valid("json");
    const db = getDb();

    // 1. Validate model is in the allowed list
    const allowedModels = getAllowedModels();
    if (allowedModels.length === 0) {
      return c.json(
        { error: "Profile generation is not configured. Set PROFILE_GENERATION_MODELS." },
        503,
      );
    }
    if (!allowedModels.includes(model)) {
      return c.json({ error: "Selected model is not allowed." }, 400);
    }

    // 2. Fetch the song
    const [song] = await db
      .select()
      .from(songs)
      .where(eq(songs.id, songId))
      .limit(1);

    if (!song) {
      return c.json({ error: "Song not found" }, 404);
    }

    // 3. Fetch artists for this song
    const songArtists = await db
      .select({ name: artists.name })
      .from(artistSongs)
      .innerJoin(artists, eq(artistSongs.artist_id, artists.id))
      .where(eq(artistSongs.song_id, songId));

    const artistNames = songArtists.map((a) => a.name);

    // 4. Check that vibes schema has active nodes
    const activeSchema = getActiveSchema(vibesSchema);
    const nodeCount = getSchemaNodeCount(activeSchema);

    if (nodeCount === 0) {
      return c.json({ error: "No active vibes found in schema" }, 400);
    }

    // 5. Build the prompt
    const prompt = buildPrompt(song, artistNames);

    // 6. Create queue job
    const now = new Date().toISOString();
    const [queueItem] = await db
      .insert(aiQueue)
      .values({
        name: `Profile: ${song.name}`,
        type: "profile_generation",
        status: "pending",
        model,
        prompt,
        created_at: now,
        updated_at: now,
      })
      .returning();

    // 7. Create profile with null value (will be filled by queue processor)
    const [profile] = await db
      .insert(profiles)
      .values({
        song_id: songId,
        value: null,
        model,
        ai_queue_id: queueItem.id,
        created_at: now,
        updated_at: now,
      })
      .returning();

    // 8. Fire-and-forget: trigger processing (only if model is autoprocessable)
    if (getOpenRouterModels().includes(model)) {
      processNextJob().catch((err) =>
        console.error("[profile-generator] Fire-and-forget error:", err),
      );
    }

    return c.json({
      data: {
        id: profile.id,
        songId,
        queueId: queueItem.id,
        status: "pending",
      },
    });
  },
);

export default profileGenerator;
