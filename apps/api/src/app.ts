import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { authMiddleware, adminMiddleware } from "./middleware/auth.js";
import { rateLimiter } from "./middleware/rate-limit.js";
import { errorHandler } from "./middleware/error.js";
import { DEV_USER, DEV_SESSION, isDevBypass } from "./middleware/dev-user.js";
import { getAuth } from "./auth/index.js";
import routes from "./routes/index.js";

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
      const frontendUrl = process.env.FRONTEND_URL;
      const allowed = new Set([frontendUrl]);
      // Only allow localhost in non-production environments
      if (process.env.NODE_ENV !== "production") {
        allowed.add("http://localhost:5173");
      }
      return allowed.has(origin) ? origin : "";
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    maxAge: 600,
  })
);

// Rate limiting for auth endpoints (10 requests per 60 seconds per IP)
// Applied before the auth handler to prevent brute force login attacks
// Skipped when dev auth bypass is enabled since get-session is called frequently
if (!isDevBypass()) {
  app.use("/api/auth/*", rateLimiter(10, 60_000));
}

// Health check (unauthenticated)
app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Better Auth handler (unauthenticated)
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  // DEV ONLY: Return fake session for dev bypass
  if (isDevBypass() && c.req.path === "/api/auth/get-session") {
    const now = new Date().toISOString();
    const user = { ...DEV_USER, createdAt: now, updatedAt: now };
    return c.json({
      session: {
        ...DEV_SESSION,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        user,
      },
      user,
    });
  }

  const auth = getAuth();
  return auth.handler(c.req.raw);
});

// Auth middleware for all protected routes
app.use("/api/*", authMiddleware);

// Admin guard for admin section routes
app.use("/api/admin/*", adminMiddleware);

// Mount all API routes
app.route("/api", routes);

export default app;
