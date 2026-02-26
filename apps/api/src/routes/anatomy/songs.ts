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
  anatomyAlbums,
  anatomySongAlbums,
} from "../../db/schema/anatomy.js";
import {
  createAnatomySongSchema,
  updateAnatomySongSchema,
  createProfileSchema,
  assignArtistSchema,
  assignAlbumSchema,
} from "../../validators/anatomy.js";

const isrcRegex = /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/;
const isniRegex = /^\d{15}[\dX]$/;

const listQuerySchema = z.object({
  q: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.string().default("releaseDate"),
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
    const { q, search, page, pageSize, sort, order, archived } =
      c.req.valid("query");
    const searchTerm = q || search;
    const db = getDb();
    const offset = (page - 1) * pageSize;

    const conditions: ReturnType<typeof eq>[] = [];

    if (archived !== undefined) {
      conditions.push(eq(anatomySongs.archived, archived));
    }

    if (searchTerm) {
      if (isrcRegex.test(searchTerm)) {
        // Search by ISRC
        conditions.push(eq(anatomySongs.isrc, searchTerm));
      } else if (isniRegex.test(searchTerm)) {
        // Search artists by ISNI, then find their songs
        const matchingArtists = await db
          .select({ id: anatomyArtists.id })
          .from(anatomyArtists)
          .where(eq(anatomyArtists.isni, searchTerm));

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
          .where(like(anatomyArtists.name, `%${searchTerm}%`));

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
            sql`(${like(anatomySongs.name, `%${searchTerm}%`)} OR ${anatomySongs.id} IN (${sql.join(
              artistSongIds.map((id) => sql`${id}`),
              sql`, `
            )}))`
          );
        } else {
          conditions.push(like(anatomySongs.name, `%${searchTerm}%`));
        }
      }
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    let orderByColumn;
    switch (sort) {
      case "name":
        orderByColumn = anatomySongs.name;
        break;
      case "rating":
        orderByColumn = anatomySongs.rating;
        break;
      case "createdAt":
        orderByColumn = anatomySongs.createdAt;
        break;
      case "releaseDate":
      default:
        orderByColumn = anatomySongs.releaseDate;
    }
    const orderBy = order === "asc" ? asc(orderByColumn) : desc(orderByColumn);

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

    // Fetch artists for all songs in one batch
    const songIds = data.map((s) => s.id);
    let artistMap: Record<string, { id: string; name: string }[]> = {};
    if (songIds.length > 0) {
      const songArtistRows = await db
        .select({
          songId: anatomySongArtists.songId,
          artistId: anatomyArtists.id,
          artistName: anatomyArtists.name,
        })
        .from(anatomySongArtists)
        .innerJoin(anatomyArtists, eq(anatomySongArtists.artistId, anatomyArtists.id))
        .where(
          sql`${anatomySongArtists.songId} IN (${sql.join(
            songIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        );

      for (const row of songArtistRows) {
        if (!artistMap[row.songId]) artistMap[row.songId] = [];
        artistMap[row.songId].push({ id: row.artistId, name: row.artistName });
      }
    }

    const enrichedData = data.map((song) => ({
      ...song,
      artists: artistMap[song.id] || [],
    }));

    return c.json({
      data: enrichedData,
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

  // Get albums linked to this song
  const songAlbumLinks = await db
    .select()
    .from(anatomySongAlbums)
    .where(eq(anatomySongAlbums.songId, id));

  let albums: {
    id: string;
    name: string;
    ean: string | null;
    releaseDate: string | null;
    rating: number;
    archived: boolean;
  }[] = [];
  if (songAlbumLinks.length > 0) {
    const albumIds = songAlbumLinks.map((sa) => sa.albumId);
    albums = await db
      .select({
        id: anatomyAlbums.id,
        name: anatomyAlbums.name,
        ean: anatomyAlbums.ean,
        releaseDate: anatomyAlbums.releaseDate,
        rating: anatomyAlbums.rating,
        archived: anatomyAlbums.archived,
      })
      .from(anatomyAlbums)
      .where(
        sql`${anatomyAlbums.id} IN (${sql.join(
          albumIds.map((aid) => sql`${aid}`),
          sql`, `
        )})`
      );
  }

  return c.json({
    data: {
      ...song[0],
      activeProfile: activeProfile[0] || null,
      artists,
      albums,
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

// POST /:id/artists - Assign artist to song
anatomySongsRoutes.post(
  "/:id/artists",
  zValidator("json", assignArtistSchema),
  async (c) => {
    const songId = c.req.param("id");
    const { artistId } = c.req.valid("json");
    const db = getDb();

    const song = await db
      .select()
      .from(anatomySongs)
      .where(eq(anatomySongs.id, songId))
      .limit(1);

    if (song.length === 0) {
      return c.json({ error: "Song not found" }, 404);
    }

    const artist = await db
      .select()
      .from(anatomyArtists)
      .where(eq(anatomyArtists.id, artistId))
      .limit(1);

    if (artist.length === 0) {
      return c.json({ error: "Artist not found" }, 404);
    }

    const existing = await db
      .select()
      .from(anatomySongArtists)
      .where(
        and(
          eq(anatomySongArtists.songId, songId),
          eq(anatomySongArtists.artistId, artistId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return c.json({ error: "Artist already assigned" }, 409);
    }

    const id = nanoid();
    const assignment = await db
      .insert(anatomySongArtists)
      .values({ id, songId, artistId })
      .returning();

    return c.json({ data: assignment[0] }, 201);
  }
);

// PUT /:id/artists/:artistId - Remove artist assignment
anatomySongsRoutes.put("/:id/artists/:artistId", async (c) => {
  const songId = c.req.param("id");
  const artistId = c.req.param("artistId");
  const db = getDb();

  const existing = await db
    .select()
    .from(anatomySongArtists)
    .where(
      and(
        eq(anatomySongArtists.songId, songId),
        eq(anatomySongArtists.artistId, artistId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    return c.json({ error: "Song-artist assignment not found" }, 404);
  }

  await db
    .delete(anatomySongArtists)
    .where(
      and(
        eq(anatomySongArtists.songId, songId),
        eq(anatomySongArtists.artistId, artistId)
      )
    );

  return c.json({ message: "Artist assignment removed" });
});

// POST /:id/albums - Assign album to song
anatomySongsRoutes.post(
  "/:id/albums",
  zValidator("json", assignAlbumSchema),
  async (c) => {
    const songId = c.req.param("id");
    const { albumId } = c.req.valid("json");
    const db = getDb();

    const song = await db
      .select()
      .from(anatomySongs)
      .where(eq(anatomySongs.id, songId))
      .limit(1);

    if (song.length === 0) {
      return c.json({ error: "Song not found" }, 404);
    }

    const album = await db
      .select()
      .from(anatomyAlbums)
      .where(eq(anatomyAlbums.id, albumId))
      .limit(1);

    if (album.length === 0) {
      return c.json({ error: "Album not found" }, 404);
    }

    const existing = await db
      .select()
      .from(anatomySongAlbums)
      .where(
        and(
          eq(anatomySongAlbums.songId, songId),
          eq(anatomySongAlbums.albumId, albumId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return c.json({ error: "Album already assigned" }, 409);
    }

    const id = nanoid();
    const assignment = await db
      .insert(anatomySongAlbums)
      .values({ id, songId, albumId })
      .returning();

    return c.json({ data: assignment[0] }, 201);
  }
);

// PUT /:id/albums/:albumId - Remove album assignment
anatomySongsRoutes.put("/:id/albums/:albumId", async (c) => {
  const songId = c.req.param("id");
  const albumId = c.req.param("albumId");
  const db = getDb();

  const existing = await db
    .select()
    .from(anatomySongAlbums)
    .where(
      and(
        eq(anatomySongAlbums.songId, songId),
        eq(anatomySongAlbums.albumId, albumId)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    return c.json({ error: "Song-album assignment not found" }, 404);
  }

  await db
    .delete(anatomySongAlbums)
    .where(
      and(
        eq(anatomySongAlbums.songId, songId),
        eq(anatomySongAlbums.albumId, albumId)
      )
    );

  return c.json({ message: "Album assignment removed" });
});
