import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "../db/index.js";
import * as schema from "../db/schema/index.js";
import { getEnv } from "../env.js";

let _auth: ReturnType<typeof betterAuth> | null = null;

export function getAuth() {
  if (_auth) return _auth;

  const env = getEnv();
  const db = getDb();

  const socialProviders: Record<string, unknown> = {};

  // Only add Google OAuth if credentials are provided
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    socialProviders.google = {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    };
  }

  _auth = betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
    }),
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    socialProviders,
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // 5 minute cache
      },
    },
    emailAndPassword: {
      enabled: true,
    },
  });

  return _auth;
}
