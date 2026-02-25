import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, like, and, desc, asc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "../../db/index.js";
import {
  anatomyArtists,
  anatomySongs,
  anatomySongArtists,
} from "../../db/schema/anatomy.js";
import {
  createAnatomyArtistSchema,
  updateAnatomyArtistSchema,
} from "../../validators/anatomy.js";

const listQuerySchema = z.object({
  q: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
  archived: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

export const anatomyArtistsRoutes = new Hono();

// GET / - List artists
anatomyArtistsRoutes.get(
  "/",
  zValidator("query", listQuerySchema),
  async (c) => {
    const { q, search, page, pageSize, sort, order, archived } = c.req.valid("query");
    const db = getDb();
    const offset = (page - 1) * pageSize;
    const searchTerm = q || search;

    const conditions: ReturnType<typeof eq>[] = [];

    if (archived !== undefined) {
      conditions.push(eq(anatomyArtists.archived, archived));
    }

    if (searchTerm) {
      conditions.push(like(anatomyArtists.name, `%${searchTerm}%`));
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    let orderByColumn;
    switch (sort) {
      case "name":
        orderByColumn = anatomyArtists.name;
        break;
      case "rating":
        orderByColumn = anatomyArtists.rating;
        break;
      case "createdAt":
      default:
        orderByColumn = anatomyArtists.createdAt;
    }
    const orderByDir = order === "asc" ? asc(orderByColumn) : desc(orderByColumn);

    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(anatomyArtists)
        .where(whereClause)
        .orderBy(orderByDir)
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(anatomyArtists)
        .where(whereClause),
    ]);

    // Batch fetch song counts for all artists
    const artistIds = data.map((a) => a.id);
    let songCountMap: Record<string, number> = {};
    if (artistIds.length > 0) {
      const counts = await db
        .select({
          artistId: anatomySongArtists.artistId,
          count: sql<number>`count(*)`,
        })
        .from(anatomySongArtists)
        .where(
          sql`${anatomySongArtists.artistId} IN (${sql.join(
            artistIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        )
        .groupBy(anatomySongArtists.artistId);

      for (const row of counts) {
        songCountMap[row.artistId] = row.count;
      }
    }

    const enrichedData = data.map((artist) => ({
      ...artist,
      songCount: songCountMap[artist.id] || 0,
    }));

    return c.json({
      data: enrichedData,
      total: countResult[0].count,
      page,
      pageSize,
    });
  }
);

// POST / - Create artist
anatomyArtistsRoutes.post(
  "/",
  zValidator("json", createAnatomyArtistSchema),
  async (c) => {
    const body = c.req.valid("json");
    const db = getDb();
    const id = nanoid();

    const artist = await db
      .insert(anatomyArtists)
      .values({
        id,
        ...body,
      })
      .returning();

    return c.json({ data: artist[0] }, 201);
  }
);

// GET /:id - Get artist with their songs
anatomyArtistsRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const db = getDb();

  const artist = await db
    .select()
    .from(anatomyArtists)
    .where(eq(anatomyArtists.id, id))
    .limit(1);

  if (artist.length === 0) {
    return c.json({ error: "Artist not found" }, 404);
  }

  // Get songs linked to this artist
  const songArtistLinks = await db
    .select()
    .from(anatomySongArtists)
    .where(eq(anatomySongArtists.artistId, id));

  let songs: (typeof anatomySongs.$inferSelect)[] = [];
  if (songArtistLinks.length > 0) {
    const songIds = songArtistLinks.map((sa) => sa.songId);
    songs = await db
      .select()
      .from(anatomySongs)
      .where(
        sql`${anatomySongs.id} IN (${sql.join(
          songIds.map((sid) => sql`${sid}`),
          sql`, `
        )})`
      );
  }

  return c.json({
    data: {
      ...artist[0],
      songs,
    },
  });
});

// PUT /:id - Update artist
anatomyArtistsRoutes.put(
  "/:id",
  zValidator("json", updateAnatomyArtistSchema),
  async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const db = getDb();

    const existing = await db
      .select()
      .from(anatomyArtists)
      .where(eq(anatomyArtists.id, id))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: "Artist not found" }, 404);
    }

    const updated = await db
      .update(anatomyArtists)
      .set({
        ...body,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(anatomyArtists.id, id))
      .returning();

    return c.json({ data: updated[0] });
  }
);
