import { serve } from "@hono/node-server";
import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Load .env from workspace root (two levels up from apps/api/)
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../.env") });

import app from "./app.js";

const port = parseInt(process.env.PORT || "3001", 10);

const devBypass =
  process.env.DEV_AUTH_BYPASS === "true" &&
  process.env.NODE_ENV !== "production";

const dbUrl = process.env.DATABASE_URL || "file:../../tmp/local.db";
const storageProvider = process.env.STORAGE_PROVIDER || "local";
const storagePath = process.env.STORAGE_LOCAL_PATH || "../../tmp/storage";

console.log(`Starting vibeyvibe API server on http://localhost:${port}`);
console.log(`  Auth bypass: ${devBypass ? "ENABLED (dev mode)" : "disabled"}`);
console.log(`  NODE_ENV: ${process.env.NODE_ENV || "undefined"}`);
console.log(`  Database: ${dbUrl}`);
console.log(`  Storage: ${storageProvider}${storageProvider === "local" ? ` (${storagePath})` : ""}`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`vibeyvibe API running at http://localhost:${port}`);
