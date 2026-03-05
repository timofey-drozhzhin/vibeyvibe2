import { createMiddleware } from "hono/factory";
import { getAuth } from "../auth/index.js";
import { DEV_USER, DEV_SESSION, isDevBypass } from "./dev-user.js";

type AuthVariables = {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    role: string;
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
  if (isDevBypass()) {
    c.set("user", {
      ...DEV_USER,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    c.set("session", {
      ...DEV_SESSION,
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

export const adminMiddleware = createMiddleware<{
  Variables: AuthVariables;
}>(async (c, next) => {
  const user = c.get("user");
  if (!user || user.role !== "admin") {
    return c.json({ error: "Forbidden" }, 403);
  }
  return next();
});
