import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../.env") });

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set. Ensure .env exists at the workspace root.");
}
const isLocal = url.startsWith("file:");

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "sqlite",
  ...(isLocal
    ? { dbCredentials: { url } }
    : {
        driver: "turso",
        dbCredentials: {
          url,
          authToken: process.env.DATABASE_AUTH_TOKEN,
        },
      }),
});
