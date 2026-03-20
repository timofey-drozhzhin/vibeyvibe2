import { eq } from "drizzle-orm";
import { getDb } from "../../../db/index.js";
import { profiles } from "../../../db/schema/index.js";
import { getActiveVibes, type Vibe } from "../../../config/vibes.js";
import { chatCompletion } from "../../openrouter/index.js";
import type { QueueJobHandler } from "../processor.js";

/**
 * Parse the raw AI response into profile entries by mapping vibe names
 * to their metadata (category) and the AI-provided values.
 */
function parseProfileResponse(
  rawResponse: string,
  activeVibes: Vibe[],
): Array<{ name: string; category: string; value: string }> {
  let cleaned = rawResponse.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "");
  }
  const parsed: Record<string, string> = JSON.parse(cleaned);

  const vibeBySlug = new Map(activeVibes.map((v) => [v.slug, v]));

  const entries: Array<{ name: string; category: string; value: string }> = [];
  for (const [slug, value] of Object.entries(parsed)) {
    const vibe = vibeBySlug.get(slug);
    if (!vibe || typeof value !== "string" || !value.trim()) {
      continue;
    }
    entries.push({
      name: vibe.name,
      category: vibe.category,
      value: value.trim(),
    });
  }
  return entries;
}

export const profileGenerationHandler: QueueJobHandler = {
  async processResponse(queueItemId: number, rawResponse: string) {
    const db = getDb();

    // Look up the profile linked to this queue item
    const [profile] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.ai_queue_id, queueItemId))
      .limit(1);

    if (!profile) {
      throw new Error(`No profile found for queue item ${queueItemId}`);
    }

    // Get active vibes from static config for response mapping
    const activeVibes = getActiveVibes();

    // Parse and map the response
    const profileEntries = parseProfileResponse(rawResponse, activeVibes);

    // Update the profile with the result
    await db
      .update(profiles)
      .set({
        value: JSON.stringify(profileEntries),
        updated_at: new Date().toISOString(),
      })
      .where(eq(profiles.id, profile.id));

    return { outputId: profile.id };
  },

  async execute(queueItemId: number, prompt: string, model: string) {
    // Call OpenRouter
    const rawResponse = await chatCompletion(
      [{ role: "user", content: prompt }],
      { model },
    );

    // Delegate to processResponse for parsing + DB update
    const result = await this.processResponse(queueItemId, rawResponse);
    return { rawResponse, outputId: result.outputId };
  },
};
