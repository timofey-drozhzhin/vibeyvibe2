import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { nanoid } from "nanoid";
import { eq, sql } from "drizzle-orm";
import { getDb } from "../../db/index.js";
import {
  anatomySongs,
  anatomyArtists,
  anatomySongArtists,
} from "../../db/schema/anatomy.js";
import { importUrlSchema } from "../../validators/anatomy.js";
import {
  fetchSpotifyData,
  detectSpotifyType,
} from "../../services/spotify/index.js";
import { createStorageClient } from "../../services/storage/index.js";

export const anatomyImportRoutes = new Hono();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Download an image from a URL and upload it to storage.
 * Uses a per-request cache to avoid re-downloading the same URL.
 * Returns the storage path on success, or null on failure.
 */
async function downloadAndStoreImage(
  imageUrl: string,
  directory: "songs" | "artists",
  cache: Map<string, string>
): Promise<string | null> {
  const cacheKey = `${directory}:${imageUrl}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png") ? ".png" : ".jpg";
    const storagePath = `${directory}/${nanoid()}${ext}`;

    const storage = createStorageClient();
    await storage.upload(storagePath, buffer, contentType);

    cache.set(cacheKey, storagePath);
    return storagePath;
  } catch {
    // Image download/upload failure must not block song creation
    return null;
  }
}

function detectUrlType(url: string): "spotify" | "unknown" {
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname === "open.spotify.com" ||
      parsed.hostname === "spotify.link"
    ) {
      return "spotify";
    }
    return "unknown";
  } catch {
    return "unknown";
  }
}

// ---------------------------------------------------------------------------
// POST /import -- Preview: parse a Spotify URL and return extracted tracks
// ---------------------------------------------------------------------------

anatomyImportRoutes.post(
  "/import",
  zValidator("json", importUrlSchema),
  async (c) => {
    const { url } = c.req.valid("json");
    const provider = detectUrlType(url);

    if (provider === "unknown") {
      return c.json(
        {
          error:
            "Unsupported URL. Currently only Spotify URLs are supported.",
        },
        400
      );
    }

    try {
      const result = await fetchSpotifyData(url);

      return c.json({
        data: {
          type: result.type,
          url,
          tracks: result.tracks,
        },
      });
    } catch (err: any) {
      return c.json(
        {
          error: err?.message ?? "Failed to fetch data from Spotify.",
        },
        422
      );
    }
  }
);

// ---------------------------------------------------------------------------
// POST /import/confirm -- Create anatomy_songs + anatomy_artists from
// the previously previewed data.
// ---------------------------------------------------------------------------

const confirmTrackSchema = z.object({
  name: z.string().min(1),
  artists: z.array(z.object({ name: z.string().min(1) })).min(1),
  album: z.object({ name: z.string() }).nullable().optional(),
  releaseDate: z.string().nullable().optional(),
  isrc: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  spotifyId: z.string().min(1),
});

const confirmSchema = z.object({
  tracks: z.array(confirmTrackSchema).min(1),
});

anatomyImportRoutes.post(
  "/import/confirm",
  zValidator("json", confirmSchema),
  async (c) => {
    const { tracks } = c.req.valid("json");
    const db = getDb();

    const createdSongs: any[] = [];
    const skippedSongs: { name: string; reason: string }[] = [];
    const imageCache = new Map<string, string>(); // url -> storagePath

    for (const track of tracks) {
      // Generate a placeholder ISRC if one was not provided.
      // ISRC is required and unique in the anatomy_songs table.
      const isrc = track.isrc || `IMPORT${nanoid(7).toUpperCase()}`;

      // Check if a song with this spotifyId already exists
      if (track.spotifyId) {
        const existing = await db
          .select()
          .from(anatomySongs)
          .where(eq(anatomySongs.spotifyId, track.spotifyId))
          .limit(1);

        if (existing.length > 0) {
          skippedSongs.push({
            name: track.name,
            reason: "Song with this Spotify ID already exists",
          });
          continue;
        }
      }

      // Check if an ISRC already exists (for provided ISRCs)
      if (track.isrc) {
        const existingIsrc = await db
          .select()
          .from(anatomySongs)
          .where(eq(anatomySongs.isrc, track.isrc))
          .limit(1);

        if (existingIsrc.length > 0) {
          skippedSongs.push({
            name: track.name,
            reason: "Song with this ISRC already exists",
          });
          continue;
        }
      }

      // Create the song record
      const songId = nanoid();
      const song = await db
        .insert(anatomySongs)
        .values({
          id: songId,
          name: track.name,
          isrc,
          releaseDate: track.releaseDate || "Unknown",
          spotifyId: track.spotifyId || null,
          imagePath: null,
        })
        .returning();

      // Download and store the song cover image
      if (track.imageUrl) {
        const songImagePath = await downloadAndStoreImage(
          track.imageUrl,
          "songs",
          imageCache
        );
        if (songImagePath) {
          await db
            .update(anatomySongs)
            .set({ imagePath: songImagePath })
            .where(eq(anatomySongs.id, songId));
          song[0].imagePath = songImagePath;
        }
      }

      // Resolve or create artists and link them
      for (const artistData of track.artists) {
        // Look for an existing artist by name (case-insensitive)
        const existingArtist = await db
          .select()
          .from(anatomyArtists)
          .where(
            sql`LOWER(${anatomyArtists.name}) = LOWER(${artistData.name})`
          )
          .limit(1);

        let artistId: string;

        if (existingArtist.length > 0) {
          artistId = existingArtist[0].id;
        } else {
          // Create a new artist with a placeholder ISNI
          artistId = nanoid();
          const placeholderIsni = `0000000${Date.now().toString().slice(-9)}`;
          await db.insert(anatomyArtists).values({
            id: artistId,
            name: artistData.name,
            isni: placeholderIsni,
          });
        }

        // Download and store artist image (use song cover as best available)
        if (track.imageUrl) {
          const artistImagePath = await downloadAndStoreImage(
            track.imageUrl,
            "artists",
            imageCache
          );
          if (artistImagePath) {
            await db
              .update(anatomyArtists)
              .set({ imagePath: artistImagePath })
              .where(eq(anatomyArtists.id, artistId));
          }
        }

        // Link artist to song (ignore duplicates via unique constraint)
        try {
          await db.insert(anatomySongArtists).values({
            id: nanoid(),
            songId,
            artistId,
          });
        } catch {
          // Unique constraint violation — link already exists
        }
      }

      createdSongs.push(song[0]);
    }

    return c.json({
      data: {
        created: createdSongs,
        skipped: skippedSongs,
        totalCreated: createdSongs.length,
        totalSkipped: skippedSongs.length,
      },
    });
  }
);
