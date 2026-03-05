/**
 * Shared dev user constants used by both the auth middleware and the
 * fake get-session endpoint in app.ts.
 *
 * Centralised so the two bypass paths never diverge.
 */

export const DEV_USER = {
  id: "dev-user-1",
  name: "Dev User",
  email: "dev@localhost",
  emailVerified: true,
  image: null,
  role: "admin",
} as const;

export const DEV_SESSION = {
  id: "dev-session-1",
  token: "dev-token",
  userId: DEV_USER.id,
} as const;

export function isDevBypass(): boolean {
  return process.env.DEV_AUTH_BYPASS === "true" && process.env.NODE_ENV !== "production";
}
