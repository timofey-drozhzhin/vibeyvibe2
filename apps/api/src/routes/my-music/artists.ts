import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, like, and, desc, asc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "../../db/index.js";
import { myArtists, mySongArtists, mySongs } from "../../db/schema/my-music.js";
import {
  createArtistSchema,
  updateArtistSchema,
  listQuerySchema,
} from "../../validators/my-music.js";

export const myMusicArtistsRoutes = new Hono();

// GET / - List artists with pagination, search, filter, sort
myMusicArtistsRoutes.get(
  "/",
  zValidator("query", listQuerySchema),
  async (c) => {
    const { page, pageSize, sort, order, search, archived } =
      c.req.valid("query");
    const db = getDb();

    const conditions = [];

    if (search) {
      conditions.push(like(myArtists.name, `%${search}%`));
    }

    if (archived !== undefined) {
      conditions.push(eq(myArtists.archived, archived));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort column
    let orderByColumn;
    switch (sort) {
      case "rating":
        orderByColumn = myArtists.rating;
        break;
      case "name":
        orderByColumn = myArtists.name;
        break;
      case "createdAt":
        orderByColumn = myArtists.createdAt;
        break;
      default:
        orderByColumn = myArtists.createdAt;
    }

    const orderByDir = order === "asc" ? asc(orderByColumn) : desc(orderByColumn);

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(myArtists)
        .where(where)
        .orderBy(orderByDir)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db
        .select({ count: sql<number>`count(*)` })
        .from(myArtists)
        .where(where),
    ]);

    return c.json({
      data,
      total: totalResult[0].count,
      page,
      pageSize,
    });
  }
);

// POST / - Create artist
myMusicArtistsRoutes.post(
  "/",
  zValidator("json", createArtistSchema),
  async (c) => {
    const body = c.req.valid("json");
    const db = getDb();
    const id = nanoid();

    const [artist] = await db
      .insert(myArtists)
      .values({ id, ...body })
      .returning();

    return c.json(artist, 201);
  }
);

// GET /:id - Get single artist with their songs
myMusicArtistsRoutes.get("/:id", async (c) => {
  const { id } = c.req.param();
  const db = getDb();

  const artist = await db
    .select()
    .from(myArtists)
    .where(eq(myArtists.id, id))
    .get();

  if (!artist) {
    return c.json({ error: "Artist not found" }, 404);
  }

  const songs = await db
    .select({
      id: mySongs.id,
      name: mySongs.name,
      isrc: mySongs.isrc,
      imagePath: mySongs.imagePath,
      releaseDate: mySongs.releaseDate,
      rating: mySongs.rating,
      archived: mySongs.archived,
      spotifyId: mySongs.spotifyId,
      appleMusicId: mySongs.appleMusicId,
      youtubeId: mySongs.youtubeId,
      createdAt: mySongs.createdAt,
      updatedAt: mySongs.updatedAt,
    })
    .from(mySongArtists)
    .innerJoin(mySongs, eq(mySongArtists.songId, mySongs.id))
    .where(eq(mySongArtists.artistId, id));

  return c.json({ ...artist, songs });
});

// PUT /:id - Update artist
myMusicArtistsRoutes.put(
  "/:id",
  zValidator("json", updateArtistSchema),
  async (c) => {
    const { id } = c.req.param();
    const body = c.req.valid("json");
    const db = getDb();

    const existing = await db
      .select()
      .from(myArtists)
      .where(eq(myArtists.id, id))
      .get();

    if (!existing) {
      return c.json({ error: "Artist not found" }, 404);
    }

    const [updated] = await db
      .update(myArtists)
      .set({ ...body, updatedAt: new Date().toISOString() })
      .where(eq(myArtists.id, id))
      .returning();

    return c.json(updated);
  }
);
