import { z } from "zod";

// Treat empty strings from .env as undefined
const optionalString = z
  .string()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  DATABASE_URL: z.string().min(1),
  DATABASE_AUTH_TOKEN: optionalString,
  BETTER_AUTH_SECRET: z.string().min(16),
  BETTER_AUTH_URL: z.string().url(),
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  STORAGE_PROVIDER: z.enum(["local", "bunny"]),
  STORAGE_LOCAL_PATH: z.string().min(1),
  BUNNY_STORAGE_ZONE: optionalString,
  BUNNY_STORAGE_PASSWORD: optionalString,
  BUNNY_STORAGE_REGION: optionalString,
  BUNNY_CDN_HOSTNAME: optionalString,
  BUNNY_CDN_SECURITY_KEY: optionalString,
  DEV_AUTH_BYPASS: optionalString,
  FRONTEND_URL: z.string().url(),
  OPENROUTER_API_KEY: optionalString,
  VIBES_GENERATOR_OPENROUTER_MODEL: optionalString,
  VIBES_SUNO_PROMPT_OPENROUTER_MODEL: optionalString,
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function getEnv(): Env {
  if (_env) return _env;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Invalid environment variables:", result.error.format());
    throw new Error(
      "Missing or invalid environment variables. Ensure .env exists at the workspace root."
    );
  }

  _env = result.data;
  return _env;
}
