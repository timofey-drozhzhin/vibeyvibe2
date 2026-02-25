import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, like, and, desc, asc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getDb } from "../../db/index.js";
import {
  sunoCollections,
  sunoCollectionPrompts,
  sunoPrompts,
} from "../../db/schema/suno-studio.js";
import {
  createCollectionSchema,
  updateCollectionSchema,
  assignPromptSchema,
} from "../../validators/suno.js";

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  archived: z.coerce.boolean().optional(),
});

export const sunoCollectionsRoutes = new Hono();

// GET / - List collections
sunoCollectionsRoutes.get(
  "/",
  zValidator("query", listQuerySchema),
  async (c) => {
    const { page, pageSize, sort, order, search, archived } = c.req.valid("query");
    const db = getDb();

    const conditions = [];

    if (search) {
      conditions.push(like(sunoCollections.name, `%${search}%`));
    }

    if (archived !== undefined) {
      conditions.push(eq(sunoCollections.archived, archived));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    let orderByColumn;
    switch (sort) {
      case "name":
        orderByColumn = sunoCollections.name;
        break;
      case "createdAt":
        orderByColumn = sunoCollections.createdAt;
        break;
      default:
        orderByColumn = sunoCollections.createdAt;
    }

    const orderByDir =
      order === "asc" ? asc(orderByColumn) : desc(orderByColumn);

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(sunoCollections)
        .where(where)
        .orderBy(orderByDir)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db
        .select({ count: sql<number>`count(*)` })
        .from(sunoCollections)
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

// POST / - Create collection
sunoCollectionsRoutes.post(
  "/",
  zValidator("json", createCollectionSchema),
  async (c) => {
    const body = c.req.valid("json");
    const db = getDb();
    const id = nanoid();

    const [collection] = await db
      .insert(sunoCollections)
      .values({ id, ...body })
      .returning();

    return c.json(collection, 201);
  }
);

// GET /:id - Get collection with its prompts (via suno_collection_prompts join)
sunoCollectionsRoutes.get("/:id", async (c) => {
  const { id } = c.req.param();
  const db = getDb();

  const collection = await db
    .select()
    .from(sunoCollections)
    .where(eq(sunoCollections.id, id))
    .get();

  if (!collection) {
    return c.json({ error: "Collection not found" }, 404);
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
      assignmentId: sunoCollectionPrompts.id,
      assignedAt: sunoCollectionPrompts.createdAt,
    })
    .from(sunoCollectionPrompts)
    .innerJoin(sunoPrompts, eq(sunoCollectionPrompts.promptId, sunoPrompts.id))
    .where(eq(sunoCollectionPrompts.collectionId, id));

  return c.json({ ...collection, prompts });
});

// PUT /:id - Update collection
sunoCollectionsRoutes.put(
  "/:id",
  zValidator("json", updateCollectionSchema),
  async (c) => {
    const { id } = c.req.param();
    const body = c.req.valid("json");
    const db = getDb();

    const existing = await db
      .select()
      .from(sunoCollections)
      .where(eq(sunoCollections.id, id))
      .get();

    if (!existing) {
      return c.json({ error: "Collection not found" }, 404);
    }

    const [updated] = await db
      .update(sunoCollections)
      .set({ ...body, updatedAt: new Date().toISOString() })
      .where(eq(sunoCollections.id, id))
      .returning();

    return c.json(updated);
  }
);

// POST /:id/prompts - Add prompt to collection
sunoCollectionsRoutes.post(
  "/:id/prompts",
  zValidator("json", assignPromptSchema),
  async (c) => {
    const { id } = c.req.param();
    const { promptId } = c.req.valid("json");
    const db = getDb();

    // Verify collection exists
    const collection = await db
      .select()
      .from(sunoCollections)
      .where(eq(sunoCollections.id, id))
      .get();

    if (!collection) {
      return c.json({ error: "Collection not found" }, 404);
    }

    // Verify prompt exists
    const prompt = await db
      .select()
      .from(sunoPrompts)
      .where(eq(sunoPrompts.id, promptId))
      .get();

    if (!prompt) {
      return c.json({ error: "Prompt not found" }, 404);
    }

    // Check if assignment already exists
    const existing = await db
      .select()
      .from(sunoCollectionPrompts)
      .where(
        and(
          eq(sunoCollectionPrompts.collectionId, id),
          eq(sunoCollectionPrompts.promptId, promptId)
        )
      )
      .get();

    if (existing) {
      return c.json({ error: "Prompt is already assigned to this collection" }, 409);
    }

    const assignmentId = nanoid();
    const [assignment] = await db
      .insert(sunoCollectionPrompts)
      .values({ id: assignmentId, collectionId: id, promptId })
      .returning();

    return c.json(assignment, 201);
  }
);

// PUT /:id/prompts/:promptId - Archive the collection-prompt assignment
sunoCollectionsRoutes.put("/:id/prompts/:promptId", async (c) => {
  const { id, promptId } = c.req.param();
  const db = getDb();

  // Verify the assignment exists
  const existing = await db
    .select()
    .from(sunoCollectionPrompts)
    .where(
      and(
        eq(sunoCollectionPrompts.collectionId, id),
        eq(sunoCollectionPrompts.promptId, promptId)
      )
    )
    .get();

  if (!existing) {
    return c.json({ error: "Collection-prompt assignment not found" }, 404);
  }

  // The join table does not have an archived column.
  // Acknowledging the route exists; archival of assignments
  // will be supported in a future enhancement.
  return c.json({
    message: "Assignment acknowledged. Archive support for join table entries will be added in a future enhancement.",
    assignment: existing,
  });
});
