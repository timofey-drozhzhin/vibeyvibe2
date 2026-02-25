import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, like, and, desc, asc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "../../db/index.js";
import {
  mySongs,
  myArtists,
  myAlbums,
  mySongArtists,
  mySongAlbums,
} from "../../db/schema/my-music.js";
import {
  createSongSchema,
  updateSongSchema,
  assignArtistSchema,
  assignAlbumSchema,
  listQuerySchema,
} from "../../validators/my-music.js";

export const myMusicSongsRoutes = new Hono();

// GET / - List songs with pagination, search, filter, sort
myMusicSongsRoutes.get(
  "/",
  zValidator("query", listQuerySchema),
  async (c) => {
    const { page, pageSize, sort, order, search, archived } =
      c.req.valid("query");
    const db = getDb();

    const conditions = [];

    if (search) {
      conditions.push(like(mySongs.name, `%${search}%`));
    }

    if (archived !== undefined) {
      conditions.push(eq(mySongs.archived, archived));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort column
    let orderByColumn;
    switch (sort) {
      case "rating":
        orderByColumn = mySongs.rating;
        break;
      case "releaseDate":
        orderByColumn = mySongs.releaseDate;
        break;
      case "name":
        orderByColumn = mySongs.name;
        break;
      case "createdAt":
        orderByColumn = mySongs.createdAt;
        break;
      default:
        orderByColumn = mySongs.createdAt;
    }

    const orderByDir = order === "asc" ? asc(orderByColumn) : desc(orderByColumn);

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(mySongs)
        .where(where)
        .orderBy(orderByDir)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db
        .select({ count: sql<number>`count(*)` })
        .from(mySongs)
        .where(where),
    ]);

    // Fetch artists for all songs in one batch
    const songIds = data.map((s) => s.id);
    let artistMap: Record<string, { id: string; name: string }[]> = {};
    if (songIds.length > 0) {
      const songArtistRows = await db
        .select({
          songId: mySongArtists.songId,
          artistId: myArtists.id,
          artistName: myArtists.name,
        })
        .from(mySongArtists)
        .innerJoin(myArtists, eq(mySongArtists.artistId, myArtists.id))
        .where(
          sql`${mySongArtists.songId} IN (${sql.join(
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
      total: totalResult[0].count,
      page,
      pageSize,
    });
  }
);

// POST / - Create song
myMusicSongsRoutes.post(
  "/",
  zValidator("json", createSongSchema),
  async (c) => {
    const body = c.req.valid("json");
    const db = getDb();
    const id = nanoid();

    const [song] = await db
      .insert(mySongs)
      .values({ id, ...body })
      .returning();

    return c.json(song, 201);
  }
);

// GET /:id - Get song with its artists and albums
myMusicSongsRoutes.get("/:id", async (c) => {
  const { id } = c.req.param();
  const db = getDb();

  const song = await db
    .select()
    .from(mySongs)
    .where(eq(mySongs.id, id))
    .get();

  if (!song) {
    return c.json({ error: "Song not found" }, 404);
  }

  const [artists, albums] = await Promise.all([
    db
      .select({
        id: myArtists.id,
        name: myArtists.name,
        isni: myArtists.isni,
        imagePath: myArtists.imagePath,
        rating: myArtists.rating,
        archived: myArtists.archived,
        spotifyId: myArtists.spotifyId,
        youtubeUsername: myArtists.youtubeUsername,
        tiktokUsername: myArtists.tiktokUsername,
        instagramUsername: myArtists.instagramUsername,
        createdAt: myArtists.createdAt,
        updatedAt: myArtists.updatedAt,
      })
      .from(mySongArtists)
      .innerJoin(myArtists, eq(mySongArtists.artistId, myArtists.id))
      .where(eq(mySongArtists.songId, id)),
    db
      .select({
        id: myAlbums.id,
        name: myAlbums.name,
        ean: myAlbums.ean,
        releaseDate: myAlbums.releaseDate,
        rating: myAlbums.rating,
        archived: myAlbums.archived,
        spotifyId: myAlbums.spotifyId,
        appleMusicId: myAlbums.appleMusicId,
        youtubeId: myAlbums.youtubeId,
        createdAt: myAlbums.createdAt,
        updatedAt: myAlbums.updatedAt,
      })
      .from(mySongAlbums)
      .innerJoin(myAlbums, eq(mySongAlbums.albumId, myAlbums.id))
      .where(eq(mySongAlbums.songId, id)),
  ]);

  return c.json({ ...song, artists, albums });
});

// PUT /:id - Update song
myMusicSongsRoutes.put(
  "/:id",
  zValidator("json", updateSongSchema),
  async (c) => {
    const { id } = c.req.param();
    const body = c.req.valid("json");
    const db = getDb();

    const existing = await db
      .select()
      .from(mySongs)
      .where(eq(mySongs.id, id))
      .get();

    if (!existing) {
      return c.json({ error: "Song not found" }, 404);
    }

    const [updated] = await db
      .update(mySongs)
      .set({ ...body, updatedAt: new Date().toISOString() })
      .where(eq(mySongs.id, id))
      .returning();

    return c.json(updated);
  }
);

// POST /:id/artists - Assign artist to song
myMusicSongsRoutes.post(
  "/:id/artists",
  zValidator("json", assignArtistSchema),
  async (c) => {
    const { id: songId } = c.req.param();
    const { artistId } = c.req.valid("json");
    const db = getDb();

    // Verify song exists
    const song = await db
      .select()
      .from(mySongs)
      .where(eq(mySongs.id, songId))
      .get();

    if (!song) {
      return c.json({ error: "Song not found" }, 404);
    }

    // Verify artist exists
    const artist = await db
      .select()
      .from(myArtists)
      .where(eq(myArtists.id, artistId))
      .get();

    if (!artist) {
      return c.json({ error: "Artist not found" }, 404);
    }

    const id = nanoid();
    const [assignment] = await db
      .insert(mySongArtists)
      .values({ id, songId, artistId })
      .returning();

    return c.json(assignment, 201);
  }
);

// PUT /:id/artists/:artistId - Archive (remove) artist assignment
myMusicSongsRoutes.put("/:id/artists/:artistId", async (c) => {
  const { id: songId, artistId } = c.req.param();
  const db = getDb();

  const existing = await db
    .select()
    .from(mySongArtists)
    .where(
      and(
        eq(mySongArtists.songId, songId),
        eq(mySongArtists.artistId, artistId)
      )
    )
    .get();

  if (!existing) {
    return c.json({ error: "Song-artist assignment not found" }, 404);
  }

  // Join tables have no archived column, so we delete the assignment
  // This is the only removal operation and is scoped to join records only
  await db
    .delete(mySongArtists)
    .where(
      and(
        eq(mySongArtists.songId, songId),
        eq(mySongArtists.artistId, artistId)
      )
    );

  return c.json({ message: "Artist assignment removed" });
});

// POST /:id/albums - Assign song to album
myMusicSongsRoutes.post(
  "/:id/albums",
  zValidator("json", assignAlbumSchema),
  async (c) => {
    const { id: songId } = c.req.param();
    const { albumId } = c.req.valid("json");
    const db = getDb();

    // Verify song exists
    const song = await db
      .select()
      .from(mySongs)
      .where(eq(mySongs.id, songId))
      .get();

    if (!song) {
      return c.json({ error: "Song not found" }, 404);
    }

    // Verify album exists
    const album = await db
      .select()
      .from(myAlbums)
      .where(eq(myAlbums.id, albumId))
      .get();

    if (!album) {
      return c.json({ error: "Album not found" }, 404);
    }

    const id = nanoid();
    const [assignment] = await db
      .insert(mySongAlbums)
      .values({ id, songId, albumId })
      .returning();

    return c.json(assignment, 201);
  }
);

// PUT /:id/albums/:albumId - Archive (remove) album assignment
myMusicSongsRoutes.put("/:id/albums/:albumId", async (c) => {
  const { id: songId, albumId } = c.req.param();
  const db = getDb();

  const existing = await db
    .select()
    .from(mySongAlbums)
    .where(
      and(
        eq(mySongAlbums.songId, songId),
        eq(mySongAlbums.albumId, albumId)
      )
    )
    .get();

  if (!existing) {
    return c.json({ error: "Song-album assignment not found" }, 404);
  }

  // Join tables have no archived column, so we delete the assignment
  // This is the only removal operation and is scoped to join records only
  await db
    .delete(mySongAlbums)
    .where(
      and(
        eq(mySongAlbums.songId, songId),
        eq(mySongAlbums.albumId, albumId)
      )
    );

  return c.json({ message: "Album assignment removed" });
});
