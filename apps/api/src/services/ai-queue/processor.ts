import { eq, and, sql, inArray } from "drizzle-orm";
import { getDb } from "../../db/index.js";
import { aiQueue } from "../../db/schema/index.js";
import { getEnv } from "../../env.js";

const MAX_ATTEMPTS = 3;

function getAutoprocessModels(): string[] {
  const raw = getEnv().OPENROUTER_MODELS_AUTOPROCESS;
  if (!raw) return [];
  return raw.split(",").map((m) => m.trim()).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Handler interface
// ---------------------------------------------------------------------------

export interface QueueJobHandler {
  execute(
    queueItemId: number,
    prompt: string,
    model: string,
  ): Promise<{ rawResponse: string; outputId: number }>;
}

const handlers = new Map<string, QueueJobHandler>();

export function registerHandler(type: string, handler: QueueJobHandler) {
  handlers.set(type, handler);
}

export function getHandler(type: string): QueueJobHandler | undefined {
  return handlers.get(type);
}

// ---------------------------------------------------------------------------
// Execute a specific job (used by both auto-processor and manual trigger)
// ---------------------------------------------------------------------------

async function executeJob(job: typeof aiQueue.$inferSelect): Promise<void> {
  const db = getDb();

  // Mark as processing and increment attempts
  await db
    .update(aiQueue)
    .set({
      status: "processing",
      attempts: job.attempts + 1,
      started_at: new Date().toISOString(),
    })
    .where(eq(aiQueue.id, job.id));

  // Look up handler
  const handler = handlers.get(job.type);
  if (!handler) {
    await db
      .update(aiQueue)
      .set({
        status: "failed",
        error: `No handler registered for type: ${job.type}`,
        completed_at: new Date().toISOString(),
      })
      .where(eq(aiQueue.id, job.id));
    return;
  }

  // Execute
  try {
    const result = await handler.execute(job.id, job.prompt, job.model);

    await db
      .update(aiQueue)
      .set({
        status: "completed",
        response: result.rawResponse,
        completed_at: new Date().toISOString(),
      })
      .where(eq(aiQueue.id, job.id));
  } catch (err: any) {
    const errorMessage = err?.message ?? "Unknown error";
    console.error(`[ai-queue] Job ${job.id} (${job.type}) failed:`, errorMessage);

    await db
      .update(aiQueue)
      .set({
        status: "failed",
        error: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .where(eq(aiQueue.id, job.id));
  }
}

// ---------------------------------------------------------------------------
// Process the next pending auto-processable job
// ---------------------------------------------------------------------------

export async function processNextJob(): Promise<boolean> {
  const autoModels = getAutoprocessModels();
  if (autoModels.length === 0) return false;

  const db = getDb();

  const [job] = await db
    .select()
    .from(aiQueue)
    .where(
      and(
        eq(aiQueue.status, "pending"),
        sql`${aiQueue.attempts} < ${MAX_ATTEMPTS}`,
        inArray(aiQueue.model, autoModels),
      ),
    )
    .orderBy(aiQueue.id)
    .limit(1);

  if (!job) return false;

  await executeJob(job);
  return true;
}

// ---------------------------------------------------------------------------
// Manually process a specific job by ID
// ---------------------------------------------------------------------------

export async function processJobById(jobId: number): Promise<{ success: boolean; error?: string }> {
  const db = getDb();

  const [job] = await db
    .select()
    .from(aiQueue)
    .where(eq(aiQueue.id, jobId))
    .limit(1);

  if (!job) return { success: false, error: "Job not found" };
  if (job.status !== "pending" && job.status !== "failed") {
    return { success: false, error: `Job is ${job.status}, cannot process` };
  }
  if (job.attempts >= MAX_ATTEMPTS) {
    return { success: false, error: "Max attempts reached" };
  }

  // Reset status to pending if it was failed (retry)
  if (job.status === "failed") {
    await db
      .update(aiQueue)
      .set({ status: "pending", error: null })
      .where(eq(aiQueue.id, job.id));
    job.status = "pending";
  }

  await executeJob(job);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Background polling loop
// ---------------------------------------------------------------------------

let pollInterval: ReturnType<typeof setInterval> | null = null;

export function startQueueProcessor(intervalMs = 3000) {
  if (pollInterval) return;

  pollInterval = setInterval(async () => {
    try {
      while (await processNextJob()) {
        // Keep processing until queue is empty
      }
    } catch (err) {
      console.error("[ai-queue] Processor error:", err);
    }
  }, intervalMs);

  // Don't prevent process exit
  if (pollInterval.unref) pollInterval.unref();

  console.log(
    `[ai-queue] Queue processor started (polling every ${intervalMs}ms)`,
  );
}

export function stopQueueProcessor() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

// ---------------------------------------------------------------------------
// Startup recovery: reset stale "processing" jobs from a previous crash
// ---------------------------------------------------------------------------

export async function resetStaleJobs(): Promise<number> {
  const db = getDb();
  const result = await db
    .update(aiQueue)
    .set({ status: "pending" })
    .where(eq(aiQueue.status, "processing"))
    .returning();
  if (result.length > 0) {
    console.log(`[ai-queue] Reset ${result.length} stale job(s) to pending`);
  }
  return result.length;
}
