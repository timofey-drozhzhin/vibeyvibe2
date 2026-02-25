import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config();

const url = process.env.DATABASE_URL || "file:../../tmp/local.db";
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
