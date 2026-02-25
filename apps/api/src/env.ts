import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string().default("file:../../tmp/local.db"),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().min(16),
  BETTER_AUTH_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  STORAGE_PROVIDER: z.enum(["local", "bunny"]).default("local"),
  STORAGE_LOCAL_PATH: z.string().default("../../tmp/storage"),
  BUNNY_STORAGE_ZONE: z.string().optional(),
  BUNNY_STORAGE_PASSWORD: z.string().optional(),
  BUNNY_STORAGE_REGION: z.string().default("storage.bunnycdn.com"),
  BUNNY_CDN_HOSTNAME: z.string().optional(),
  BUNNY_CDN_SECURITY_KEY: z.string().optional(),
  DEV_AUTH_BYPASS: z.string().optional(),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function getEnv(): Env {
  if (_env) return _env;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Invalid environment variables:", result.error.format());
    // In dev, use defaults; in prod, this would fail
    _env = envSchema.parse({
      ...process.env,
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET || "dev-secret-change-me-in-production",
      BETTER_AUTH_URL:
        process.env.BETTER_AUTH_URL || "http://localhost:3001",
    });
    return _env;
  }

  _env = result.data;
  return _env;
}
