import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, like, and, desc, asc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getDb } from "../../db/index.js";
import { binSongs, binSources } from "../../db/schema/bin.js";
import {
  createBinSongSchema,
  updateBinSongSchema,
  importYoutubeSchema,
} from "../../validators/bin.js";

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  archived: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
  sourceId: z.string().optional(),
});

export const binSongsRoutes = new Hono();

// GET / - List songs with pagination, search by name, filter by archived, sort
binSongsRoutes.get(
  "/",
  zValidator("query", listQuerySchema),
  async (c) => {
    const { page, pageSize, sort, order, search, archived, sourceId } =
      c.req.valid("query");
    const db = getDb();

    const conditions = [];

    if (search) {
      conditions.push(like(binSongs.name, `%${search}%`));
    }

    if (archived !== undefined) {
      conditions.push(eq(binSongs.archived, archived));
    }

    if (sourceId) {
      conditions.push(eq(binSongs.sourceId, sourceId));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    let orderByColumn;
    switch (sort) {
      case "name":
        orderByColumn = binSongs.name;
        break;
      case "createdAt":
        orderByColumn = binSongs.createdAt;
        break;
      default:
        orderByColumn = binSongs.createdAt;
    }

    const orderByDir =
      order === "asc" ? asc(orderByColumn) : desc(orderByColumn);

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(binSongs)
        .where(where)
        .orderBy(orderByDir)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db
        .select({ count: sql<number>`count(*)` })
        .from(binSongs)
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

// POST / - Create bin song
binSongsRoutes.post(
  "/",
  zValidator("json", createBinSongSchema),
  async (c) => {
    const body = c.req.valid("json");
    const db = getDb();
    const id = nanoid();

    const [song] = await db
      .insert(binSongs)
      .values({ id, ...body })
      .returning();

    return c.json(song, 201);
  }
);

// GET /:id - Get song with source info
binSongsRoutes.get("/:id", async (c) => {
  const { id } = c.req.param();
  const db = getDb();

  const song = await db
    .select()
    .from(binSongs)
    .where(eq(binSongs.id, id))
    .get();

  if (!song) {
    return c.json({ error: "Song not found" }, 404);
  }

  let source = null;
  if (song.sourceId) {
    source = await db
      .select()
      .from(binSources)
      .where(eq(binSources.id, song.sourceId))
      .get();
  }

  return c.json({ ...song, source });
});

// PUT /:id - Update song (including archive)
binSongsRoutes.put(
  "/:id",
  zValidator("json", updateBinSongSchema),
  async (c) => {
    const { id } = c.req.param();
    const body = c.req.valid("json");
    const db = getDb();

    const existing = await db
      .select()
      .from(binSongs)
      .where(eq(binSongs.id, id))
      .get();

    if (!existing) {
      return c.json({ error: "Song not found" }, 404);
    }

    const [updated] = await db
      .update(binSongs)
      .set({ ...body, updatedAt: new Date().toISOString() })
      .where(eq(binSongs.id, id))
      .returning();

    return c.json(updated);
  }
);

// POST /import-youtube - Accept YouTube URL, validate, return placeholder
binSongsRoutes.post(
  "/import-youtube",
  zValidator("json", importYoutubeSchema),
  async (c) => {
    const { url } = c.req.valid("json");

    // Validate that it looks like a YouTube URL
    const youtubePattern =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)/;
    if (!youtubePattern.test(url)) {
      return c.json({ error: "URL does not appear to be a valid YouTube URL" }, 400);
    }

    return c.json(
      {
        message: "YouTube import acknowledged. Actual import will be implemented with a dedicated library.",
        url,
        status: "pending",
      },
      202
    );
  }
);
