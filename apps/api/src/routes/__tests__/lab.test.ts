// @ts-nocheck
process.env.DEV_AUTH_BYPASS = "true";
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "file:../../tmp/local.db";

import { describe, it, expect } from "vitest";
import app from "../../app.js";

const ts = Date.now();

// Generate unique ISRC: 2 alpha + 3 alphanum + 7 digits
function uniqueIsrc(suffix: number = 0): string {
  const digits = String(ts + suffix).slice(-7);
  return `AN${String(suffix).padStart(3, "0").slice(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, "B")}${digits}`;
}

// Generate unique ISNI: 16 digits
function uniqueIsni(suffix: number = 0): string {
  return String(ts + suffix + 50000).padStart(16, "0").slice(-16);
}

function json(body: object) {
  return {
    method: "POST" as const,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function jsonPut(body: object) {
  return {
    method: "PUT" as const,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

// ─── Lab Songs ────────────────────────────────────────────────────────────

describe("Lab Songs", () => {
  let createdSongId: string;

  describe("POST /api/lab/songs", () => {
    it("creates a song with valid data", async () => {
      const isrc = uniqueIsrc(300);
      const res = await app.request(
        "/api/lab/songs",
        json({
          name: `Lab Song ${ts}`,
          isrc,
          releaseDate: "2024-03-01",
          rating: 8,
        })
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data.name).toBe(`Lab Song ${ts}`);
      expect(body.data.isrc).toBe(isrc);
      expect(body.data.id).toBeDefined();
      createdSongId = body.data.id;
    });

    it("returns 400 for missing ISRC (required in lab)", async () => {
      const res = await app.request(
        "/api/lab/songs",
        json({
          name: "No ISRC",
          releaseDate: "2024-01-01",
        })
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 for missing release date (required in lab)", async () => {
      const res = await app.request(
        "/api/lab/songs",
        json({
          name: "No Date",
          isrc: uniqueIsrc(301),
        })
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 for empty name", async () => {
      const res = await app.request(
        "/api/lab/songs",
        json({
          name: "",
          isrc: uniqueIsrc(302),
          releaseDate: "2024-01-01",
        })
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 for invalid ISRC format", async () => {
      const res = await app.request(
        "/api/lab/songs",
        json({
          name: "Bad ISRC",
          isrc: "INVALID",
          releaseDate: "2024-01-01",
        })
      );
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/lab/songs", () => {
    it("returns paginated list", async () => {
      const res = await app.request("/api/lab/songs");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toBeInstanceOf(Array);
      expect(typeof body.total).toBe("number");
      expect(body.page).toBe(1);
    });

    it("supports search by name", async () => {
      const res = await app.request(
        `/api/lab/songs?q=Lab Song ${ts}`
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("supports pagination", async () => {
      const res = await app.request(
        "/api/lab/songs?page=1&pageSize=5"
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe("GET /api/lab/songs/:id", () => {
    it("returns a single song with activeProfile and artists", async () => {
      const res = await app.request(`/api/lab/songs/${createdSongId}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.id).toBe(createdSongId);
      expect(body.data.name).toBe(`Lab Song ${ts}`);
      expect(body.data).toHaveProperty("activeProfile");
      expect(body.data).toHaveProperty("artists");
      expect(body.data.artists).toBeInstanceOf(Array);
    });

    it("returns 404 for non-existent song", async () => {
      const res = await app.request("/api/lab/songs/nonexistent-xyz");
      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/lab/songs/:id", () => {
    it("updates song rating", async () => {
      const res = await app.request(
        `/api/lab/songs/${createdSongId}`,
        jsonPut({ rating: 10 })
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.rating).toBe(10);
    });

    it("archives a song", async () => {
      const res = await app.request(
        `/api/lab/songs/${createdSongId}`,
        jsonPut({ archived: true })
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.archived).toBe(true);
    });

    it("unarchives a song", async () => {
      const res = await app.request(
        `/api/lab/songs/${createdSongId}`,
        jsonPut({ archived: false })
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.archived).toBe(false);
    });

    it("returns 404 for non-existent song", async () => {
      const res = await app.request(
        "/api/lab/songs/nonexistent-xyz",
        jsonPut({ rating: 5 })
      );
      expect(res.status).toBe(404);
    });
  });
});

// ─── Lab Artists ──────────────────────────────────────────────────────────

describe("Lab Artists", () => {
  let createdArtistId: string;

  describe("POST /api/lab/artists", () => {
    it("creates an artist with valid data", async () => {
      const isni = uniqueIsni(400);
      const res = await app.request(
        "/api/lab/artists",
        json({
          name: `Lab Artist ${ts}`,
          isni,
          rating: 7,
        })
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data.name).toBe(`Lab Artist ${ts}`);
      expect(body.data.isni).toBe(isni);
      expect(body.data.id).toBeDefined();
      createdArtistId = body.data.id;
    });

    it("returns 400 for missing ISNI (required in lab)", async () => {
      const res = await app.request(
        "/api/lab/artists",
        json({ name: "No ISNI" })
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 for invalid ISNI", async () => {
      const res = await app.request(
        "/api/lab/artists",
        json({ name: "Bad ISNI", isni: "12345" })
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 for empty name", async () => {
      const res = await app.request(
        "/api/lab/artists",
        json({ name: "", isni: uniqueIsni(401) })
      );
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/lab/artists", () => {
    it("returns paginated list", async () => {
      const res = await app.request("/api/lab/artists");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toBeInstanceOf(Array);
      expect(typeof body.total).toBe("number");
    });

    it("supports search by name", async () => {
      const res = await app.request(
        `/api/lab/artists?q=Lab Artist ${ts}`
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("GET /api/lab/artists/:id", () => {
    it("returns single artist with songs", async () => {
      const res = await app.request(
        `/api/lab/artists/${createdArtistId}`
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.id).toBe(createdArtistId);
      expect(body.data).toHaveProperty("songs");
    });

    it("returns 404 for non-existent artist", async () => {
      const res = await app.request("/api/lab/artists/nonexistent-xyz");
      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/lab/artists/:id", () => {
    it("updates an artist", async () => {
      const res = await app.request(
        `/api/lab/artists/${createdArtistId}`,
        jsonPut({ name: `Updated Lab Artist ${ts}` })
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.name).toBe(`Updated Lab Artist ${ts}`);
    });

    it("archives an artist", async () => {
      const res = await app.request(
        `/api/lab/artists/${createdArtistId}`,
        jsonPut({ archived: true })
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.archived).toBe(true);
    });

    it("returns 404 for non-existent artist", async () => {
      const res = await app.request(
        "/api/lab/artists/nonexistent-xyz",
        jsonPut({ name: "Nope" })
      );
      expect(res.status).toBe(404);
    });
  });
});

// ─── Lab Vibes ──────────────────────────────────────────────────────────

describe("Lab Vibes", () => {
  let createdVibeId: string;

  describe("POST /api/lab/vibes", () => {
    it("creates a vibe with all fields", async () => {
      const res = await app.request(
        "/api/lab/vibes",
        json({
          name: `Tempo ${ts}`,
          description: "Song tempo in BPM",
          instruction: "Enter the BPM value",
          examples: "120 BPM, 90 BPM, 140 BPM",
        })
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data.name).toBe(`Tempo ${ts}`);
      expect(body.data.description).toBe("Song tempo in BPM");
      expect(body.data.id).toBeDefined();
      createdVibeId = body.data.id;
    });

    it("creates a vibe with only name", async () => {
      const res = await app.request(
        "/api/lab/vibes",
        json({ name: `Mood ${ts}` })
      );
      expect(res.status).toBe(201);
    });

    it("returns 400 for empty name", async () => {
      const res = await app.request(
        "/api/lab/vibes",
        json({ name: "" })
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 for name exceeding 100 chars", async () => {
      const res = await app.request(
        "/api/lab/vibes",
        json({ name: "x".repeat(101) })
      );
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/lab/vibes", () => {
    it("returns paginated list", async () => {
      const res = await app.request("/api/lab/vibes");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toBeInstanceOf(Array);
      expect(typeof body.total).toBe("number");
    });

    it("supports search by name", async () => {
      const res = await app.request(
        `/api/lab/vibes?q=Tempo ${ts}`
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("GET /api/lab/vibes/:id", () => {
    it("returns a single vibe", async () => {
      const res = await app.request(
        `/api/lab/vibes/${createdVibeId}`
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.id).toBe(createdVibeId);
      expect(body.data.name).toBe(`Tempo ${ts}`);
    });

    it("returns 404 for non-existent vibe", async () => {
      const res = await app.request(
        "/api/lab/vibes/nonexistent-xyz"
      );
      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/lab/vibes/:id", () => {
    it("updates a vibe", async () => {
      const res = await app.request(
        `/api/lab/vibes/${createdVibeId}`,
        jsonPut({ description: "Updated description" })
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.description).toBe("Updated description");
    });

    it("archives a vibe", async () => {
      const res = await app.request(
        `/api/lab/vibes/${createdVibeId}`,
        jsonPut({ archived: true })
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.archived).toBe(true);
    });

    it("returns 404 for non-existent vibe", async () => {
      const res = await app.request(
        "/api/lab/vibes/nonexistent-xyz",
        jsonPut({ name: "Nope" })
      );
      expect(res.status).toBe(404);
    });
  });
});

// ─── Lab Profiles ─────────────────────────────────────────────────────────

describe("Lab Profiles", () => {
  let songId: string;
  let profileId: string;

  it("creates a song for profile testing", async () => {
    const isrc = uniqueIsrc(500);
    const res = await app.request(
      "/api/lab/songs",
      json({
        name: `Profile Song ${ts}`,
        isrc,
        releaseDate: "2024-05-01",
        rating: 6,
      })
    );
    expect(res.status).toBe(201);
    songId = (await res.json()).data.id;
  });

  describe("POST /api/lab/songs/:id/profiles", () => {
    it("creates a profile for a song", async () => {
      const res = await app.request(
        `/api/lab/songs/${songId}/profiles`,
        json({
          value: JSON.stringify({ Tempo: "120 BPM", Mood: "energetic" }),
        })
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data.songId).toBe(songId);
      expect(body.data.id).toBeDefined();
      profileId = body.data.id;
    });

    it("creates a second profile version for the same song", async () => {
      const res = await app.request(
        `/api/lab/songs/${songId}/profiles`,
        json({
          value: JSON.stringify({ Tempo: "125 BPM", Mood: "upbeat" }),
        })
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data.songId).toBe(songId);
    });

    it("returns 404 for non-existent song", async () => {
      const res = await app.request(
        "/api/lab/songs/nonexistent-xyz/profiles",
        json({
          value: JSON.stringify({ Key: "value" }),
        })
      );
      expect(res.status).toBe(404);
    });

    it("returns 400 for invalid JSON value", async () => {
      const res = await app.request(
        `/api/lab/songs/${songId}/profiles`,
        json({ value: "not valid json" })
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 for JSON array value", async () => {
      const res = await app.request(
        `/api/lab/songs/${songId}/profiles`,
        json({ value: "[]" })
      );
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/lab/songs/:id/profiles", () => {
    it("lists all profiles for a song", async () => {
      const res = await app.request(
        `/api/lab/songs/${songId}/profiles`
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toBeInstanceOf(Array);
      expect(body.data.length).toBeGreaterThanOrEqual(2);
      expect(body.total).toBeGreaterThanOrEqual(2);
    });

    it("returns 404 for non-existent song", async () => {
      const res = await app.request(
        "/api/lab/songs/nonexistent-xyz/profiles"
      );
      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/lab/profiles/:id", () => {
    it("updates a profile value", async () => {
      const res = await app.request(
        `/api/lab/profiles/${profileId}`,
        jsonPut({
          value: JSON.stringify({ Tempo: "130 BPM" }),
        })
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.id).toBe(profileId);
    });

    it("archives a profile", async () => {
      const res = await app.request(
        `/api/lab/profiles/${profileId}`,
        jsonPut({ archived: true })
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.archived).toBe(true);
    });

    it("returns 404 for non-existent profile", async () => {
      const res = await app.request(
        "/api/lab/profiles/nonexistent-xyz",
        jsonPut({ archived: true })
      );
      expect(res.status).toBe(404);
    });
  });

  it("verifies song show includes active profile", async () => {
    // Unarchive the first profile so activeProfile is present
    await app.request(
      `/api/lab/profiles/${profileId}`,
      jsonPut({ archived: false })
    );

    const res = await app.request(`/api/lab/songs/${songId}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.activeProfile).not.toBeNull();
    expect(body.data.activeProfile.songId).toBe(songId);
  });
});

// ─── Lab Import ───────────────────────────────────────────────────────────

describe("Lab Import", () => {
  describe("POST /api/lab/import", () => {
    it("recognizes a Spotify URL (returns 422 without network)", async () => {
      const res = await app.request(
        "/api/lab/import",
        json({ url: "https://open.spotify.com/track/abc123" })
      );
      // fetchSpotifyData fails without network, returning 422
      // This confirms the URL was accepted (not rejected as 400 unsupported)
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error).toBeDefined();
    });

    it("recognizes a spotify.link URL (returns 422 without network)", async () => {
      const res = await app.request(
        "/api/lab/import",
        json({ url: "https://spotify.link/abc123" })
      );
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error).toBeDefined();
    });

    it("returns 400 for unsupported URL", async () => {
      const res = await app.request(
        "/api/lab/import",
        json({ url: "https://example.com/track" })
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBeDefined();
    });

    it("returns 400 for invalid URL", async () => {
      const res = await app.request(
        "/api/lab/import",
        json({ url: "not-a-url" })
      );
      expect(res.status).toBe(400);
    });
  });
});
