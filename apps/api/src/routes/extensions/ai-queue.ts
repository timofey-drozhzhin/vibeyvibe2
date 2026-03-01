import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { inArray } from "drizzle-orm";
import { getDb } from "../../db/index.js";
import { aiQueue } from "../../db/schema/index.js";
import { processJobById } from "../../services/ai-queue/index.js";

const aiQueueRoutes = new Hono();

const statusQuerySchema = z.object({
  ids: z
    .string()
    .min(1)
    .transform((v) =>
      v
        .split(",")
        .map(Number)
        .filter((n) => !isNaN(n) && n > 0),
    ),
});

// ---------------------------------------------------------------------------
// GET /status?ids=1,2,3 — Check queue item statuses (batch)
// ---------------------------------------------------------------------------

aiQueueRoutes.get(
  "/status",
  zValidator("query", statusQuerySchema),
  async (c) => {
    const { ids } = c.req.valid("query");
    if (ids.length === 0) {
      return c.json({ data: [] });
    }

    const db = getDb();
    const items = await db
      .select({
        id: aiQueue.id,
        status: aiQueue.status,
        error: aiQueue.error,
      })
      .from(aiQueue)
      .where(inArray(aiQueue.id, ids));

    return c.json({ data: items });
  },
);

// ---------------------------------------------------------------------------
// POST /process/:id — Manually trigger processing of a specific job
// ---------------------------------------------------------------------------

const processParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

aiQueueRoutes.post(
  "/process/:id",
  zValidator("param", processParamSchema),
  async (c) => {
    const { id } = c.req.valid("param");

    // Fire-and-forget: start processing in background
    processJobById(id).catch((err) =>
      console.error(`[ai-queue] Manual process error for job ${id}:`, err),
    );

    return c.json({ data: { id, status: "processing" } });
  },
);

export default aiQueueRoutes;
