import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { getDb } from "../../db/index.js";
import { likes } from "../../db/schema/index.js";

const likeRoutes = new Hono();

const toggleSchema = z.object({
  entity: z.string().min(1),
  entityId: z.number().int().positive(),
});

const listQuerySchema = z.object({
  entity: z.string().min(1),
});

// POST /toggle — toggle a like
likeRoutes.post("/toggle", zValidator("json", toggleSchema), async (c) => {
  const { entity, entityId } = c.req.valid("json");
  const user = c.get("user" as never) as { id: string } | null;
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const db = getDb();
  const existing = await db
    .select()
    .from(likes)
    .where(
      and(
        eq(likes.user_id, user.id),
        eq(likes.entity, entity),
        eq(likes.entity_id, entityId),
      ),
    )
    .get();

  if (existing) {
    await db
      .delete(likes)
      .where(
        and(
          eq(likes.user_id, user.id),
          eq(likes.entity, entity),
          eq(likes.entity_id, entityId),
        ),
      );
    return c.json({ data: { liked: false } });
  }

  await db.insert(likes).values({
    user_id: user.id,
    entity,
    entity_id: entityId,
  });
  return c.json({ data: { liked: true } });
});

// GET / — get liked entity IDs for current user
likeRoutes.get("/", zValidator("query", listQuerySchema), async (c) => {
  const { entity } = c.req.valid("query");
  const user = c.get("user" as never) as { id: string } | null;
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const db = getDb();
  const rows = await db
    .select({ entity_id: likes.entity_id })
    .from(likes)
    .where(and(eq(likes.user_id, user.id), eq(likes.entity, entity)));

  return c.json({ data: rows.map((r) => r.entity_id) });
});

export default likeRoutes;
