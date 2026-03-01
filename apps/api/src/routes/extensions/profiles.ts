import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "../../db/index.js";
import { profiles } from "../../db/schema/index.js";

const profileRoutes = new Hono();

const updateSchema = z.object({
  archived: z.boolean().optional(),
  value: z.string().optional(),
});

// ---------------------------------------------------------------------------
// PUT /:id — Update a profile (archive/restore)
// ---------------------------------------------------------------------------

profileRoutes.put(
  "/:id",
  zValidator("json", updateSchema),
  async (c) => {
    const id = Number(c.req.param("id"));
    if (!id || id < 1) {
      return c.json({ error: "Invalid profile ID" }, 400);
    }

    const body = c.req.valid("json");
    const db = getDb();

    const [existing] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, id))
      .limit(1);

    if (!existing) {
      return c.json({ error: "Profile not found" }, 404);
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (body.archived !== undefined) updates.archived = body.archived;
    if (body.value !== undefined) updates.value = body.value;

    await db
      .update(profiles)
      .set(updates)
      .where(eq(profiles.id, id));

    return c.json({ data: { id, ...updates } });
  },
);

export default profileRoutes;
