import { eq } from "drizzle-orm";
import { getDb } from "../../../db/index.js";
import {
  vibes,
  profiles,
} from "../../../db/schema/index.js";
import { chatCompletion } from "../../openrouter/index.js";
import type { QueueJobHandler } from "../processor.js";

/**
 * Parse the raw AI response into profile entries by mapping vibe IDs
 * to their metadata (name, category) and the AI-provided values.
 */
function parseProfileResponse(
  rawResponse: string,
  activeVibes: Array<{ id: number; name: string; vibe_category: string }>,
): Array<{ name: string; category: string; value: string }> {
  let cleaned = rawResponse.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "");
  }
  const parsed: Record<string, string> = JSON.parse(cleaned);

  const vibeIdSet = new Set(activeVibes.map((v) => v.id));
  const vibeMap = new Map(activeVibes.map((v) => [v.id, v]));

  const entries: Array<{ name: string; category: string; value: string }> = [];
  for (const [vibeIdStr, value] of Object.entries(parsed)) {
    const vibeId = Number(vibeIdStr);
    if (!vibeIdSet.has(vibeId) || typeof value !== "string" || !value.trim()) {
      continue;
    }
    const vibe = vibeMap.get(vibeId)!;
    entries.push({
      name: vibe.name,
      category: vibe.vibe_category,
      value: value.trim(),
    });
  }
  return entries;
}

export const profileGenerationHandler: QueueJobHandler = {
  async execute(queueItemId: number, prompt: string, model: string) {
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

    // Call OpenRouter
    const rawResponse = await chatCompletion(
      [{ role: "user", content: prompt }],
      { model },
    );

    // Fetch active vibes for response mapping
    const activeVibes = await db
      .select({ id: vibes.id, name: vibes.name, vibe_category: vibes.vibe_category })
      .from(vibes)
      .where(eq(vibes.archived, false));

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

    return { rawResponse, outputId: profile.id };
  },
};
