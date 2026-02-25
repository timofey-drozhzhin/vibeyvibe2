import { createMiddleware } from "hono/factory";
import { getAuth } from "../auth/index.js";

type AuthVariables = {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  session: {
    id: string;
    token: string;
    userId: string;
    expiresAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
};

export const authMiddleware = createMiddleware<{
  Variables: AuthVariables;
}>(async (c, next) => {
  // Skip auth routes
  if (c.req.path.startsWith("/api/auth/")) {
    return next();
  }

  // DEV ONLY: Bypass auth for local development (double guard)
  if (
    process.env.DEV_AUTH_BYPASS === "true" &&
    process.env.NODE_ENV !== "production"
  ) {
    c.set("user", {
      id: "dev-user-1",
      name: "Dev User",
      email: "dev@localhost",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    c.set("session", {
      id: "dev-session-1",
      token: "dev-token",
      userId: "dev-user-1",
      expiresAt: new Date(Date.now() + 86400000),
      ipAddress: "127.0.0.1",
      userAgent: "dev",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return next();
  }

  // Production auth check
  const auth = getAuth();
  const sessionResult = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  c.set("user", (sessionResult?.user as AuthVariables["user"]) || null);
  c.set(
    "session",
    (sessionResult?.session as AuthVariables["session"]) || null
  );

  if (!sessionResult?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return next();
});
