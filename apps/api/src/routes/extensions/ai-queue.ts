import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "../../db/index.js";
import { aiQueue } from "../../db/schema/index.js";
import { getHandler } from "../../services/ai-queue/index.js";

const aiQueueRoutes = new Hono();

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

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
// POST /retry/:id — Reset a failed/processing job back to pending
// ---------------------------------------------------------------------------

aiQueueRoutes.post(
  "/retry/:id",
  zValidator("param", idParamSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const db = getDb();

    const [job] = await db
      .select()
      .from(aiQueue)
      .where(eq(aiQueue.id, id))
      .limit(1);

    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }
    if (job.status === "completed") {
      return c.json({ error: "Job is already completed" }, 409);
    }

    const now = new Date().toISOString();
    await db
      .update(aiQueue)
      .set({
        status: "pending",
        attempts: 0,
        error: null,
        response: null,
        started_at: null,
        completed_at: null,
        created_at: now,
        updated_at: now,
      })
      .where(eq(aiQueue.id, id));

    return c.json({ data: { id, status: "pending" } });
  },
);

// ---------------------------------------------------------------------------
// POST /claim — Atomically claim the next pending job for given models
// ---------------------------------------------------------------------------

const claimSchema = z.object({
  models: z.array(z.string().min(1)).min(1),
});

aiQueueRoutes.post(
  "/claim",
  zValidator("json", claimSchema),
  async (c) => {
    const { models } = c.req.valid("json");
    const db = getDb();

    // Find the oldest pending job matching requested models
    const [job] = await db
      .select()
      .from(aiQueue)
      .where(
        and(
          eq(aiQueue.status, "pending"),
          inArray(aiQueue.model, models),
          sql`${aiQueue.attempts} < 3`,
        ),
      )
      .orderBy(aiQueue.id)
      .limit(1);

    if (!job) {
      return c.body(null, 204);
    }

    // Atomically claim: only update if still pending (prevents races)
    const result = await db
      .update(aiQueue)
      .set({
        status: "processing",
        attempts: job.attempts + 1,
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .where(
        and(
          eq(aiQueue.id, job.id),
          eq(aiQueue.status, "pending"),
        ),
      )
      .returning();

    if (result.length === 0) {
      // Another worker claimed it between SELECT and UPDATE
      return c.body(null, 204);
    }

    return c.json({
      data: {
        id: job.id,
        name: job.name,
        type: job.type,
        model: job.model,
        prompt: job.prompt,
      },
    });
  },
);

// ---------------------------------------------------------------------------
// POST /:id/complete — Submit externally-generated AI response
// ---------------------------------------------------------------------------

const completeSchema = z.object({
  response: z.string().min(1),
});

aiQueueRoutes.post(
  "/:id/complete",
  zValidator("param", idParamSchema),
  zValidator("json", completeSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const { response } = c.req.valid("json");
    const db = getDb();

    // Verify the job exists and is in "processing" status
    const [job] = await db
      .select()
      .from(aiQueue)
      .where(eq(aiQueue.id, id))
      .limit(1);

    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }
    if (job.status !== "processing") {
      return c.json({ error: `Job is ${job.status}, expected processing` }, 409);
    }

    // Look up the handler for this job type
    const handler = getHandler(job.type);
    if (!handler) {
      // No handler — just store the raw response
      await db
        .update(aiQueue)
        .set({
          status: "completed",
          response,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .where(eq(aiQueue.id, id));
      return c.json({ data: { id, status: "completed" } });
    }

    // Call processResponse to parse and store the result
    try {
      const result = await handler.processResponse(id, response);

      await db
        .update(aiQueue)
        .set({
          status: "completed",
          response,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .where(eq(aiQueue.id, id));

      return c.json({ data: { id, status: "completed", outputId: result.outputId } });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Processing failed";

      await db
        .update(aiQueue)
        .set({
          status: "failed",
          response,
          error: errorMessage,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .where(eq(aiQueue.id, id));

      return c.json({ error: errorMessage }, 422);
    }
  },
);

// ---------------------------------------------------------------------------
// POST /:id/fail — Report CLI failure
// ---------------------------------------------------------------------------

const failSchema = z.object({
  error: z.string().min(1),
});

aiQueueRoutes.post(
  "/:id/fail",
  zValidator("param", idParamSchema),
  zValidator("json", failSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const { error } = c.req.valid("json");
    const db = getDb();

    const [job] = await db
      .select()
      .from(aiQueue)
      .where(eq(aiQueue.id, id))
      .limit(1);

    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }
    if (job.status !== "processing") {
      return c.json({ error: `Job is ${job.status}, expected processing` }, 409);
    }

    await db
      .update(aiQueue)
      .set({
        status: "failed",
        error,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .where(eq(aiQueue.id, id));

    return c.json({ data: { id, status: "failed" } });
  },
);

// ---------------------------------------------------------------------------
// POST /reset-stale — Reset stuck "processing" jobs back to "pending"
// ---------------------------------------------------------------------------

const resetStaleSchema = z.object({
  models: z.array(z.string().min(1)).min(1).optional(),
});

aiQueueRoutes.post(
  "/reset-stale",
  zValidator("json", resetStaleSchema),
  async (c) => {
    const { models } = c.req.valid("json");
    const db = getDb();

    const conditions = [eq(aiQueue.status, "processing")];
    if (models && models.length > 0) {
      conditions.push(inArray(aiQueue.model, models));
    }

    const result = await db
      .update(aiQueue)
      .set({
        status: "pending",
        updated_at: new Date().toISOString(),
      })
      .where(and(...conditions))
      .returning({ id: aiQueue.id });

    return c.json({ data: { reset: result.length, ids: result.map((r) => r.id) } });
  },
);

export default aiQueueRoutes;
