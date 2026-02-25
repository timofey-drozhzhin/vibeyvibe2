// @ts-nocheck
process.env.DEV_AUTH_BYPASS = "true";
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "file:../../tmp/local.db";

import { describe, it, expect } from "vitest";
import app from "../../app.js";

const ts = Date.now();

// Generate unique ISRC: 2 alpha + 3 alphanum + 7 digits (use ts last 7 digits)
function uniqueIsrc(suffix: number = 0): string {
  const digits = String(ts + suffix).slice(-7);
  return `TE${String(suffix).padStart(3, "0").slice(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, "A")}${digits}`;
}

// Generate unique ISNI: 16 digits
function uniqueIsni(suffix: number = 0): string {
  return String(ts + suffix).padStart(16, "0").slice(-16);
}

// Generate unique EAN: 13 digits
function uniqueEan(suffix: number = 0): string {
  return String(ts + suffix).padStart(13, "0").slice(-13);
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

// ─── Songs ────────────────────────────────────────────────────────────────────

describe("My Music Songs", () => {
  let createdSongId: string;

  describe("POST /api/my-music/songs", () => {
    it("creates a song with valid data", async () => {
      const isrc = uniqueIsrc(1);
      const res = await app.request(
        "/api/my-music/songs",
        json({
          name: `Test Song ${ts}`,
          isrc,
          releaseDate: "2024-01-15",
          rating: 7,
        })
      );
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.name).toBe(`Test Song ${ts}`);
      expect(data.isrc).toBe(isrc);
      expect(data.rating).toBe(7);
      expect(data.id).toBeDefined();
      expect(data.archived).toBe(false);
      createdSongId = data.id;
    });

    it("creates a song with minimal data", async () => {
      const res = await app.request(
        "/api/my-music/songs",
        json({ name: `Minimal Song ${ts}` })
      );
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.name).toBe(`Minimal Song ${ts}`);
      expect(data.rating).toBe(0);
    });

    it("returns 400 for empty name", async () => {
      const res = await app.request(
        "/api/my-music/songs",
        json({ name: "" })
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 for missing name", async () => {
      const res = await app.request(
        "/api/my-music/songs",
        json({ rating: 5 })
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 for invalid ISRC", async () => {
      const res = await app.request(
        "/api/my-music/songs",
        json({ name: "Bad ISRC", isrc: "INVALID" })
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 for rating above 10", async () => {
      const res = await app.request(
        "/api/my-music/songs",
        json({ name: "Bad Rating", rating: 15 })
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 for rating below 0", async () => {
      const res = await app.request(
        "/api/my-music/songs",
        json({ name: "Bad Rating", rating: -1 })
      );
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/my-music/songs", () => {
    it("returns paginated list of songs", async () => {
      const res = await app.request("/api/my-music/songs");
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toBeInstanceOf(Array);
      expect(typeof data.total).toBe("number");
      expect(data.page).toBe(1);
      expect(data.pageSize).toBe(25);
    });

    it("supports pagination parameters", async () => {
      const res = await app.request(
        "/api/my-music/songs?page=1&pageSize=5"
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.pageSize).toBe(5);
      expect(data.data.length).toBeLessThanOrEqual(5);
    });

    it("supports search filter", async () => {
      const res = await app.request(
        `/api/my-music/songs?search=Test Song ${ts}`
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.length).toBeGreaterThanOrEqual(1);
      expect(data.data[0].name).toContain(`Test Song ${ts}`);
    });

    it("supports sort and order", async () => {
      const res = await app.request(
        "/api/my-music/songs?sort=name&order=asc"
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toBeInstanceOf(Array);
    });
  });

  describe("GET /api/my-music/songs/:id", () => {
    it("returns a single song with artists and albums", async () => {
      const res = await app.request(`/api/my-music/songs/${createdSongId}`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe(createdSongId);
      expect(data.name).toBe(`Test Song ${ts}`);
      expect(data.artists).toBeInstanceOf(Array);
      expect(data.albums).toBeInstanceOf(Array);
    });

    it("returns 404 for non-existent song", async () => {
      const res = await app.request("/api/my-music/songs/nonexistent-id-xyz");
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("PUT /api/my-music/songs/:id", () => {
    it("updates song name", async () => {
      const res = await app.request(
        `/api/my-music/songs/${createdSongId}`,
        jsonPut({ name: `Updated Song ${ts}` })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.name).toBe(`Updated Song ${ts}`);
    });

    it("updates song rating", async () => {
      const res = await app.request(
        `/api/my-music/songs/${createdSongId}`,
        jsonPut({ rating: 9 })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.rating).toBe(9);
    });

    it("archives a song", async () => {
      const res = await app.request(
        `/api/my-music/songs/${createdSongId}`,
        jsonPut({ archived: true })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.archived).toBe(true);
    });

    it("unarchives a song", async () => {
      const res = await app.request(
        `/api/my-music/songs/${createdSongId}`,
        jsonPut({ archived: false })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.archived).toBe(false);
    });

    it("returns 404 for non-existent song", async () => {
      const res = await app.request(
        "/api/my-music/songs/nonexistent-id-xyz",
        jsonPut({ name: "Nope" })
      );
      expect(res.status).toBe(404);
    });
  });
});

// ─── Artists ──────────────────────────────────────────────────────────────────

describe("My Music Artists", () => {
  let createdArtistId: string;

  describe("POST /api/my-music/artists", () => {
    it("creates an artist with valid data", async () => {
      const isni = uniqueIsni(100);
      const res = await app.request(
        "/api/my-music/artists",
        json({
          name: `Test Artist ${ts}`,
          isni,
          rating: 8,
        })
      );
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.name).toBe(`Test Artist ${ts}`);
      expect(data.id).toBeDefined();
      createdArtistId = data.id;
    });

    it("creates an artist with only name", async () => {
      const res = await app.request(
        "/api/my-music/artists",
        json({ name: `Minimal Artist ${ts}` })
      );
      expect(res.status).toBe(201);
    });

    it("returns 400 for empty name", async () => {
      const res = await app.request(
        "/api/my-music/artists",
        json({ name: "" })
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 for invalid ISNI", async () => {
      const res = await app.request(
        "/api/my-music/artists",
        json({ name: "Artist", isni: "12345" })
      );
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/my-music/artists", () => {
    it("returns paginated list", async () => {
      const res = await app.request("/api/my-music/artists");
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toBeInstanceOf(Array);
      expect(typeof data.total).toBe("number");
    });
  });

  describe("GET /api/my-music/artists/:id", () => {
    it("returns single artist with songs", async () => {
      const res = await app.request(
        `/api/my-music/artists/${createdArtistId}`
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe(createdArtistId);
      expect(data.songs).toBeInstanceOf(Array);
    });

    it("returns 404 for non-existent artist", async () => {
      const res = await app.request("/api/my-music/artists/nonexistent-xyz");
      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/my-music/artists/:id", () => {
    it("updates an artist", async () => {
      const res = await app.request(
        `/api/my-music/artists/${createdArtistId}`,
        jsonPut({ name: `Updated Artist ${ts}` })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.name).toBe(`Updated Artist ${ts}`);
    });

    it("archives an artist", async () => {
      const res = await app.request(
        `/api/my-music/artists/${createdArtistId}`,
        jsonPut({ archived: true })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.archived).toBe(true);
    });

    it("returns 404 for non-existent artist", async () => {
      const res = await app.request(
        "/api/my-music/artists/nonexistent-xyz",
        jsonPut({ name: "Nope" })
      );
      expect(res.status).toBe(404);
    });
  });
});

// ─── Albums ───────────────────────────────────────────────────────────────────

describe("My Music Albums", () => {
  let createdAlbumId: string;

  describe("POST /api/my-music/albums", () => {
    it("creates an album with valid data", async () => {
      const ean = uniqueEan(200);
      const res = await app.request(
        "/api/my-music/albums",
        json({
          name: `Test Album ${ts}`,
          ean,
          releaseDate: "2024-06-01",
          rating: 6,
        })
      );
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.name).toBe(`Test Album ${ts}`);
      expect(data.ean).toBe(ean);
      expect(data.id).toBeDefined();
      createdAlbumId = data.id;
    });

    it("returns 400 for empty name", async () => {
      const res = await app.request(
        "/api/my-music/albums",
        json({ name: "" })
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 for invalid EAN", async () => {
      const res = await app.request(
        "/api/my-music/albums",
        json({ name: "Album", ean: "12345" })
      );
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/my-music/albums", () => {
    it("returns paginated list", async () => {
      const res = await app.request("/api/my-music/albums");
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toBeInstanceOf(Array);
      expect(typeof data.total).toBe("number");
    });
  });

  describe("GET /api/my-music/albums/:id", () => {
    it("returns single album with songs", async () => {
      const res = await app.request(
        `/api/my-music/albums/${createdAlbumId}`
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe(createdAlbumId);
      expect(data.songs).toBeInstanceOf(Array);
    });

    it("returns 404 for non-existent album", async () => {
      const res = await app.request("/api/my-music/albums/nonexistent-xyz");
      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/my-music/albums/:id", () => {
    it("updates an album", async () => {
      const res = await app.request(
        `/api/my-music/albums/${createdAlbumId}`,
        jsonPut({ name: `Updated Album ${ts}` })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.name).toBe(`Updated Album ${ts}`);
    });

    it("archives an album", async () => {
      const res = await app.request(
        `/api/my-music/albums/${createdAlbumId}`,
        jsonPut({ archived: true })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.archived).toBe(true);
    });

    it("returns 404 for non-existent album", async () => {
      const res = await app.request(
        "/api/my-music/albums/nonexistent-xyz",
        jsonPut({ name: "Nope" })
      );
      expect(res.status).toBe(404);
    });
  });
});

// ─── Relationships ────────────────────────────────────────────────────────────

describe("My Music Relationships", () => {
  let songId: string;
  let artistId: string;
  let albumId: string;

  it("sets up test song, artist, and album", async () => {
    const songRes = await app.request(
      "/api/my-music/songs",
      json({ name: `Rel Song ${ts}`, rating: 5 })
    );
    const artistRes = await app.request(
      "/api/my-music/artists",
      json({ name: `Rel Artist ${ts}` })
    );
    const albumRes = await app.request(
      "/api/my-music/albums",
      json({ name: `Rel Album ${ts}` })
    );

    expect(songRes.status).toBe(201);
    expect(artistRes.status).toBe(201);
    expect(albumRes.status).toBe(201);

    songId = (await songRes.json()).id;
    artistId = (await artistRes.json()).id;
    albumId = (await albumRes.json()).id;
  });

  describe("POST /api/my-music/songs/:id/artists", () => {
    it("assigns an artist to a song", async () => {
      const res = await app.request(
        `/api/my-music/songs/${songId}/artists`,
        json({ artistId })
      );
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.songId).toBe(songId);
      expect(data.artistId).toBe(artistId);
    });

    it("returns 404 for non-existent song", async () => {
      const res = await app.request(
        "/api/my-music/songs/nonexistent-xyz/artists",
        json({ artistId })
      );
      expect(res.status).toBe(404);
    });

    it("returns 404 for non-existent artist", async () => {
      const res = await app.request(
        `/api/my-music/songs/${songId}/artists`,
        json({ artistId: "nonexistent-xyz" })
      );
      expect(res.status).toBe(404);
    });

    it("returns 400 for missing artistId", async () => {
      const res = await app.request(
        `/api/my-music/songs/${songId}/artists`,
        json({})
      );
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/my-music/songs/:id/albums", () => {
    it("assigns an album to a song", async () => {
      const res = await app.request(
        `/api/my-music/songs/${songId}/albums`,
        json({ albumId })
      );
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.songId).toBe(songId);
      expect(data.albumId).toBe(albumId);
    });

    it("returns 404 for non-existent song", async () => {
      const res = await app.request(
        "/api/my-music/songs/nonexistent-xyz/albums",
        json({ albumId })
      );
      expect(res.status).toBe(404);
    });

    it("returns 404 for non-existent album", async () => {
      const res = await app.request(
        `/api/my-music/songs/${songId}/albums`,
        json({ albumId: "nonexistent-xyz" })
      );
      expect(res.status).toBe(404);
    });
  });

  it("verifies song show includes assigned artist and album", async () => {
    const res = await app.request(`/api/my-music/songs/${songId}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.artists.length).toBeGreaterThanOrEqual(1);
    expect(data.artists.some((a: any) => a.id === artistId)).toBe(true);
    expect(data.albums.length).toBeGreaterThanOrEqual(1);
    expect(data.albums.some((a: any) => a.id === albumId)).toBe(true);
  });
});
