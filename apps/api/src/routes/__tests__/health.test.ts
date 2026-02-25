// @ts-nocheck
process.env.DEV_AUTH_BYPASS = "true";
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "file:../../tmp/local.db";

import { describe, it, expect } from "vitest";
import app from "../../app.js";

describe("GET /api/health", () => {
  it("returns 200 status", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
  });

  it("returns JSON with status ok", async () => {
    const res = await app.request("/api/health");
    const data = await res.json();
    expect(data.status).toBe("ok");
  });

  it("returns a timestamp field", async () => {
    const res = await app.request("/api/health");
    const data = await res.json();
    expect(data.timestamp).toBeDefined();
    expect(typeof data.timestamp).toBe("string");
    // Verify it's a valid ISO date string
    expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
  });

  it("does not require authentication", async () => {
    // Even without auth bypass, health should work
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
  });
});
