import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, like, and, desc, asc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "../../db/index.js";
import {
  anatomySongs,
  anatomyArtists,
  anatomySongArtists,
  anatomyProfiles,
} from "../../db/schema/anatomy.js";
import {
  createAnatomySongSchema,
  updateAnatomySongSchema,
  createProfileSchema,
} from "../../validators/anatomy.js";

const isrcRegex = /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/;
const isniRegex = /^\d{15}[\dX]$/;

const listQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.enum(["releaseDate", "rating"]).default("releaseDate"),
  order: z.enum(["asc", "desc"]).default("desc"),
  archived: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

export const anatomySongsRoutes = new Hono();

// GET / - List songs with smart search
anatomySongsRoutes.get(
  "/",
  zValidator("query", listQuerySchema),
  async (c) => {
    const { q, page, pageSize, sort, order, archived } =
      c.req.valid("query");
    const db = getDb();
    const offset = (page - 1) * pageSize;

    const conditions: ReturnType<typeof eq>[] = [];

    if (archived !== undefined) {
      conditions.push(eq(anatomySongs.archived, archived));
    }

    if (q) {
      if (isrcRegex.test(q)) {
        // Search by ISRC
        conditions.push(eq(anatomySongs.isrc, q));
      } else if (isniRegex.test(q)) {
        // Search artists by ISNI, then find their songs
        const matchingArtists = await db
          .select({ id: anatomyArtists.id })
          .from(anatomyArtists)
          .where(eq(anatomyArtists.isni, q));

        if (matchingArtists.length > 0) {
          const artistIds = matchingArtists.map((a) => a.id);
          const songArtistLinks = await db
            .select({ songId: anatomySongArtists.songId })
            .from(anatomySongArtists)
            .where(
              sql`${anatomySongArtists.artistId} IN (${sql.join(
                artistIds.map((id) => sql`${id}`),
                sql`, `
              )})`
            );

          const songIds = songArtistLinks.map((sa) => sa.songId);
          if (songIds.length > 0) {
            conditions.push(
              sql`${anatomySongs.id} IN (${sql.join(
                songIds.map((id) => sql`${id}`),
                sql`, `
              )})`
            );
          } else {
            // No songs found for this ISNI - return empty
            return c.json({ data: [], total: 0, page, pageSize });
          }
        } else {
          return c.json({ data: [], total: 0, page, pageSize });
        }
      } else {
        // Search by song name or artist name
        const matchingArtists = await db
          .select({ id: anatomyArtists.id })
          .from(anatomyArtists)
          .where(like(anatomyArtists.name, `%${q}%`));

        const artistSongIds =
          matchingArtists.length > 0
            ? (
                await db
                  .select({ songId: anatomySongArtists.songId })
                  .from(anatomySongArtists)
                  .where(
                    sql`${anatomySongArtists.artistId} IN (${sql.join(
                      matchingArtists.map((a) => sql`${a.id}`),
                      sql`, `
                    )})`
                  )
              ).map((sa) => sa.songId)
            : [];

        if (artistSongIds.length > 0) {
          conditions.push(
            sql`(${like(anatomySongs.name, `%${q}%`)} OR ${anatomySongs.id} IN (${sql.join(
              artistSongIds.map((id) => sql`${id}`),
              sql`, `
            )}))`
          );
        } else {
          conditions.push(like(anatomySongs.name, `%${q}%`));
        }
      }
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const orderBy =
      sort === "rating"
        ? order === "asc"
          ? asc(anatomySongs.rating)
          : desc(anatomySongs.rating)
        : order === "asc"
          ? asc(anatomySongs.releaseDate)
          : desc(anatomySongs.releaseDate);

    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(anatomySongs)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(anatomySongs)
        .where(whereClause),
    ]);

    return c.json({
      data,
      total: countResult[0].count,
      page,
      pageSize,
    });
  }
);

// POST / - Create song
anatomySongsRoutes.post(
  "/",
  zValidator("json", createAnatomySongSchema),
  async (c) => {
    const body = c.req.valid("json");
    const db = getDb();
    const id = nanoid();

    const song = await db
      .insert(anatomySongs)
      .values({
        id,
        ...body,
      })
      .returning();

    return c.json({ data: song[0] }, 201);
  }
);

// GET /:id - Get song with active profile and artists
anatomySongsRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const db = getDb();

  const song = await db
    .select()
    .from(anatomySongs)
    .where(eq(anatomySongs.id, id))
    .limit(1);

  if (song.length === 0) {
    return c.json({ error: "Song not found" }, 404);
  }

  // Get active profile (latest non-archived by createdAt)
  const activeProfile = await db
    .select()
    .from(anatomyProfiles)
    .where(
      and(
        eq(anatomyProfiles.songId, id),
        eq(anatomyProfiles.archived, false)
      )
    )
    .orderBy(desc(anatomyProfiles.createdAt))
    .limit(1);

  // Get artists linked to this song
  const songArtistLinks = await db
    .select()
    .from(anatomySongArtists)
    .where(eq(anatomySongArtists.songId, id));

  let artists: (typeof anatomyArtists.$inferSelect)[] = [];
  if (songArtistLinks.length > 0) {
    const artistIds = songArtistLinks.map((sa) => sa.artistId);
    artists = await db
      .select()
      .from(anatomyArtists)
      .where(
        sql`${anatomyArtists.id} IN (${sql.join(
          artistIds.map((aid) => sql`${aid}`),
          sql`, `
        )})`
      );
  }

  return c.json({
    data: {
      ...song[0],
      activeProfile: activeProfile[0] || null,
      artists,
    },
  });
});

// PUT /:id - Update song
anatomySongsRoutes.put(
  "/:id",
  zValidator("json", updateAnatomySongSchema),
  async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const db = getDb();

    const existing = await db
      .select()
      .from(anatomySongs)
      .where(eq(anatomySongs.id, id))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: "Song not found" }, 404);
    }

    const updated = await db
      .update(anatomySongs)
      .set({
        ...body,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(anatomySongs.id, id))
      .returning();

    return c.json({ data: updated[0] });
  }
);

// GET /:id/profiles - List all profiles for this song
anatomySongsRoutes.get("/:id/profiles", async (c) => {
  const id = c.req.param("id");
  const db = getDb();

  const song = await db
    .select()
    .from(anatomySongs)
    .where(eq(anatomySongs.id, id))
    .limit(1);

  if (song.length === 0) {
    return c.json({ error: "Song not found" }, 404);
  }

  const profiles = await db
    .select()
    .from(anatomyProfiles)
    .where(eq(anatomyProfiles.songId, id))
    .orderBy(desc(anatomyProfiles.createdAt));

  return c.json({
    data: profiles,
    total: profiles.length,
    page: 1,
    pageSize: profiles.length,
  });
});

// POST /:id/profiles - Create new profile version
anatomySongsRoutes.post(
  "/:id/profiles",
  zValidator("json", createProfileSchema),
  async (c) => {
    const songId = c.req.param("id");
    const body = c.req.valid("json");
    const db = getDb();

    const song = await db
      .select()
      .from(anatomySongs)
      .where(eq(anatomySongs.id, songId))
      .limit(1);

    if (song.length === 0) {
      return c.json({ error: "Song not found" }, 404);
    }

    const id = nanoid();

    const profile = await db
      .insert(anatomyProfiles)
      .values({
        id,
        songId,
        value: body.value,
      })
      .returning();

    return c.json({ data: profile[0] }, 201);
  }
);
