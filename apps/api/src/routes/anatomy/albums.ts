import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, like, and, desc, asc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "../../db/index.js";
import {
  anatomyAlbums,
  anatomySongs,
  anatomySongAlbums,
} from "../../db/schema/anatomy.js";
import {
  createAnatomyAlbumSchema,
  updateAnatomyAlbumSchema,
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

export const anatomyAlbumsRoutes = new Hono();

// GET / - List albums
anatomyAlbumsRoutes.get(
  "/",
  zValidator("query", listQuerySchema),
  async (c) => {
    const { q, search, page, pageSize, sort, order, archived } = c.req.valid("query");
    const db = getDb();
    const offset = (page - 1) * pageSize;
    const searchTerm = q || search;

    const conditions: ReturnType<typeof eq>[] = [];

    if (archived !== undefined) {
      conditions.push(eq(anatomyAlbums.archived, archived));
    }

    if (searchTerm) {
      conditions.push(like(anatomyAlbums.name, `%${searchTerm}%`));
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    let orderByColumn;
    switch (sort) {
      case "name":
        orderByColumn = anatomyAlbums.name;
        break;
      case "rating":
        orderByColumn = anatomyAlbums.rating;
        break;
      case "releaseDate":
        orderByColumn = anatomyAlbums.releaseDate;
        break;
      case "createdAt":
      default:
        orderByColumn = anatomyAlbums.createdAt;
    }
    const orderByDir = order === "asc" ? asc(orderByColumn) : desc(orderByColumn);

    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(anatomyAlbums)
        .where(whereClause)
        .orderBy(orderByDir)
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(anatomyAlbums)
        .where(whereClause),
    ]);

    // Batch fetch song counts for all albums
    const albumIds = data.map((a) => a.id);
    let songCountMap: Record<string, number> = {};
    if (albumIds.length > 0) {
      const counts = await db
        .select({
          albumId: anatomySongAlbums.albumId,
          count: sql<number>`count(*)`,
        })
        .from(anatomySongAlbums)
        .where(
          sql`${anatomySongAlbums.albumId} IN (${sql.join(
            albumIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        )
        .groupBy(anatomySongAlbums.albumId);

      for (const row of counts) {
        songCountMap[row.albumId] = row.count;
      }
    }

    const enrichedData = data.map((album) => ({
      ...album,
      songCount: songCountMap[album.id] || 0,
    }));

    return c.json({
      data: enrichedData,
      total: countResult[0].count,
      page,
      pageSize,
    });
  }
);

// POST / - Create album
anatomyAlbumsRoutes.post(
  "/",
  zValidator("json", createAnatomyAlbumSchema),
  async (c) => {
    const body = c.req.valid("json");
    const db = getDb();
    const id = nanoid();

    const album = await db
      .insert(anatomyAlbums)
      .values({
        id,
        ...body,
      })
      .returning();

    return c.json({ data: album[0] }, 201);
  }
);

// GET /:id - Get album with its songs
anatomyAlbumsRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const db = getDb();

  const album = await db
    .select()
    .from(anatomyAlbums)
    .where(eq(anatomyAlbums.id, id))
    .limit(1);

  if (album.length === 0) {
    return c.json({ error: "Album not found" }, 404);
  }

  // Get associated songs
  const songRows = await db
    .select({
      id: anatomySongs.id,
      name: anatomySongs.name,
      isrc: anatomySongs.isrc,
      releaseDate: anatomySongs.releaseDate,
      rating: anatomySongs.rating,
      archived: anatomySongs.archived,
    })
    .from(anatomySongAlbums)
    .innerJoin(anatomySongs, eq(anatomySongAlbums.songId, anatomySongs.id))
    .where(eq(anatomySongAlbums.albumId, id));

  return c.json({
    data: {
      ...album[0],
      songs: songRows,
    },
  });
});

// PUT /:id - Update album
anatomyAlbumsRoutes.put(
  "/:id",
  zValidator("json", updateAnatomyAlbumSchema),
  async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const db = getDb();

    const existing = await db
      .select()
      .from(anatomyAlbums)
      .where(eq(anatomyAlbums.id, id))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: "Album not found" }, 404);
    }

    const updated = await db
      .update(anatomyAlbums)
      .set({
        ...body,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(anatomyAlbums.id, id))
      .returning();

    return c.json({ data: updated[0] });
  }
);
