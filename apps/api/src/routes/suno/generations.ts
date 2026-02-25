import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, like, and, desc, asc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getDb } from "../../db/index.js";
import {
  sunoGenerations,
  sunoGenerationPrompts,
  sunoPrompts,
} from "../../db/schema/suno-studio.js";
import { createGenerationSchema } from "../../validators/suno.js";

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  archived: z.coerce.boolean().optional(),
});

export const sunoGenerationsRoutes = new Hono();

// GET / - List generations with pagination
sunoGenerationsRoutes.get(
  "/",
  zValidator("query", listQuerySchema),
  async (c) => {
    const { page, pageSize, sort, order, search, archived } = c.req.valid("query");
    const db = getDb();

    const conditions = [];

    if (search) {
      conditions.push(like(sunoGenerations.sunoId, `%${search}%`));
    }

    if (archived !== undefined) {
      conditions.push(eq(sunoGenerations.archived, archived));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    let orderByColumn;
    switch (sort) {
      case "createdAt":
        orderByColumn = sunoGenerations.createdAt;
        break;
      default:
        orderByColumn = sunoGenerations.createdAt;
    }

    const orderByDir =
      order === "asc" ? asc(orderByColumn) : desc(orderByColumn);

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(sunoGenerations)
        .where(where)
        .orderBy(orderByDir)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db
        .select({ count: sql<number>`count(*)` })
        .from(sunoGenerations)
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

// POST / - Create generation (optional binSongId, sunoId)
sunoGenerationsRoutes.post(
  "/",
  zValidator("json", createGenerationSchema),
  async (c) => {
    const body = c.req.valid("json");
    const db = getDb();
    const id = nanoid();

    const [generation] = await db
      .insert(sunoGenerations)
      .values({ id, ...body })
      .returning();

    return c.json(generation, 201);
  }
);

// GET /:id - Get generation with its prompts
sunoGenerationsRoutes.get("/:id", async (c) => {
  const { id } = c.req.param();
  const db = getDb();

  const generation = await db
    .select()
    .from(sunoGenerations)
    .where(eq(sunoGenerations.id, id))
    .get();

  if (!generation) {
    return c.json({ error: "Generation not found" }, 404);
  }

  const prompts = await db
    .select({
      id: sunoPrompts.id,
      lyrics: sunoPrompts.lyrics,
      style: sunoPrompts.style,
      voiceGender: sunoPrompts.voiceGender,
      notes: sunoPrompts.notes,
      profileId: sunoPrompts.profileId,
      rating: sunoPrompts.rating,
      archived: sunoPrompts.archived,
      createdAt: sunoPrompts.createdAt,
      updatedAt: sunoPrompts.updatedAt,
      assignmentId: sunoGenerationPrompts.id,
      assignedAt: sunoGenerationPrompts.createdAt,
    })
    .from(sunoGenerationPrompts)
    .innerJoin(sunoPrompts, eq(sunoGenerationPrompts.promptId, sunoPrompts.id))
    .where(eq(sunoGenerationPrompts.generationId, id));

  return c.json({ ...generation, prompts });
});
