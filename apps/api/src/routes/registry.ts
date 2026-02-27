import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import {
  songs,
  artists,
  albums,
  artistSongs,
  albumSongs,
  songProfiles,
  vibes,
  songVibes,
  binSources,
  binSongs,
  sunoPromptCollections,
  sunoPrompts,
  sunoCollectionPrompts,
  sunoSongPlaylists,
  sunoSongs,
} from "../db/schema/index.js";
import type { EntityRouteConfig } from "./factory/types.js";

// ---------------------------------------------------------------------------
// Shared Zod Schemas
// ---------------------------------------------------------------------------

// Songs (shared across my_music and lab contexts)
const createSongSchema = z.object({
  name: z.string().min(1).max(200),
  isrc: z.string().nullable().optional(),
  image_path: z.string().nullable().optional(),
  release_date: z.string().nullable().optional(),
  rating: z.number().min(0).max(5).nullable().optional(),
  spotify_uid: z.string().nullable().optional(),
  apple_music_uid: z.string().nullable().optional(),
  youtube_uid: z.string().nullable().optional(),
});

const updateSongSchema = createSongSchema.partial().extend({
  archived: z.boolean().optional(),
});

// Artists (shared across my_music and lab contexts)
const createArtistSchema = z.object({
  name: z.string().min(1).max(200),
  isni: z.string().nullable().optional(),
  image_path: z.string().nullable().optional(),
  rating: z.number().min(0).max(5).nullable().optional(),
});

const updateArtistSchema = createArtistSchema.partial().extend({
  archived: z.boolean().optional(),
});

// Albums (shared across my_music and lab contexts)
const createAlbumSchema = z.object({
  name: z.string().min(1).max(200),
  ean: z.string().nullable().optional(),
  image_path: z.string().nullable().optional(),
  release_date: z.string().nullable().optional(),
  rating: z.number().min(0).max(5).nullable().optional(),
  spotify_uid: z.string().nullable().optional(),
  apple_music_uid: z.string().nullable().optional(),
  youtube_uid: z.string().nullable().optional(),
});

const updateAlbumSchema = createAlbumSchema.partial().extend({
  archived: z.boolean().optional(),
});

// Vibes
const createVibeSchema = z.object({
  name: z.string().min(1).max(100),
  vibe_category: z.string().min(1),
  description: z.string().nullable().optional(),
  instructions: z.string().nullable().optional(),
  examples: z.string().nullable().optional(),
});

const updateVibeSchema = createVibeSchema.partial().extend({
  archived: z.boolean().optional(),
});

// Song Profiles
const createProfileSchema = z.object({
  name: z.string().min(1).max(200),
  song_id: z.number().int().positive(),
  rating: z.number().min(0).max(5).nullable().optional(),
  value: z.string().nullable().optional(),
});

const updateProfileSchema = createProfileSchema.partial().extend({
  archived: z.boolean().optional(),
});

// Bin Sources
const createBinSourceSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().min(1),
});

const updateBinSourceSchema = createBinSourceSchema.partial().extend({
  archived: z.boolean().optional(),
});

// Bin Songs
const createBinSongSchema = z.object({
  name: z.string().min(1).max(200),
  asset_path: z.string().nullable().optional(),
  lyrics: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  rating: z.number().min(0).max(5).nullable().optional(),
  bin_source_id: z.number().int().positive().nullable().optional(),
});

const updateBinSongSchema = createBinSongSchema.partial().extend({
  archived: z.boolean().optional(),
});

// Suno Prompt Collections
const createPromptCollectionSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
});

const updatePromptCollectionSchema = createPromptCollectionSchema.partial().extend({
  archived: z.boolean().optional(),
});

// Suno Prompts
const createSunoPromptSchema = z.object({
  name: z.string().min(1).max(200),
  lyrics: z.string().nullable().optional(),
  prompt: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  song_profile_id: z.number().int().positive().nullable().optional(),
});

const updateSunoPromptSchema = createSunoPromptSchema.partial().extend({
  archived: z.boolean().optional(),
});

