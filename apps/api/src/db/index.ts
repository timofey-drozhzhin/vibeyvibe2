import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema/index.js";
import { getEnv } from "../env.js";

let _db: ReturnType<typeof createDrizzle> | null = null;

function createDrizzle() {
  const env = getEnv();
  const url = env.DATABASE_URL;
  const authToken = env.DATABASE_AUTH_TOKEN;

  const client = createClient({
    url,
    authToken: authToken || undefined,
  });

  return drizzle(client, { schema });
}

export function getDb() {
  if (!_db) {
    _db = createDrizzle();
  }
  return _db;
}

export type Database = ReturnType<typeof getDb>;
