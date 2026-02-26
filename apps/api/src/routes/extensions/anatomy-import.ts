import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { getDb } from "../../db/index.js";
import {
  songs,
  artists,
  albums,
  artistSongs,
  albumSongs,
} from "../../db/schema/index.js";
import { importUrlSchema } from "../../validators/anatomy.js";
import {
  fetchSpotifyData,
  detectSpotifyType,
} from "../../services/spotify/index.js";
import { createStorageClient } from "../../services/storage/index.js";
import { processImage } from "../../services/image/index.js";

const anatomyImport = new Hono();

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

    const rawBuffer = await response.arrayBuffer();
    const processedBuffer = await processImage(rawBuffer);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const storagePath = `${directory}/${uniqueName}.jpg`;

    const storage = createStorageClient();
    await storage.upload(storagePath, processedBuffer, "image/jpeg");

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

anatomyImport.post(
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
// POST /import/confirm -- Create songs + artists from
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

anatomyImport.post(
  "/import/confirm",
  zValidator("json", confirmSchema),
  async (c) => {
    const { tracks } = c.req.valid("json");
    const db = getDb();

    const createdSongs: any[] = [];
    const skippedSongs: { name: string; reason: string }[] = [];
    const imageCache = new Map<string, string>(); // url -> storagePath

    for (const track of tracks) {
      // Check if a song with this spotifyId already exists in anatomy context
      if (track.spotifyId) {
        const existing = await db
          .select()
          .from(songs)
          .where(eq(songs.spotify_uid, track.spotifyId))
          .limit(1);

        const anatomyExisting = existing.filter((s: any) => s.context === "anatomy");
        if (anatomyExisting.length > 0) {
          skippedSongs.push({
            name: track.name,
            reason: "Song with this Spotify ID already exists",
          });
          continue;
        }
      }

      // Check if an ISRC already exists in anatomy context
      if (track.isrc) {
        const existingIsrc = await db
          .select()
          .from(songs)
          .where(eq(songs.isrc, track.isrc))
          .limit(1);

        const anatomyExistingIsrc = existingIsrc.filter((s: any) => s.context === "anatomy");
        if (anatomyExistingIsrc.length > 0) {
          skippedSongs.push({
            name: track.name,
            reason: "Song with this ISRC already exists",
          });
          continue;
        }
      }

      // Create the song record
      const [song] = await db
        .insert(songs)
        .values({
          name: track.name,
          context: "anatomy",
          isrc: track.isrc || null,
          release_date: track.releaseDate || null,
          spotify_uid: track.spotifyId || null,
          image_path: null,
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
            .update(songs)
            .set({ image_path: songImagePath })
            .where(eq(songs.id, song.id));
          song.image_path = songImagePath;
        }
      }

      // Resolve or create artists and link them
      for (const artistData of track.artists) {
        // Look for an existing artist by name (case-insensitive) in anatomy context
        const existingArtist = await db
          .select()
          .from(artists)
          .where(
            sql`LOWER(${artists.name}) = LOWER(${artistData.name}) AND ${artists.context} = 'anatomy'`
          )
          .limit(1);

        let artistId: number;

        if (existingArtist.length > 0) {
          artistId = existingArtist[0].id;
        } else {
          // Create a new artist
          const [newArtist] = await db.insert(artists).values({
            name: artistData.name,
            context: "anatomy",
          }).returning();
          artistId = newArtist.id;
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
              .update(artists)
              .set({ image_path: artistImagePath })
              .where(eq(artists.id, artistId));
          }
        }

        // Link artist to song (ignore duplicates via unique constraint)
        try {
          await db.insert(artistSongs).values({
            song_id: song.id,
            artist_id: artistId,
          });
        } catch {
          // Unique constraint violation -- link already exists
        }
      }

      // Resolve or create album and link it
      if (track.album?.name) {
        const albumName = track.album.name;

        // Look for an existing album by name (case-insensitive) in anatomy context
        const existingAlbum = await db
          .select()
          .from(albums)
          .where(
            sql`LOWER(${albums.name}) = LOWER(${albumName}) AND ${albums.context} = 'anatomy'`
          )
          .limit(1);

        let albumId: number;

        if (existingAlbum.length > 0) {
          albumId = existingAlbum[0].id;
        } else {
          // Create a new album
          const [newAlbum] = await db.insert(albums).values({
            name: albumName,
            context: "anatomy",
            release_date: track.releaseDate || null,
          }).returning();
          albumId = newAlbum.id;

          // Download and store album image (use song cover as best available)
          if (track.imageUrl) {
            const albumImagePath = await downloadAndStoreImage(
              track.imageUrl,
              "songs", // reuse songs directory for album covers
              imageCache
            );
            if (albumImagePath) {
              await db
                .update(albums)
                .set({ image_path: albumImagePath })
                .where(eq(albums.id, albumId));
            }
          }
        }

        // Link album to song (ignore duplicates via unique constraint)
        try {
          await db.insert(albumSongs).values({
            song_id: song.id,
            album_id: albumId,
          });
        } catch {
          // Unique constraint violation -- link already exists
        }
      }

      createdSongs.push(song);
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

export default anatomyImport;
