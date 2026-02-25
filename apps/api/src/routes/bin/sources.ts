import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, like, and, desc, asc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getDb } from "../../db/index.js";
import { binSources } from "../../db/schema/bin.js";
import {
  createBinSourceSchema,
  updateBinSourceSchema,
} from "../../validators/bin.js";

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  archived: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
});

export const binSourcesRoutes = new Hono();

// GET / - List sources
binSourcesRoutes.get(
  "/",
  zValidator("query", listQuerySchema),
  async (c) => {
    const { page, pageSize, sort, order, search, archived } =
      c.req.valid("query");
    const db = getDb();

    const conditions = [];

    if (search) {
      conditions.push(like(binSources.name, `%${search}%`));
    }

    if (archived !== undefined) {
      conditions.push(eq(binSources.archived, archived));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    let orderByColumn;
    switch (sort) {
      case "name":
        orderByColumn = binSources.name;
        break;
      case "createdAt":
        orderByColumn = binSources.createdAt;
        break;
      default:
        orderByColumn = binSources.createdAt;
    }

    const orderByDir =
      order === "asc" ? asc(orderByColumn) : desc(orderByColumn);

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(binSources)
        .where(where)
        .orderBy(orderByDir)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db
        .select({ count: sql<number>`count(*)` })
        .from(binSources)
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

// POST / - Create source
binSourcesRoutes.post(
  "/",
  zValidator("json", createBinSourceSchema),
  async (c) => {
    const body = c.req.valid("json");
    const db = getDb();
    const id = nanoid();

    const [source] = await db
      .insert(binSources)
      .values({ id, ...body })
      .returning();

    return c.json(source, 201);
  }
);

// PUT /:id - Update source (including archive)
binSourcesRoutes.put(
  "/:id",
  zValidator("json", updateBinSourceSchema),
  async (c) => {
    const { id } = c.req.param();
    const body = c.req.valid("json");
    const db = getDb();

    const existing = await db
      .select()
      .from(binSources)
      .where(eq(binSources.id, id))
      .get();

    if (!existing) {
      return c.json({ error: "Source not found" }, 404);
    }

    const [updated] = await db
      .update(binSources)
      .set({ ...body, updatedAt: new Date().toISOString() })
      .where(eq(binSources.id, id))
      .returning();

    return c.json(updated);
  }
);
