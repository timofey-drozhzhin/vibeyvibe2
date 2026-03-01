import { serve } from "@hono/node-server";
import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Load .env from workspace root (two levels up from apps/api/)
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../.env") });

import app from "./app.js";
import { getEnv } from "./env.js";
import {
  registerHandler,
  startQueueProcessor,
  resetStaleJobs,
} from "./services/ai-queue/index.js";
import { profileGenerationHandler } from "./services/ai-queue/handlers/profile-generation.js";

const env = getEnv();
const port = parseInt(process.env.PORT || "3001", 10);

const mask = (val: string | undefined) => (val ? "***" : "");

console.log(`Starting vibeyvibe API server on http://localhost:${port}`);
console.log("  Environment:");
console.log(`    NODE_ENV:            ${env.NODE_ENV}`);
console.log(`    DATABASE_URL:        ${env.DATABASE_URL}`);
console.log(`    DATABASE_AUTH_TOKEN:  ${mask(env.DATABASE_AUTH_TOKEN)}`);
console.log(`    BETTER_AUTH_SECRET:   ${mask(env.BETTER_AUTH_SECRET)}`);
console.log(`    BETTER_AUTH_URL:      ${env.BETTER_AUTH_URL}`);
console.log(`    GOOGLE_CLIENT_ID:     ${mask(env.GOOGLE_CLIENT_ID)}`);
console.log(`    GOOGLE_CLIENT_SECRET: ${mask(env.GOOGLE_CLIENT_SECRET)}`);
console.log(`    STORAGE_PROVIDER:     ${env.STORAGE_PROVIDER}`);
console.log(`    STORAGE_LOCAL_PATH:   ${env.STORAGE_LOCAL_PATH}`);
console.log(`    BUNNY_STORAGE_ZONE:   ${env.BUNNY_STORAGE_ZONE || ""}`);
console.log(`    BUNNY_STORAGE_PASS:   ${mask(env.BUNNY_STORAGE_PASSWORD)}`);
console.log(`    BUNNY_STORAGE_REGION: ${env.BUNNY_STORAGE_REGION || ""}`);
console.log(`    BUNNY_CDN_HOSTNAME:   ${env.BUNNY_CDN_HOSTNAME || ""}`);
console.log(`    BUNNY_CDN_SEC_KEY:    ${mask(env.BUNNY_CDN_SECURITY_KEY)}`);
console.log(`    DEV_AUTH_BYPASS:      ${env.DEV_AUTH_BYPASS || ""}`);
console.log(`    FRONTEND_URL:         ${env.FRONTEND_URL}`);

serve({
  fetch: app.fetch,
  port,
});

// Start AI queue processor
registerHandler("profile_generation", profileGenerationHandler);
resetStaleJobs().catch(console.error);
startQueueProcessor(3000);

console.log(`vibeyvibe API running at http://localhost:${port}`);