// Suno Song Playlists
const createSunoSongPlaylistSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
});

const updateSunoSongPlaylistSchema = createSunoSongPlaylistSchema.partial().extend({
  archived: z.boolean().optional(),
});

// Suno Songs
const createSunoSongSchema = z.object({
  name: z.string().min(1).max(200),
  suno_uid: z.string().min(1),
  image_path: z.string().nullable().optional(),
  suno_prompt_id: z.number().int().positive().nullable().optional(),
  bin_song_id: z.number().int().positive().nullable().optional(),
  suno_song_playlist_id: z.number().int().positive().nullable().optional(),
});

const updateSunoSongSchema = createSunoSongSchema.partial().extend({
  archived: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Enricher helpers
// ---------------------------------------------------------------------------

/**
 * Batch-load artists for an array of song rows via the artistSongs pivot.
 * Context filtering on the artists table is handled implicitly since pivot
 * rows only link songs+artists that were created in the same context.
 */
async function songListEnricher(db: any, rows: any[]) {
  if (rows.length === 0) return rows;
  const songIds = rows.map((r: any) => r.id);
  const pivotRows = await db
    .select({
      songId: artistSongs.song_id,
      artistId: artists.id,
      artistName: artists.name,
    })
    .from(artistSongs)
    .innerJoin(artists, eq(artistSongs.artist_id, artists.id))
    .where(
      sql`${artistSongs.song_id} IN (${sql.join(
        songIds.map((id: number) => sql`${id}`),
        sql`, `
      )})`
    );

  const artistMap: Record<number, { id: number; name: string }[]> = {};
  for (const row of pivotRows) {
    if (!artistMap[row.songId]) artistMap[row.songId] = [];
    artistMap[row.songId].push({ id: row.artistId, name: row.artistName });
  }

  return rows.map((song: any) => ({
    ...song,
    artists: artistMap[song.id] || [],
  }));
}

/**
 * Load related artists and albums for a single song detail view.
 */
async function songDetailEnricher(db: any, entity: any) {
  const [relatedArtists, relatedAlbums] = await Promise.all([
    db
      .select()
      .from(artists)
      .innerJoin(artistSongs, eq(artistSongs.artist_id, artists.id))
      .where(eq(artistSongs.song_id, entity.id)),
    db
      .select()
      .from(albums)
      .innerJoin(albumSongs, eq(albumSongs.album_id, albums.id))
      .where(eq(albumSongs.song_id, entity.id)),
  ]);

  return {
    artists: relatedArtists.map((r: any) => r.artists),
    albums: relatedAlbums.map((r: any) => r.albums),
  };
}


/**
 * Load prompts for a collection detail view.
 */
async function collectionDetailEnricher(db: any, entity: any) {
  const promptRows = await db
    .select()
    .from(sunoPrompts)
    .innerJoin(sunoCollectionPrompts, eq(sunoCollectionPrompts.prompt_id, sunoPrompts.id))
    .where(eq(sunoCollectionPrompts.collection_id, entity.id));

  return {
    prompts: promptRows.map((r: any) => r.suno_prompts),
  };
}


/**
 * Batch-load artists for an array of album rows.
 * Goes through album_songs -> artist_songs to find artists linked to each album's songs.
 */
async function albumListEnricher(db: any, rows: any[]) {
  if (rows.length === 0) return rows;
  const albumIds = rows.map((r: any) => r.id);
  // Join: albumSongs -> artistSongs (on song_id) -> artists
  const pivotRows = await db
    .select({
      albumId: albumSongs.album_id,
      artistId: artists.id,
      artistName: artists.name,
    })
    .from(albumSongs)
    .innerJoin(artistSongs, eq(artistSongs.song_id, albumSongs.song_id))
    .innerJoin(artists, eq(artists.id, artistSongs.artist_id))
    .where(
      sql`${albumSongs.album_id} IN (${sql.join(
        albumIds.map((id: number) => sql`${id}`),
        sql`, `
      )})`
    );

  // Deduplicate artists per album
  const artistMap: Record<number, { id: number; name: string }[]> = {};
  for (const row of pivotRows) {
    if (!artistMap[row.albumId]) artistMap[row.albumId] = [];
    const existing = artistMap[row.albumId];
    if (!existing.some((a) => a.id === row.artistId)) {
      existing.push({ id: row.artistId, name: row.artistName });
    }
  }

  return rows.map((album: any) => ({
    ...album,
    artists: artistMap[album.id] || [],
  }));
}

/**
 * Load related songs for a single artist detail view.
 */
async function artistDetailEnricher(db: any, entity: any) {
  const relatedSongs = await db
    .select()
    .from(songs)
    .innerJoin(artistSongs, eq(artistSongs.song_id, songs.id))
    .where(eq(artistSongs.artist_id, entity.id));

  return {
    songs: relatedSongs.map((r: any) => r.songs),
  };
}

/**
 * Load related songs for a single album detail view.
 */
async function albumDetailEnricher(db: any, entity: any) {
  const relatedSongs = await db
    .select()
    .from(songs)
    .innerJoin(albumSongs, eq(albumSongs.song_id, songs.id))
    .where(eq(albumSongs.album_id, entity.id));

  return {
    songs: relatedSongs.map((r: any) => r.songs),
  };
}

// ---------------------------------------------------------------------------
// Song relationship configs (reused for my_music and lab)
// ---------------------------------------------------------------------------

const songVibePayloadSchema = z.object({
  value: z.string().min(1),
});

const songRelationships = [
  {
    slug: "artists",
    pivotTable: artistSongs,
    relatedTable: artists,
    parentFk: artistSongs.song_id,
    relatedFk: artistSongs.artist_id,
    bodyField: "artistId",
  },
  {
    slug: "albums",
    pivotTable: albumSongs,
    relatedTable: albums,
    parentFk: albumSongs.song_id,
    relatedFk: albumSongs.album_id,
    bodyField: "albumId",
  },
  {
    slug: "vibes",
    pivotTable: songVibes,
    relatedTable: vibes,
    parentFk: songVibes.song_id,
    relatedFk: songVibes.vibe_id,
    bodyField: "vibeId",
    payloadColumns: [
      { name: "value", column: songVibes.value },
    ],
    payloadSchema: songVibePayloadSchema,
  },
];

// ---------------------------------------------------------------------------
// Artist relationship configs (reused for my_music and lab)
// ---------------------------------------------------------------------------

const artistRelationships = [
  {
    slug: "songs",
    pivotTable: artistSongs,
    relatedTable: songs,
    parentFk: artistSongs.artist_id,
    relatedFk: artistSongs.song_id,
    bodyField: "songId",
  },
];

// ---------------------------------------------------------------------------
// Album relationship configs (reused for my_music and lab)
// ---------------------------------------------------------------------------

const albumRelationships = [
  {
    slug: "songs",
    pivotTable: albumSongs,
    relatedTable: songs,
    parentFk: albumSongs.album_id,
    relatedFk: albumSongs.song_id,
    bodyField: "songId",
  },
];

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const registry: EntityRouteConfig[] = [
  // =========================================================================
  // 1. my-music/songs
  // =========================================================================
  {
    context: "my-music",
    slug: "songs",
    table: songs,
    entityName: "Song",
    createSchema: createSongSchema,
    updateSchema: updateSongSchema,
    defaultSort: songs.created_at,
    defaultOrder: "desc",
    sortableColumns: {
      name: songs.name,
      rating: songs.rating,
      release_date: songs.release_date,
      created_at: songs.created_at,
    },
    contextColumnValue: "my_music",
    listEnricher: songListEnricher,
    detailEnricher: songDetailEnricher,
    relationships: songRelationships,
  },

  // =========================================================================
  // 2. my-music/artists
  // =========================================================================
  {
    context: "my-music",
    slug: "artists",
    table: artists,
    entityName: "Artist",
    createSchema: createArtistSchema,
    updateSchema: updateArtistSchema,
    defaultSort: artists.created_at,
    defaultOrder: "desc",
    sortableColumns: {
      name: artists.name,
      rating: artists.rating,
      created_at: artists.created_at,
    },
    contextColumnValue: "my_music",
    detailEnricher: artistDetailEnricher,
    relationships: artistRelationships,
  },

  // =========================================================================
  // 3. my-music/albums
  // =========================================================================
  {
    context: "my-music",
    slug: "albums",
    table: albums,
    entityName: "Album",
    createSchema: createAlbumSchema,
    updateSchema: updateAlbumSchema,
    defaultSort: albums.created_at,
    defaultOrder: "desc",
    sortableColumns: {
      name: albums.name,
      rating: albums.rating,
      release_date: albums.release_date,
      created_at: albums.created_at,
    },
    contextColumnValue: "my_music",
    listEnricher: albumListEnricher,
    detailEnricher: albumDetailEnricher,
    relationships: albumRelationships,
  },

  // =========================================================================
  // 4. lab/songs
  // =========================================================================
  {
    context: "lab",
    slug: "songs",
    table: songs,
    entityName: "Song",
    createSchema: createSongSchema,
    updateSchema: updateSongSchema,
    defaultSort: songs.created_at,
    defaultOrder: "desc",
    sortableColumns: {
      name: songs.name,
      rating: songs.rating,
      release_date: songs.release_date,
      created_at: songs.created_at,
    },
    contextColumnValue: "lab",
    listEnricher: songListEnricher,
    detailEnricher: songDetailEnricher,
    relationships: songRelationships,
  },

  // =========================================================================
  // 5. lab/artists
  // =========================================================================
  {
    context: "lab",
    slug: "artists",
    table: artists,
    entityName: "Artist",
    createSchema: createArtistSchema,
    updateSchema: updateArtistSchema,
    defaultSort: artists.created_at,
    defaultOrder: "desc",
    sortableColumns: {
      name: artists.name,
      rating: artists.rating,
      created_at: artists.created_at,
    },
    contextColumnValue: "lab",
    detailEnricher: artistDetailEnricher,
    relationships: artistRelationships,
  },

  // =========================================================================
  // 6. lab/albums
  // =========================================================================
  {
    context: "lab",
    slug: "albums",
    table: albums,
    entityName: "Album",
    createSchema: createAlbumSchema,
    updateSchema: updateAlbumSchema,
    defaultSort: albums.created_at,
    defaultOrder: "desc",
    sortableColumns: {
      name: albums.name,
      rating: albums.rating,
      release_date: albums.release_date,
      created_at: albums.created_at,
    },
    contextColumnValue: "lab",
    listEnricher: albumListEnricher,
    detailEnricher: albumDetailEnricher,
    relationships: albumRelationships,
  },

  // =========================================================================
  // 7. lab/vibes
  // =========================================================================
  {
    context: "lab",
    slug: "vibes",
    table: vibes,
    entityName: "Vibe",
    createSchema: createVibeSchema,
    updateSchema: updateVibeSchema,
    defaultSort: vibes.created_at,
    defaultOrder: "desc",
    sortableColumns: {
      name: vibes.name,
      vibe_category: vibes.vibe_category,
      created_at: vibes.created_at,
    },
    contextColumnValue: "lab",
    extraFilters: [
      {
        param: "category",
        column: vibes.vibe_category,
        schema: z.string().optional(),
        mode: "eq",
      },
    ],
  },

  // =========================================================================
  // 8. lab/song-profiles
  // =========================================================================
  {
    context: "lab",
    slug: "song-profiles",
    table: songProfiles,
    entityName: "Profile",
    createSchema: createProfileSchema,
    updateSchema: updateProfileSchema,
    defaultSort: songProfiles.created_at,
    defaultOrder: "desc",
    sortableColumns: {
      name: songProfiles.name,
      created_at: songProfiles.created_at,
    },
    contextColumnValue: "lab",
    extraFilters: [
      {
        param: "song_id",
        column: songProfiles.song_id,
        schema: z.coerce.number().int().positive().optional(),
        mode: "eq",
      },
    ],
    fkEnrichments: [
      { column: "song_id", targetTable: songs },
    ],
  },

  // =========================================================================
  // 9. bin/sources
  // =========================================================================
  {
    context: "bin",
    slug: "sources",
    table: binSources,
    entityName: "Source",
    createSchema: createBinSourceSchema,
    updateSchema: updateBinSourceSchema,
    defaultSort: binSources.created_at,
    defaultOrder: "desc",
    sortableColumns: {
      name: binSources.name,
      created_at: binSources.created_at,
    },
    contextColumnValue: "bin",
  },

  // =========================================================================
  // 10. bin/songs
  // =========================================================================
  {
    context: "bin",
    slug: "songs",
    table: binSongs,
    entityName: "Bin Song",
    createSchema: createBinSongSchema,
    updateSchema: updateBinSongSchema,
    defaultSort: binSongs.created_at,
    defaultOrder: "desc",
    sortableColumns: {
      name: binSongs.name,
      rating: binSongs.rating,
      created_at: binSongs.created_at,
    },
    contextColumnValue: "bin",
    extraFilters: [
      {
        param: "bin_source_id",
        column: binSongs.bin_source_id,
        schema: z.coerce.number().int().positive().optional(),
        mode: "eq",
      },
    ],
    fkEnrichments: [
      { column: "bin_source_id", targetTable: binSources },
    ],
  },

  // =========================================================================
  // 11. suno/prompt-collections
  // =========================================================================
  {
    context: "suno",
    slug: "prompt-collections",
    table: sunoPromptCollections,
    entityName: "Collection",
    createSchema: createPromptCollectionSchema,
    updateSchema: updatePromptCollectionSchema,
    defaultSort: sunoPromptCollections.created_at,
    defaultOrder: "desc",
    sortableColumns: {
      name: sunoPromptCollections.name,
      created_at: sunoPromptCollections.created_at,
    },
    contextColumnValue: "suno",
    detailEnricher: collectionDetailEnricher,
    relationships: [
      {
        slug: "prompts",
        pivotTable: sunoCollectionPrompts,
        relatedTable: sunoPrompts,
        parentFk: sunoCollectionPrompts.collection_id,
        relatedFk: sunoCollectionPrompts.prompt_id,
        bodyField: "promptId",
      },
    ],
  },

  // =========================================================================
  // 12. suno/prompts
  // =========================================================================
  {
    context: "suno",
    slug: "prompts",
    table: sunoPrompts,
    entityName: "Prompt",
    createSchema: createSunoPromptSchema,
    updateSchema: updateSunoPromptSchema,
    defaultSort: sunoPrompts.created_at,
    defaultOrder: "desc",
    sortableColumns: {
      name: sunoPrompts.name,
      created_at: sunoPrompts.created_at,
    },
    contextColumnValue: "suno",
    fkEnrichments: [
      { column: "song_profile_id", targetTable: songProfiles },
    ],
  },

  // =========================================================================
  // 13. suno/song-playlists
  // =========================================================================
  {
    context: "suno",
    slug: "song-playlists",
    table: sunoSongPlaylists,
    entityName: "Playlist",
    createSchema: createSunoSongPlaylistSchema,
    updateSchema: updateSunoSongPlaylistSchema,
    defaultSort: sunoSongPlaylists.created_at,
    defaultOrder: "desc",
    sortableColumns: {
      name: sunoSongPlaylists.name,
      created_at: sunoSongPlaylists.created_at,
    },
    contextColumnValue: "suno",
  },

  // =========================================================================
  // 14. suno/songs
  // =========================================================================
  {
    context: "suno",
    slug: "songs",
    table: sunoSongs,
    entityName: "Suno Song",
    createSchema: createSunoSongSchema,
    updateSchema: updateSunoSongSchema,
    defaultSort: sunoSongs.created_at,
    defaultOrder: "desc",
    sortableColumns: {
      name: sunoSongs.name,
      created_at: sunoSongs.created_at,
    },
    contextColumnValue: "suno",
    fkEnrichments: [
      { column: "suno_prompt_id", targetTable: sunoPrompts },
      { column: "bin_song_id", targetTable: binSongs },
    ],
  },
];
