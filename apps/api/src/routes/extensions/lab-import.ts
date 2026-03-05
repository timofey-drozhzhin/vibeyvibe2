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
const importUrlSchema = z.object({
  url: z.string().url("Must be a valid URL"),
});
import {
  fetchSpotifyData,
  detectSpotifyType,
} from "../../services/spotify/index.js";
import { createStorageClient } from "../../services/storage/index.js";
import { processImage } from "../../services/image/index.js";

const labImport = new Hono();

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

/**
 * Find an existing lab artist by Spotify UID or case-insensitive name.
 * Returns the record if found, null otherwise.
 */
async function findExistingLabArtist(
  db: ReturnType<typeof getDb>,
  name: string,
  spotifyId?: string
) {
  if (spotifyId) {
    const found = await db
      .select()
      .from(artists)
      .where(
        sql`${artists.spotify_uid} = ${spotifyId} AND ${artists.context} = 'lab'`
      )
      .limit(1);
    if (found.length > 0) return found[0];
  }
  const found = await db
    .select()
    .from(artists)
    .where(
      sql`LOWER(${artists.name}) = LOWER(${name}) AND ${artists.context} = 'lab'`
    )
    .limit(1);
  return found.length > 0 ? found[0] : null;
}

/**
 * Find an existing lab album by Spotify UID or case-insensitive name.
 * Returns the record if found, null otherwise.
 */
async function findExistingLabAlbum(
  db: ReturnType<typeof getDb>,
  name: string,
  spotifyId?: string
) {
  if (spotifyId) {
    const found = await db
      .select()
      .from(albums)
      .where(
        sql`${albums.spotify_uid} = ${spotifyId} AND ${albums.context} = 'lab'`
      )
      .limit(1);
    if (found.length > 0) return found[0];
  }
  const found = await db
    .select()
    .from(albums)
    .where(
      sql`LOWER(${albums.name}) = LOWER(${name}) AND ${albums.context} = 'lab'`
    )
    .limit(1);
  return found.length > 0 ? found[0] : null;
}

/**
 * Find an existing lab song by Spotify UID or ISRC.
 * Returns the record if found, null otherwise.
 */
