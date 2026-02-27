import { describe, it, expect } from "vitest";

// My Music validators
import {
  createSongSchema,
  updateSongSchema,
  createArtistSchema,
  updateArtistSchema,
  createAlbumSchema,
  updateAlbumSchema,
  assignArtistSchema,
  assignAlbumSchema,
  listQuerySchema,
} from "../my-music.js";

// Lab validators
import {
  createLabSongSchema,
  updateLabSongSchema,
  createLabArtistSchema,
  updateLabArtistSchema,
  createAttributeSchema,
  updateAttributeSchema,
  createProfileSchema,
  updateProfileSchema,
  importUrlSchema,
  smartSearchSchema,
} from "../lab.js";

// Suno validators
import {
  createPromptSchema,
  updatePromptSchema,
  createCollectionSchema,
  updateCollectionSchema,
  assignPromptSchema,
  createGenerationSchema,
  assignGenerationPromptSchema,
} from "../suno.js";

// Bin validators
import {
  createBinSongSchema,
  updateBinSongSchema,
  createBinSourceSchema,
  updateBinSourceSchema,
  importYoutubeSchema,
} from "../bin.js";

// ─── My Music: createSongSchema ───────────────────────────────────────────────

describe("My Music Validators", () => {
  describe("createSongSchema", () => {
    it("accepts valid song data with all fields", () => {
      const result = createSongSchema.safeParse({
        name: "Test Song",
        isrc: "USRC17607839",
        releaseDate: "2024-01-15",
        rating: 7,
        spotifyId: "abc123",
        appleMusicId: "def456",
        youtubeId: "ghi789",
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid song with only required fields", () => {
      const result = createSongSchema.safeParse({ name: "Minimal Song" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rating).toBe(0); // default
      }
    });

    it("rejects empty name", () => {
      const result = createSongSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });

    it("rejects name exceeding 200 characters", () => {
      const result = createSongSchema.safeParse({ name: "x".repeat(201) });
      expect(result.success).toBe(false);
    });

    it("accepts valid ISRC format USRC17607839", () => {
      const result = createSongSchema.safeParse({
        name: "Song",
        isrc: "USRC17607839",
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid ISRC format GBAYE0000351", () => {
      const result = createSongSchema.safeParse({
        name: "Song",
        isrc: "GBAYE0000351",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid ISRC format (too short)", () => {
      const result = createSongSchema.safeParse({
        name: "Song",
        isrc: "USRC176",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid ISRC format (lowercase)", () => {
      const result = createSongSchema.safeParse({
        name: "Song",
        isrc: "usrc17607839",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid ISRC format (with dashes)", () => {
      const result = createSongSchema.safeParse({
        name: "Song",
        isrc: "US-RC1-7607839",
      });
      expect(result.success).toBe(false);
    });

    it("accepts null ISRC", () => {
      const result = createSongSchema.safeParse({
        name: "Song",
        isrc: null,
      });
      expect(result.success).toBe(true);
    });

    it("accepts rating of 0", () => {
      const result = createSongSchema.safeParse({ name: "Song", rating: 0 });
      expect(result.success).toBe(true);
    });

    it("accepts rating of 10", () => {
      const result = createSongSchema.safeParse({ name: "Song", rating: 10 });
      expect(result.success).toBe(true);
    });

    it("rejects rating below 0", () => {
      const result = createSongSchema.safeParse({ name: "Song", rating: -1 });
      expect(result.success).toBe(false);
    });

    it("rejects rating above 10", () => {
      const result = createSongSchema.safeParse({ name: "Song", rating: 11 });
      expect(result.success).toBe(false);
    });

    it("accepts fractional rating", () => {
      const result = createSongSchema.safeParse({ name: "Song", rating: 7.5 });
      expect(result.success).toBe(true);
    });

    it("accepts null imagePath", () => {
      const result = createSongSchema.safeParse({
        name: "Song",
        imagePath: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("updateSongSchema", () => {
    it("accepts partial update (name only)", () => {
      const result = updateSongSchema.safeParse({ name: "Updated" });
      expect(result.success).toBe(true);
    });

    it("accepts archived field", () => {
      const result = updateSongSchema.safeParse({ archived: true });
      expect(result.success).toBe(true);
    });

    it("accepts empty object (all fields optional)", () => {
      const result = updateSongSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe("createArtistSchema", () => {
    it("accepts valid artist with all fields", () => {
      const result = createArtistSchema.safeParse({
        name: "Test Artist",
        isni: "0000000081266381",
        rating: 8,
        spotifyId: "abc",
        youtubeUsername: "@testartist",
        tiktokUsername: "@testartist",
        instagramUsername: "testartist",
      });
      expect(result.success).toBe(true);
    });

    it("accepts artist with only name", () => {
      const result = createArtistSchema.safeParse({ name: "Artist" });
      expect(result.success).toBe(true);
    });

    it("rejects empty name", () => {
      const result = createArtistSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });

    it("accepts valid ISNI (16 digits)", () => {
      const result = createArtistSchema.safeParse({
        name: "Artist",
        isni: "0000000081266381",
      });
      expect(result.success).toBe(true);
    });

    it("accepts ISNI ending with X", () => {
      const result = createArtistSchema.safeParse({
        name: "Artist",
        isni: "000000008126638X",
      });
      expect(result.success).toBe(true);
    });

    it("rejects ISNI with wrong length", () => {
      const result = createArtistSchema.safeParse({
        name: "Artist",
        isni: "12345",
      });
      expect(result.success).toBe(false);
    });

    it("rejects ISNI with letters", () => {
      const result = createArtistSchema.safeParse({
        name: "Artist",
        isni: "000000008126ABCD",
      });
      expect(result.success).toBe(false);
    });

    it("accepts null ISNI", () => {
      const result = createArtistSchema.safeParse({
        name: "Artist",
        isni: null,
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid YouTube username with @", () => {
      const result = createArtistSchema.safeParse({
        name: "Artist",
        youtubeUsername: "@myChannel",
      });
      expect(result.success).toBe(true);
    });

    it("rejects YouTube username without @", () => {
      const result = createArtistSchema.safeParse({
        name: "Artist",
        youtubeUsername: "myChannel",
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid TikTok username with @", () => {
      const result = createArtistSchema.safeParse({
        name: "Artist",
        tiktokUsername: "@myTiktok",
      });
      expect(result.success).toBe(true);
    });

    it("rejects TikTok username without @", () => {
      const result = createArtistSchema.safeParse({
        name: "Artist",
        tiktokUsername: "myTiktok",
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid Instagram username", () => {
      const result = createArtistSchema.safeParse({
        name: "Artist",
        instagramUsername: "my_insta.name",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("updateArtistSchema", () => {
    it("accepts partial update", () => {
      const result = updateArtistSchema.safeParse({ name: "Updated" });
      expect(result.success).toBe(true);
    });

    it("accepts archived field", () => {
      const result = updateArtistSchema.safeParse({ archived: true });
      expect(result.success).toBe(true);
    });
  });

  describe("createAlbumSchema", () => {
    it("accepts valid album with all fields", () => {
      const result = createAlbumSchema.safeParse({
        name: "Test Album",
        ean: "1234567890123",
        releaseDate: "2024-03-01",
        rating: 9,
      });
      expect(result.success).toBe(true);
    });

    it("accepts album with only name", () => {
      const result = createAlbumSchema.safeParse({ name: "Album" });
      expect(result.success).toBe(true);
    });

    it("rejects empty name", () => {
      const result = createAlbumSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });

    it("accepts valid EAN (13 digits)", () => {
      const result = createAlbumSchema.safeParse({
        name: "Album",
        ean: "1234567890123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects EAN with wrong length", () => {
      const result = createAlbumSchema.safeParse({
        name: "Album",
        ean: "12345",
      });
      expect(result.success).toBe(false);
    });

    it("rejects EAN with letters", () => {
      const result = createAlbumSchema.safeParse({
        name: "Album",
        ean: "123456789012A",
      });
      expect(result.success).toBe(false);
    });

    it("accepts null EAN", () => {
      const result = createAlbumSchema.safeParse({
        name: "Album",
        ean: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("updateAlbumSchema", () => {
    it("accepts partial update", () => {
      const result = updateAlbumSchema.safeParse({ rating: 5 });
      expect(result.success).toBe(true);
    });

    it("accepts archived field", () => {
      const result = updateAlbumSchema.safeParse({ archived: true });
      expect(result.success).toBe(true);
    });
  });

  describe("assignArtistSchema", () => {
    it("accepts valid artistId", () => {
      const result = assignArtistSchema.safeParse({ artistId: "abc123" });
      expect(result.success).toBe(true);
    });

    it("rejects empty artistId", () => {
      const result = assignArtistSchema.safeParse({ artistId: "" });
      expect(result.success).toBe(false);
    });

    it("rejects missing artistId", () => {
      const result = assignArtistSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("assignAlbumSchema", () => {
    it("accepts valid albumId", () => {
      const result = assignAlbumSchema.safeParse({ albumId: "abc123" });
      expect(result.success).toBe(true);
    });

    it("rejects empty albumId", () => {
      const result = assignAlbumSchema.safeParse({ albumId: "" });
      expect(result.success).toBe(false);
    });

    it("rejects missing albumId", () => {
      const result = assignAlbumSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("listQuerySchema", () => {
    it("accepts valid query with all fields", () => {
      const result = listQuerySchema.safeParse({
        page: "2",
        pageSize: "10",
        sort: "name",
        order: "asc",
        search: "hello",
        archived: "true",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.pageSize).toBe(10);
      }
    });

    it("applies defaults for empty query", () => {
      const result = listQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(25);
        expect(result.data.order).toBe("desc");
      }
    });

    it("rejects page of 0", () => {
      const result = listQuerySchema.safeParse({ page: "0" });
      expect(result.success).toBe(false);
    });

    it("rejects negative page", () => {
      const result = listQuerySchema.safeParse({ page: "-1" });
      expect(result.success).toBe(false);
    });

    it("rejects pageSize over 100", () => {
      const result = listQuerySchema.safeParse({ pageSize: "101" });
      expect(result.success).toBe(false);
    });

    it("rejects pageSize of 0", () => {
      const result = listQuerySchema.safeParse({ pageSize: "0" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid order value", () => {
      const result = listQuerySchema.safeParse({ order: "random" });
      expect(result.success).toBe(false);
    });

    it("coerces string numbers to numbers", () => {
      const result = listQuerySchema.safeParse({ page: "3", pageSize: "50" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.pageSize).toBe(50);
      }
    });
  });
});

// ─── Lab Validators ────────────────────────────────────────────────────────

describe("Lab Validators", () => {
  describe("createLabSongSchema", () => {
    it("accepts valid lab song", () => {
      const result = createLabSongSchema.safeParse({
        name: "Lab Song",
        isrc: "USRC17607839",
        releaseDate: "2024-06-01",
        rating: 8,
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing required ISRC", () => {
      const result = createLabSongSchema.safeParse({
        name: "Song",
        releaseDate: "2024-01-01",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing required release date", () => {
      const result = createLabSongSchema.safeParse({
        name: "Song",
        isrc: "USRC17607839",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty release date", () => {
      const result = createLabSongSchema.safeParse({
        name: "Song",
        isrc: "USRC17607839",
        releaseDate: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid ISRC format", () => {
      const result = createLabSongSchema.safeParse({
        name: "Song",
        isrc: "INVALID",
        releaseDate: "2024-01-01",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateLabSongSchema", () => {
    it("accepts partial update", () => {
      const result = updateLabSongSchema.safeParse({ rating: 9 });
      expect(result.success).toBe(true);
    });

    it("accepts archived field", () => {
      const result = updateLabSongSchema.safeParse({ archived: true });
      expect(result.success).toBe(true);
    });
  });

  describe("createLabArtistSchema", () => {
    it("accepts valid lab artist", () => {
      const result = createLabArtistSchema.safeParse({
        name: "Lab Artist",
        isni: "0000000081266381",
        rating: 5,
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing required ISNI", () => {
      const result = createLabArtistSchema.safeParse({
        name: "Artist",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid ISNI format", () => {
      const result = createLabArtistSchema.safeParse({
        name: "Artist",
        isni: "INVALID",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateLabArtistSchema", () => {
    it("accepts partial update", () => {
      const result = updateLabArtistSchema.safeParse({ name: "Updated" });
      expect(result.success).toBe(true);
    });

    it("accepts archived field", () => {
      const result = updateLabArtistSchema.safeParse({ archived: true });
      expect(result.success).toBe(true);
    });
  });

  describe("createAttributeSchema", () => {
    it("accepts valid attribute with all fields", () => {
      const result = createAttributeSchema.safeParse({
        name: "Tempo",
        description: "The speed of the song",
        instruction: "Specify BPM",
        examples: "120 BPM, 90 BPM",
      });
      expect(result.success).toBe(true);
    });

    it("accepts attribute with only name", () => {
      const result = createAttributeSchema.safeParse({ name: "Mood" });
      expect(result.success).toBe(true);
    });

    it("rejects empty name", () => {
      const result = createAttributeSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });

    it("rejects name exceeding 100 characters", () => {
      const result = createAttributeSchema.safeParse({
        name: "x".repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it("accepts null description", () => {
      const result = createAttributeSchema.safeParse({
        name: "Attr",
        description: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("updateAttributeSchema", () => {
    it("accepts partial update", () => {
      const result = updateAttributeSchema.safeParse({
        description: "Updated",
      });
      expect(result.success).toBe(true);
    });

    it("accepts archived field", () => {
      const result = updateAttributeSchema.safeParse({ archived: true });
      expect(result.success).toBe(true);
    });
  });

  describe("createProfileSchema", () => {
    it("accepts valid JSON object string", () => {
      const result = createProfileSchema.safeParse({
        value: JSON.stringify({ Tempo: "120 BPM", Mood: "happy" }),
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty JSON object string", () => {
      const result = createProfileSchema.safeParse({
        value: "{}",
      });
      expect(result.success).toBe(true);
    });

    it("rejects JSON array string", () => {
      const result = createProfileSchema.safeParse({
        value: "[]",
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-JSON string", () => {
      const result = createProfileSchema.safeParse({
        value: "not json",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing value", () => {
      const result = createProfileSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects JSON number string", () => {
      const result = createProfileSchema.safeParse({ value: "42" });
      expect(result.success).toBe(false);
    });

    it("rejects JSON string value", () => {
      const result = createProfileSchema.safeParse({
        value: '"hello"',
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateProfileSchema", () => {
    it("accepts valid JSON object value", () => {
      const result = updateProfileSchema.safeParse({
        value: JSON.stringify({ Key: "val" }),
      });
      expect(result.success).toBe(true);
    });

    it("accepts archived field", () => {
      const result = updateProfileSchema.safeParse({ archived: true });
      expect(result.success).toBe(true);
    });

    it("accepts empty object (all optional)", () => {
      const result = updateProfileSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("rejects invalid JSON value", () => {
      const result = updateProfileSchema.safeParse({ value: "bad json" });
      expect(result.success).toBe(false);
    });
  });

  describe("importUrlSchema", () => {
    it("accepts valid URL", () => {
      const result = importUrlSchema.safeParse({
        url: "https://open.spotify.com/track/abc123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid URL", () => {
      const result = importUrlSchema.safeParse({ url: "not-a-url" });
      expect(result.success).toBe(false);
    });

    it("rejects missing url", () => {
      const result = importUrlSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("smartSearchSchema", () => {
    it("accepts valid search query", () => {
      const result = smartSearchSchema.safeParse({ q: "test" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.pageSize).toBe(25);
      }
    });

    it("rejects empty query", () => {
      const result = smartSearchSchema.safeParse({ q: "" });
      expect(result.success).toBe(false);
    });

    it("rejects missing query", () => {
      const result = smartSearchSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("accepts custom page and pageSize", () => {
      const result = smartSearchSchema.safeParse({
        q: "search",
        page: "3",
        pageSize: "50",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.pageSize).toBe(50);
      }
    });
  });
});

// ─── Suno Validators ──────────────────────────────────────────────────────────

describe("Suno Validators", () => {
  describe("createPromptSchema", () => {
    it("accepts valid prompt with all fields", () => {
      const result = createPromptSchema.safeParse({
        lyrics: "Some lyrics here",
        style: "pop, upbeat",
        voiceGender: "female",
        notes: "Test notes",
        profileId: "profile-123",
        rating: 7,
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty prompt (all fields optional)", () => {
      const result = createPromptSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("accepts valid voiceGender values", () => {
      for (const gender of ["male", "female", "neutral"]) {
        const result = createPromptSchema.safeParse({ voiceGender: gender });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid voiceGender", () => {
      const result = createPromptSchema.safeParse({ voiceGender: "other" });
      expect(result.success).toBe(false);
    });

    it("accepts null voiceGender", () => {
      const result = createPromptSchema.safeParse({ voiceGender: null });
      expect(result.success).toBe(true);
    });

    it("rejects rating above 10", () => {
      const result = createPromptSchema.safeParse({ rating: 11 });
      expect(result.success).toBe(false);
    });

    it("rejects rating below 0", () => {
      const result = createPromptSchema.safeParse({ rating: -1 });
      expect(result.success).toBe(false);
    });
  });

  describe("updatePromptSchema", () => {
    it("accepts partial update", () => {
      const result = updatePromptSchema.safeParse({ lyrics: "Updated lyrics" });
      expect(result.success).toBe(true);
    });

    it("accepts archived field", () => {
      const result = updatePromptSchema.safeParse({ archived: true });
      expect(result.success).toBe(true);
    });
  });

  describe("createCollectionSchema", () => {
    it("accepts valid collection", () => {
      const result = createCollectionSchema.safeParse({
        name: "My Collection",
        description: "A test collection",
      });
      expect(result.success).toBe(true);
    });

    it("accepts collection with only name", () => {
      const result = createCollectionSchema.safeParse({ name: "Collection" });
      expect(result.success).toBe(true);
    });

    it("rejects empty name", () => {
      const result = createCollectionSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });

    it("rejects name exceeding 200 chars", () => {
      const result = createCollectionSchema.safeParse({
        name: "x".repeat(201),
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing name", () => {
      const result = createCollectionSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("updateCollectionSchema", () => {
    it("accepts partial update", () => {
      const result = updateCollectionSchema.safeParse({
        description: "Updated",
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty object", () => {
      const result = updateCollectionSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe("assignPromptSchema", () => {
    it("accepts valid promptId", () => {
      const result = assignPromptSchema.safeParse({ promptId: "prompt-1" });
      expect(result.success).toBe(true);
    });

    it("rejects empty promptId", () => {
      const result = assignPromptSchema.safeParse({ promptId: "" });
      expect(result.success).toBe(false);
    });

    it("rejects missing promptId", () => {
      const result = assignPromptSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("createGenerationSchema", () => {
    it("accepts valid generation with all fields", () => {
      const result = createGenerationSchema.safeParse({
        sunoId: "suno-abc",
        binSongId: "bin-123",
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty generation (all optional)", () => {
      const result = createGenerationSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("accepts null sunoId", () => {
      const result = createGenerationSchema.safeParse({ sunoId: null });
      expect(result.success).toBe(true);
    });
  });

  describe("assignGenerationPromptSchema", () => {
    it("accepts valid promptId", () => {
      const result = assignGenerationPromptSchema.safeParse({
        promptId: "prompt-1",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty promptId", () => {
      const result = assignGenerationPromptSchema.safeParse({ promptId: "" });
      expect(result.success).toBe(false);
    });
  });
});

// ─── Bin Validators ───────────────────────────────────────────────────────────

describe("Bin Validators", () => {
  describe("createBinSongSchema", () => {
    it("accepts valid bin song", () => {
      const result = createBinSongSchema.safeParse({
        name: "Bin Song",
        sourceId: "source-1",
        assetPath: "/songs/file.mp3",
        sourceUrl: "https://example.com/song",
      });
      expect(result.success).toBe(true);
    });

    it("accepts bin song with only name", () => {
      const result = createBinSongSchema.safeParse({ name: "Song" });
      expect(result.success).toBe(true);
    });

    it("rejects empty name", () => {
      const result = createBinSongSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid sourceUrl", () => {
      const result = createBinSongSchema.safeParse({
        name: "Song",
        sourceUrl: "not-a-url",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateBinSongSchema", () => {
    it("accepts partial update", () => {
      const result = updateBinSongSchema.safeParse({ name: "Updated" });
      expect(result.success).toBe(true);
    });

    it("accepts archived field", () => {
      const result = updateBinSongSchema.safeParse({ archived: true });
      expect(result.success).toBe(true);
    });
  });

  describe("createBinSourceSchema", () => {
    it("accepts valid source", () => {
      const result = createBinSourceSchema.safeParse({
        name: "YouTube",
        url: "https://youtube.com",
      });
      expect(result.success).toBe(true);
    });

    it("accepts source with only name", () => {
      const result = createBinSourceSchema.safeParse({ name: "Source" });
      expect(result.success).toBe(true);
    });

    it("rejects empty name", () => {
      const result = createBinSourceSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid url", () => {
      const result = createBinSourceSchema.safeParse({
        name: "Src",
        url: "bad",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateBinSourceSchema", () => {
    it("accepts archived field", () => {
      const result = updateBinSourceSchema.safeParse({ archived: true });
      expect(result.success).toBe(true);
    });
  });

  describe("importYoutubeSchema", () => {
    it("accepts valid YouTube URL", () => {
      const result = importYoutubeSchema.safeParse({
        url: "https://www.youtube.com/watch?v=abc",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid URL", () => {
      const result = importYoutubeSchema.safeParse({ url: "not-a-url" });
      expect(result.success).toBe(false);
    });
  });
});
