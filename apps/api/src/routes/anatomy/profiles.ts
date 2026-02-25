import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { getDb } from "../../db/index.js";
import { anatomyProfiles } from "../../db/schema/anatomy.js";
import { updateProfileSchema } from "../../validators/anatomy.js";

export const anatomyProfilesRoutes = new Hono();

// PUT /:id - Update/archive a specific profile
anatomyProfilesRoutes.put(
  "/:id",
  zValidator("json", updateProfileSchema),
  async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");
    const db = getDb();

    const existing = await db
      .select()
      .from(anatomyProfiles)
      .where(eq(anatomyProfiles.id, id))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: "Profile not found" }, 404);
    }

    const updated = await db
      .update(anatomyProfiles)
      .set({
        ...body,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(anatomyProfiles.id, id))
      .returning();

    return c.json({ data: updated[0] });
  }
);