async function findExistingLabSong(
  db: ReturnType<typeof getDb>,
  spotifyId: string,
  isrc?: string | null
) {
  if (spotifyId) {
    const found = await db
      .select()
      .from(songs)
      .where(
        sql`${songs.spotify_uid} = ${spotifyId} AND ${songs.context} = 'lab'`
      )
      .limit(1);
    if (found.length > 0) return found[0];
  }
  if (isrc) {
    const found = await db
      .select()
      .from(songs)
      .where(
        sql`${songs.isrc} = ${isrc} AND ${songs.context} = 'lab'`
      )
      .limit(1);
    if (found.length > 0) return found[0];
  }
  return null;
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

labImport.post(
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
      const db = getDb();

      // Check which songs, artists, and albums already exist in the lab
      const existingSongs: string[] = [];
      const existingArtistKeys: string[] = [];
      const existingAlbumKeys: string[] = [];

      const checkedArtists = new Map<string, boolean>();
      const checkedAlbums = new Map<string, boolean>();

      for (const track of result.tracks) {
        if (await findExistingLabSong(db, track.spotifyId, track.isrc)) {
          existingSongs.push(track.spotifyId);
        }

        for (const a of track.artists) {
          const key = a.spotifyId || a.name.toLowerCase();
          if (!checkedArtists.has(key)) {
            const found = await findExistingLabArtist(db, a.name, a.spotifyId);
            checkedArtists.set(key, !!found);
            if (found) existingArtistKeys.push(key);
          }
        }

        if (track.album?.name) {
          const key = track.album.spotifyId || track.album.name.toLowerCase();
          if (!checkedAlbums.has(key)) {
            const found = await findExistingLabAlbum(db, track.album.name, track.album.spotifyId);
            checkedAlbums.set(key, !!found);
            if (found) existingAlbumKeys.push(key);
          }
        }
      }

      return c.json({
        data: {
          type: result.type,
          url,
          tracks: result.tracks,
          existing: {
            songs: existingSongs,
            artists: existingArtistKeys,
            albums: existingAlbumKeys,
          },
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
  artists: z.array(z.object({
    name: z.string().min(1),
    spotifyId: z.string().optional(),
    imageUrl: z.string().nullable().optional(),
  })).min(1),
  album: z.object({
    name: z.string(),
    spotifyId: z.string().optional(),
  }).nullable().optional(),
  releaseDate: z.string().nullable().optional(),
  isrc: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  spotifyId: z.string().min(1),
});

const confirmSchema = z.object({
  tracks: z.array(confirmTrackSchema).min(1),
});

labImport.post(
  "/import/confirm",
  zValidator("json", confirmSchema),
  async (c) => {
    const { tracks } = c.req.valid("json");
    const db = getDb();

    const createdSongs: any[] = [];
    const updatedSongs: any[] = [];
    const imageCache = new Map<string, string>(); // url -> storagePath
    const createdArtistNames = new Set<string>();
    const updatedArtistNames = new Set<string>();
    const createdAlbumNames = new Set<string>();
    const updatedAlbumNames = new Set<string>();

    for (const track of tracks) {
      const now = new Date().toISOString();
      let song: any;
      let isUpdate = false;

      // Check if song already exists in lab context
      const existingSong = await findExistingLabSong(db, track.spotifyId, track.isrc);
      if (existingSong) {
        // Update existing song with fresh Spotify data
        isUpdate = true;
        const updateFields: Record<string, any> = {
          name: track.name,
          isrc: track.isrc || null,
          release_date: track.releaseDate || null,
          spotify_uid: track.spotifyId || null,
          updated_at: now,
        };

        // Download and store the song cover image
        if (track.imageUrl) {
          const songImagePath = await downloadAndStoreImage(
            track.imageUrl,
            "songs",
            imageCache
          );
          if (songImagePath) {
            updateFields.image_path = songImagePath;
          }
        }

        await db
          .update(songs)
          .set(updateFields)
          .where(eq(songs.id, existingSong.id));
        song = { ...existingSong, ...updateFields };
      } else {
        // Create a new song record
        const [newSong] = await db
          .insert(songs)
          .values({
            name: track.name,
            context: "lab",
            isrc: track.isrc || null,
            release_date: track.releaseDate || null,
            spotify_uid: track.spotifyId || null,
            image_path: null,
            created_at: now,
            updated_at: now,
          })
          .returning();
        song = newSong;

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
      }

      // Resolve or create artists and link them
      for (const artistData of track.artists) {
        const existingArtistRecord = await findExistingLabArtist(db, artistData.name, artistData.spotifyId);

        let artistId: number;

        if (existingArtistRecord) {
          artistId = existingArtistRecord.id;
          updatedArtistNames.add(artistData.name);
          // Overwrite existing artist with fresh Spotify data
          await db
            .update(artists)
            .set({
              name: artistData.name,
              spotify_uid: artistData.spotifyId || existingArtistRecord.spotify_uid,
              updated_at: new Date().toISOString(),
            })
            .where(eq(artists.id, artistId));
        } else {
          // Create a new artist
          const artistNow = new Date().toISOString();
          const [newArtist] = await db.insert(artists).values({
            name: artistData.name,
            context: "lab",
            spotify_uid: artistData.spotifyId || null,
            created_at: artistNow,
            updated_at: artistNow,
          }).returning();
          artistId = newArtist.id;
          createdArtistNames.add(artistData.name);
        }

        // Download and store artist image (prefer artist-specific, fall back to song cover)
        const artistImageUrl = artistData.imageUrl || track.imageUrl;
        if (artistImageUrl) {
          const artistImagePath = await downloadAndStoreImage(
            artistImageUrl,
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
        const existingAlbumRecord = await findExistingLabAlbum(db, albumName, track.album.spotifyId);

        let albumId: number;

        if (existingAlbumRecord) {
          albumId = existingAlbumRecord.id;
          updatedAlbumNames.add(albumName);
          // Overwrite existing album with fresh Spotify data
          const albumUpdateFields: Record<string, any> = {
            name: albumName,
            release_date: track.releaseDate || null,
            spotify_uid: track.album.spotifyId || existingAlbumRecord.spotify_uid,
            updated_at: new Date().toISOString(),
          };

          // Re-download album image
          if (track.imageUrl) {
            const albumImagePath = await downloadAndStoreImage(
              track.imageUrl,
              "songs", // reuse songs directory for album covers
              imageCache
            );
            if (albumImagePath) {
              albumUpdateFields.image_path = albumImagePath;
            }
          }

          await db
            .update(albums)
            .set(albumUpdateFields)
            .where(eq(albums.id, albumId));
        } else {
          // Create a new album
          const albumNow = new Date().toISOString();
          const [newAlbum] = await db.insert(albums).values({
            name: albumName,
            context: "lab",
            release_date: track.releaseDate || null,
            spotify_uid: track.album.spotifyId || null,
            created_at: albumNow,
            updated_at: albumNow,
          }).returning();
          albumId = newAlbum.id;
          createdAlbumNames.add(albumName);

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

      if (isUpdate) {
        updatedSongs.push(song);
      } else {
        createdSongs.push(song);
      }
    }

    return c.json({
      data: {
        created: createdSongs,
        updated: updatedSongs,
        totalCreated: createdSongs.length,
        totalUpdated: updatedSongs.length,
        artistsCreated: createdArtistNames.size,
        artistsUpdated: updatedArtistNames.size,
        albumsCreated: createdAlbumNames.size,
        albumsUpdated: updatedAlbumNames.size,
      },
    });
  }
);

export default labImport;
