import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, like, and, desc, asc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "../../db/index.js";
import { myAlbums, mySongAlbums, mySongs } from "../../db/schema/my-music.js";
import {
  createAlbumSchema,
  updateAlbumSchema,
  listQuerySchema,
} from "../../validators/my-music.js";

export const myMusicAlbumsRoutes = new Hono();

// GET / - List albums with pagination, search, filter, sort
myMusicAlbumsRoutes.get(
  "/",
  zValidator("query", listQuerySchema),
  async (c) => {
    const { page, pageSize, sort, order, search, archived } =
      c.req.valid("query");
    const db = getDb();

    const conditions = [];

    if (search) {
      conditions.push(like(myAlbums.name, `%${search}%`));
    }

    if (archived !== undefined) {
      conditions.push(eq(myAlbums.archived, archived));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Determine sort column
    let orderByColumn;
    switch (sort) {
      case "rating":
        orderByColumn = myAlbums.rating;
        break;
      case "name":
        orderByColumn = myAlbums.name;
        break;
      case "releaseDate":
        orderByColumn = myAlbums.releaseDate;
        break;
      case "createdAt":
        orderByColumn = myAlbums.createdAt;
        break;
      default:
        orderByColumn = myAlbums.createdAt;
    }

    const orderByDir = order === "asc" ? asc(orderByColumn) : desc(orderByColumn);

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(myAlbums)
        .where(where)
        .orderBy(orderByDir)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db
        .select({ count: sql<number>`count(*)` })
        .from(myAlbums)
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

// POST / - Create album
myMusicAlbumsRoutes.post(
  "/",
  zValidator("json", createAlbumSchema),
  async (c) => {
    const body = c.req.valid("json");
    const db = getDb();
    const id = nanoid();

    const [album] = await db
      .insert(myAlbums)
      .values({ id, ...body })
      .returning();

    return c.json(album, 201);
  }
);

// GET /:id - Get album with its songs
myMusicAlbumsRoutes.get("/:id", async (c) => {
  const { id } = c.req.param();
  const db = getDb();

  const album = await db
    .select()
    .from(myAlbums)
    .where(eq(myAlbums.id, id))
    .get();

  if (!album) {
    return c.json({ error: "Album not found" }, 404);
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
    .from(mySongAlbums)
    .innerJoin(mySongs, eq(mySongAlbums.songId, mySongs.id))
    .where(eq(mySongAlbums.albumId, id));

  return c.json({ ...album, songs });
});

// PUT /:id - Update album
myMusicAlbumsRoutes.put(
  "/:id",
  zValidator("json", updateAlbumSchema),
  async (c) => {
    const { id } = c.req.param();
    const body = c.req.valid("json");
    const db = getDb();

    const existing = await db
      .select()
      .from(myAlbums)
      .where(eq(myAlbums.id, id))
      .get();

    if (!existing) {
      return c.json({ error: "Album not found" }, 404);
    }

    const [updated] = await db
      .update(myAlbums)
      .set({ ...body, updatedAt: new Date().toISOString() })
      .where(eq(myAlbums.id, id))
      .returning();

    return c.json(updated);
  }
);
