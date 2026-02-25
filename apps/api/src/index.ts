import { serve } from "@hono/node-server";
import { config } from "dotenv";

// Load .env for local development
config();

import app from "./app.js";

const port = parseInt(process.env.PORT || "3001", 10);

const devBypass =
  process.env.DEV_AUTH_BYPASS === "true" &&
  process.env.NODE_ENV !== "production";

console.log(`Starting vibeyvibe API server on http://localhost:${port}`);
console.log(`  Auth bypass: ${devBypass ? "ENABLED (dev mode)" : "disabled"}`);
console.log(`  NODE_ENV: ${process.env.NODE_ENV || "undefined"}`);
console.log(`  Storage: ${process.env.STORAGE_PROVIDER || "local"}`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`vibeyvibe API running at http://localhost:${port}`);
