import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "../../db/index.js";
import { anatomyProfiles, anatomySongs } from "../../db/schema/anatomy.js";
import {
  createProfileSchema,
  updateProfileSchema,
} from "../../validators/anatomy.js";

const listQuerySchema = z.object({
  songId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  archived: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

const createBodySchema = z.object({
  songId: z.string().min(1),
  value: z.union([
    z.string().refine(
      (val) => {
        try {
          const parsed = JSON.parse(val);
          return typeof parsed === "object" && !Array.isArray(parsed);
        } catch {
          return false;
        }
      },
      { message: "Value must be a valid JSON object string" }
    ),
    z.record(z.string()).transform((obj) => JSON.stringify(obj)),
  ]),
});

export const anatomyProfilesRoutes = new Hono();

// GET / - List profiles with optional songId filter
anatomyProfilesRoutes.get(
  "/",
  zValidator("query", listQuerySchema),
  async (c) => {
    const { songId, page, pageSize, archived } = c.req.valid("query");
    const db = getDb();
    const offset = (page - 1) * pageSize;

    const conditions: ReturnType<typeof eq>[] = [];

    if (songId) {
      conditions.push(eq(anatomyProfiles.songId, songId));
    }

    if (archived !== undefined) {
      conditions.push(eq(anatomyProfiles.archived, archived));
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(anatomyProfiles)
        .where(whereClause)
        .orderBy(desc(anatomyProfiles.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(anatomyProfiles)
        .where(whereClause),
    ]);

    // Enrich profiles with song name for display
    const songIds = [...new Set(data.map((p) => p.songId))];
    let songsMap: Record<string, string> = {};
    if (songIds.length > 0) {
      const songs = await db
        .select({ id: anatomySongs.id, name: anatomySongs.name })
        .from(anatomySongs)
        .where(
          sql`${anatomySongs.id} IN (${sql.join(
            songIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        );
      songsMap = Object.fromEntries(songs.map((s) => [s.id, s.name]));
    }

    const enrichedData = data.map((profile) => ({
      ...profile,
      songName: songsMap[profile.songId] || "Unknown Song",
    }));

    return c.json({
      data: enrichedData,
      total: countResult[0].count,
      page,
      pageSize,
    });
  }
);

// POST / - Create a new profile
anatomyProfilesRoutes.post(
  "/",
  zValidator("json", createBodySchema),
  async (c) => {
    const body = c.req.valid("json");
    const db = getDb();

    // Validate that the song exists
    const song = await db
      .select()
      .from(anatomySongs)
      .where(eq(anatomySongs.id, body.songId))
      .limit(1);

    if (song.length === 0) {
      return c.json({ error: "Song not found" }, 404);
    }

    const id = nanoid();

    const profile = await db
      .insert(anatomyProfiles)
      .values({
        id,
        songId: body.songId,
        value: body.value,
      })
      .returning();

    return c.json({ data: profile[0] }, 201);
  }
);

// GET /:id - Get a single profile
anatomyProfilesRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const db = getDb();

  const profile = await db
    .select()
    .from(anatomyProfiles)
    .where(eq(anatomyProfiles.id, id))
    .limit(1);

  if (profile.length === 0) {
    return c.json({ error: "Profile not found" }, 404);
  }

  // Get the song name
  const song = await db
    .select({ id: anatomySongs.id, name: anatomySongs.name })
    .from(anatomySongs)
    .where(eq(anatomySongs.id, profile[0].songId))
    .limit(1);

  return c.json({
    data: {
      ...profile[0],
      songName: song[0]?.name || "Unknown Song",
    },
  });
});

// PUT /:id - Update/archive a specific profile
anatomyProfilesRoutes.put(
  "/:id",
  zValidator("json", updateProfileSchema),
  async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const db = getDb();

    const existing = await db
      .select()
      .from(anatomyProfiles)
      .where(eq(anatomyProfiles.id, id))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: "Profile not found" }, 404);
    }

    const updated = await db
      .update(anatomyProfiles)
      .set({
        ...body,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(anatomyProfiles.id, id))
      .returning();

    return c.json({ data: updated[0] });
  }
);
