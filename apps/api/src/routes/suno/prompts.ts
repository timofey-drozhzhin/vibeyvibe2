import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, like, and, or, desc, asc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getDb } from "../../db/index.js";
import { sunoPrompts } from "../../db/schema/suno-studio.js";
import { anatomyProfiles } from "../../db/schema/anatomy.js";
import {
  createPromptSchema,
  updatePromptSchema,
} from "../../validators/suno.js";

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  archived: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
  voiceGender: z.enum(["male", "female", "neutral"]).optional(),
});

export const sunoPromptsRoutes = new Hono();

// GET / - List prompts with pagination, search by lyrics/style, filter by archived, sort by rating
sunoPromptsRoutes.get(
  "/",
  zValidator("query", listQuerySchema),
  async (c) => {
    const { page, pageSize, sort, order, search, archived, voiceGender } =
      c.req.valid("query");
    const db = getDb();

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(sunoPrompts.lyrics, `%${search}%`),
          like(sunoPrompts.style, `%${search}%`)
        )
      );
    }

    if (archived !== undefined) {
      conditions.push(eq(sunoPrompts.archived, archived));
    }

    if (voiceGender) {
      conditions.push(eq(sunoPrompts.voiceGender, voiceGender));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    let orderByColumn;
    switch (sort) {
      case "rating":
        orderByColumn = sunoPrompts.rating;
        break;
      case "style":
        orderByColumn = sunoPrompts.style;
        break;
      case "createdAt":
        orderByColumn = sunoPrompts.createdAt;
        break;
      default:
        orderByColumn = sunoPrompts.createdAt;
    }

    const orderByDir =
      order === "asc" ? asc(orderByColumn) : desc(orderByColumn);

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(sunoPrompts)
        .where(where)
        .orderBy(orderByDir)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db
        .select({ count: sql<number>`count(*)` })
        .from(sunoPrompts)
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

// POST / - Create prompt (optional profileId links to anatomy_profiles)
sunoPromptsRoutes.post(
  "/",
  zValidator("json", createPromptSchema),
  async (c) => {
    const body = c.req.valid("json");
    const db = getDb();
    const id = nanoid();

    // Validate profileId if provided
    if (body.profileId) {
      const profile = await db
        .select()
        .from(anatomyProfiles)
        .where(eq(anatomyProfiles.id, body.profileId))
        .get();

      if (!profile) {
        return c.json({ error: "Anatomy profile not found" }, 400);
      }
    }

    const [prompt] = await db
      .insert(sunoPrompts)
      .values({ id, ...body })
      .returning();

    return c.json(prompt, 201);
  }
);

// GET /:id - Get prompt (with profile info if linked)
sunoPromptsRoutes.get("/:id", async (c) => {
  const { id } = c.req.param();
  const db = getDb();

  const prompt = await db
    .select()
    .from(sunoPrompts)
    .where(eq(sunoPrompts.id, id))
    .get();

  if (!prompt) {
    return c.json({ error: "Prompt not found" }, 404);
  }

  let profile = null;
  if (prompt.profileId) {
    profile = await db
      .select()
      .from(anatomyProfiles)
      .where(eq(anatomyProfiles.id, prompt.profileId))
      .get();
  }

  return c.json({ ...prompt, profile });
});

// PUT /:id - Update prompt (including archive)
sunoPromptsRoutes.put(
  "/:id",
  zValidator("json", updatePromptSchema),
  async (c) => {
    const { id } = c.req.param();
    const body = c.req.valid("json");
    const db = getDb();

    const existing = await db
      .select()
      .from(sunoPrompts)
      .where(eq(sunoPrompts.id, id))
      .get();

    if (!existing) {
      return c.json({ error: "Prompt not found" }, 404);
    }

    // Validate profileId if being updated
    if (body.profileId) {
      const profile = await db
        .select()
        .from(anatomyProfiles)
        .where(eq(anatomyProfiles.id, body.profileId))
        .get();

      if (!profile) {
        return c.json({ error: "Anatomy profile not found" }, 400);
      }
    }

    const [updated] = await db
      .update(sunoPrompts)
      .set({ ...body, updatedAt: new Date().toISOString() })
      .where(eq(sunoPrompts.id, id))
      .returning();

    return c.json(updated);
  }
);
