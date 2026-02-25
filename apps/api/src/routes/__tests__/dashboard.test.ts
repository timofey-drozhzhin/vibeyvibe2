// @ts-nocheck
process.env.DEV_AUTH_BYPASS = "true";
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "file:../../tmp/local.db";

import { describe, it, expect } from "vitest";
import app from "../../app.js";

describe("GET /api/dashboard/stats", () => {
  it("returns 200 status", async () => {
    const res = await app.request("/api/dashboard/stats");
    expect(res.status).toBe(200);
  });

  it("returns counts for all sections", async () => {
    const res = await app.request("/api/dashboard/stats");
    const data = await res.json();

    // My Music section
    expect(data.myMusic).toBeDefined();
    expect(typeof data.myMusic.songs).toBe("number");
    expect(typeof data.myMusic.artists).toBe("number");
    expect(typeof data.myMusic.albums).toBe("number");

    // Anatomy section
    expect(data.anatomy).toBeDefined();
    expect(typeof data.anatomy.songs).toBe("number");
    expect(typeof data.anatomy.artists).toBe("number");

    // Bin section
    expect(data.bin).toBeDefined();
    expect(typeof data.bin.songs).toBe("number");

    // Suno section
    expect(data.suno).toBeDefined();
    expect(typeof data.suno.prompts).toBe("number");
    expect(typeof data.suno.collections).toBe("number");
    expect(typeof data.suno.generations).toBe("number");
  });

  it("returns non-negative counts", async () => {
    const res = await app.request("/api/dashboard/stats");
    const data = await res.json();

    expect(data.myMusic.songs).toBeGreaterThanOrEqual(0);
    expect(data.myMusic.artists).toBeGreaterThanOrEqual(0);
    expect(data.myMusic.albums).toBeGreaterThanOrEqual(0);
    expect(data.anatomy.songs).toBeGreaterThanOrEqual(0);
    expect(data.anatomy.artists).toBeGreaterThanOrEqual(0);
    expect(data.bin.songs).toBeGreaterThanOrEqual(0);
    expect(data.suno.prompts).toBeGreaterThanOrEqual(0);
    expect(data.suno.collections).toBeGreaterThanOrEqual(0);
    expect(data.suno.generations).toBeGreaterThanOrEqual(0);
  });
});
