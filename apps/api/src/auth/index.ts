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

  const isProduction = env.NODE_ENV === "production";

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
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // Update session age every 24 hours
    },
    advanced: {
      cookiePrefix: "vibeyvibe",
      defaultCookieAttributes: {
        secure: isProduction,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      },
    },
    emailAndPassword: {
      enabled: true,
    },
  });

  return _auth;
}
