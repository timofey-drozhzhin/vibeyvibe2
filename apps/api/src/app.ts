import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { authMiddleware } from "./middleware/auth.js";
import { rateLimiter } from "./middleware/rate-limit.js";
import { errorHandler } from "./middleware/error.js";
import { getAuth } from "./auth/index.js";
import { routes } from "./routes/index.js";

const app = new Hono();

// Global error handler
app.onError(errorHandler);

// Security headers
app.use("*", secureHeaders());

// CORS
app.use(
  "/api/*",
  cors({
    origin: (origin) => {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const allowed = new Set([frontendUrl]);
      // Only allow localhost in non-production environments
      if (process.env.NODE_ENV !== "production") {
        allowed.add("http://localhost:5173");
      }
      return allowed.has(origin) ? origin : "";
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "OPTIONS"],
    credentials: true,
    maxAge: 600,
  })
);

// Rate limiting for auth endpoints (10 requests per 60 seconds per IP)
// Applied before the auth handler to prevent brute force login attacks
// Skipped when dev auth bypass is enabled since get-session is called frequently
if (!(process.env.DEV_AUTH_BYPASS === "true" && process.env.NODE_ENV !== "production")) {
  app.use("/api/auth/*", rateLimiter(10, 60_000));
}

// Health check (unauthenticated)
app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Better Auth handler (unauthenticated)
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  // DEV ONLY: Return fake session for dev bypass
  if (
    process.env.DEV_AUTH_BYPASS === "true" &&
    process.env.NODE_ENV !== "production" &&
    c.req.path === "/api/auth/get-session"
  ) {
    return c.json({
      session: {
        id: "dev-session-1",
        token: "dev-token",
        userId: "dev-user-1",
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        user: {
          id: "dev-user-1",
          name: "Dev User",
          email: "dev@localhost",
          emailVerified: true,
          image: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      user: {
        id: "dev-user-1",
        name: "Dev User",
        email: "dev@localhost",
        emailVerified: true,
        image: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }

  const auth = getAuth();
  return auth.handler(c.req.raw);
});

// Auth middleware for all protected routes
app.use("/api/*", authMiddleware);

// Mount all API routes
app.route("/api", routes);

export default app;
