import { eq } from "drizzle-orm";
import { getDb } from "../../../db/index.js";
import { profiles } from "../../../db/schema/index.js";
import { validateProfileResponse, stampVersion } from "../../../features/vibes/index.js";
import { chatCompletion } from "../../openrouter/index.js";
import type { QueueJobHandler } from "../processor.js";

/**
 * Parse and validate the raw AI response as nested JSON matching the vibes schema.
 * Strips markdown code fences, validates against the schema, and stamps $version.
 */
function parseProfileResponse(rawResponse: string): any {
  let cleaned = rawResponse.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(cleaned);
  const result = validateProfileResponse(parsed);

  if (!result.valid) {
    console.warn(
      "[profile-generation] Validation errors (storing anyway):",
      result.errors,
    );
    // Store even if validation has issues — the AI may produce close-enough output
    return stampVersion(parsed);
  }

  return stampVersion(result.cleaned);
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

    // Parse, validate, and version-stamp the response
    const profileData = parseProfileResponse(rawResponse);

    // Update the profile with the result
    await db
      .update(profiles)
      .set({
        value: JSON.stringify(profileData),
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
