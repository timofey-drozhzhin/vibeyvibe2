import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "../../db/index.js";
import { profiles } from "../../db/schema/index.js";

const profileRoutes = new Hono();

const updateSchema = z.object({
  archived: z.boolean(),
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

    await db
      .update(profiles)
      .set({ archived: body.archived })
      .where(eq(profiles.id, id));

    return c.json({ data: { id, archived: body.archived } });
  },
);

export default profileRoutes;
