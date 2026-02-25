import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, like, and, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "../../db/index.js";
import { anatomyAttributes } from "../../db/schema/anatomy.js";
import {
  createAttributeSchema,
  updateAttributeSchema,
} from "../../validators/anatomy.js";

const listQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  archived: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

export const anatomyAttributesRoutes = new Hono();

// GET / - List all profile attribute definitions
anatomyAttributesRoutes.get(
  "/",
  zValidator("query", listQuerySchema),
  async (c) => {
    const { q, page, pageSize, archived } = c.req.valid("query");
    const db = getDb();
    const offset = (page - 1) * pageSize;

    const conditions: ReturnType<typeof eq>[] = [];

    if (archived !== undefined) {
      conditions.push(eq(anatomyAttributes.archived, archived));
    }

    if (q) {
      conditions.push(like(anatomyAttributes.name, `%${q}%`));
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(anatomyAttributes)
        .where(whereClause)
        .orderBy(desc(anatomyAttributes.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(anatomyAttributes)
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

// POST / - Create attribute
anatomyAttributesRoutes.post(
  "/",
  zValidator("json", createAttributeSchema),
  async (c) => {
    const body = c.req.valid("json");
    const db = getDb();
    const id = nanoid();

    const attribute = await db
      .insert(anatomyAttributes)
      .values({
        id,
        ...body,
      })
      .returning();

    return c.json({ data: attribute[0] }, 201);
  }
);

// GET /:id - Get attribute
anatomyAttributesRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const db = getDb();

  const attribute = await db
    .select()
    .from(anatomyAttributes)
    .where(eq(anatomyAttributes.id, id))
    .limit(1);

  if (attribute.length === 0) {
    return c.json({ error: "Attribute not found" }, 404);
  }

  return c.json({ data: attribute[0] });
});

// PUT /:id - Update attribute (including archive)
anatomyAttributesRoutes.put(
  "/:id",
  zValidator("json", updateAttributeSchema),
  async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const db = getDb();

    const existing = await db
      .select()
      .from(anatomyAttributes)
      .where(eq(anatomyAttributes.id, id))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: "Attribute not found" }, 404);
    }

    const updated = await db
      .update(anatomyAttributes)
      .set({
        ...body,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(anatomyAttributes.id, id))
      .returning();

    return c.json({ data: updated[0] });
  }
);
