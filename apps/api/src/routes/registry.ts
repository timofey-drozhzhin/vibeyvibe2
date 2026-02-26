import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import {
  songs,
  artists,
  albums,
  artistSongs,
  albumSongs,
  songProfiles,
  songAttributes,
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

// Songs (shared across my_music and anatomy contexts)
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

// Artists (shared across my_music and anatomy contexts)
const createArtistSchema = z.object({
  name: z.string().min(1).max(200),
  isni: z.string().nullable().optional(),
  image_path: z.string().nullable().optional(),
  rating: z.number().min(0).max(5).nullable().optional(),
});

const updateArtistSchema = createArtistSchema.partial().extend({
  archived: z.boolean().optional(),
});

// Albums (shared across my_music and anatomy contexts)
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

// Song Attributes
const createAttributeSchema = z.object({
  name: z.string().min(1).max(100),
  attribute_category: z.string().min(1),
  description: z.string().nullable().optional(),
  instructions: z.string().nullable().optional(),
  examples: z.string().nullable().optional(),
});

const updateAttributeSchema = createAttributeSchema.partial().extend({
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
 * Load song name for a profile detail view.
 */
async function profileDetailEnricher(db: any, entity: any) {
  if (!entity.song_id) return { songName: "Unknown Song" };
  const song = await db
    .select({ id: songs.id, name: songs.name })
    .from(songs)
    .where(eq(songs.id, entity.song_id))
    .get();
  return { songName: song?.name || "Unknown Song" };
}

/**
 * Batch-load song names for profile list view.
 */
async function profileListEnricher(db: any, rows: any[]) {
  if (rows.length === 0) return rows;
  const songIds = [...new Set(rows.map((r: any) => r.song_id).filter(Boolean))];
  if (songIds.length === 0) return rows;

  const songRows = await db
    .select({ id: songs.id, name: songs.name })
    .from(songs)
    .where(
      sql`${songs.id} IN (${sql.join(
        songIds.map((id: number) => sql`${id}`),
        sql`, `
      )})`
    );

  const songMap: Record<number, string> = {};
  for (const s of songRows) {
    songMap[s.id] = s.name;
  }

  return rows.map((profile: any) => ({
    ...profile,
    songName: songMap[profile.song_id] || "Unknown Song",
  }));
}

/**
 * Load source info for a bin song detail view.
 */
async function binSongDetailEnricher(db: any, entity: any) {
  if (!entity.bin_source_id) return { source: null };
  const source = await db
    .select()
    .from(binSources)
    .where(eq(binSources.id, entity.bin_source_id))
    .get();
  return { source: source || null };
}

/**
 * Batch-load source info for bin song list view.
 */
async function binSongListEnricher(db: any, rows: any[]) {
  if (rows.length === 0) return rows;
  const sourceIds = [...new Set(rows.map((r: any) => r.bin_source_id).filter(Boolean))];
  if (sourceIds.length === 0) return rows.map((r: any) => ({ ...r, source: null }));

  const sourceRows = await db
    .select({ id: binSources.id, name: binSources.name })
    .from(binSources)
    .where(
      sql`${binSources.id} IN (${sql.join(
        sourceIds.map((id: number) => sql`${id}`),
        sql`, `
      )})`
    );

  const sourceMap: Record<number, { id: number; name: string }> = {};
  for (const s of sourceRows) {
    sourceMap[s.id] = { id: s.id, name: s.name };
  }

  return rows.map((song: any) => ({
    ...song,
    source: song.bin_source_id ? sourceMap[song.bin_source_id] || null : null,
  }));
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
 * Load profile info for a suno prompt detail view.
 */
async function sunoPromptDetailEnricher(db: any, entity: any) {
  if (!entity.song_profile_id) return { profile: null };
  const profile = await db
    .select()
    .from(songProfiles)
    .where(eq(songProfiles.id, entity.song_profile_id))
    .get();
  return { profile: profile || null };
}

// ---------------------------------------------------------------------------
// Song relationship configs (reused for my_music and anatomy)
// ---------------------------------------------------------------------------

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
  },

  // =========================================================================
  // 4. anatomy/songs
  // =========================================================================
  {
    context: "anatomy",
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
    contextColumnValue: "anatomy",
    listEnricher: songListEnricher,
    detailEnricher: songDetailEnricher,
    relationships: songRelationships,
  },

  // =========================================================================
  // 5. anatomy/artists
  // =========================================================================
  {
    context: "anatomy",
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
    contextColumnValue: "anatomy",
  },

  // =========================================================================
  // 6. anatomy/albums
  // =========================================================================
  {
    context: "anatomy",
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
    contextColumnValue: "anatomy",
  },

  // =========================================================================
  // 7. anatomy/song-attributes
  // =========================================================================
  {
    context: "anatomy",
    slug: "song-attributes",
    table: songAttributes,
    entityName: "Attribute",
    createSchema: createAttributeSchema,
    updateSchema: updateAttributeSchema,
    defaultSort: songAttributes.created_at,
    defaultOrder: "desc",
    sortableColumns: {
      name: songAttributes.name,
      attribute_category: songAttributes.attribute_category,
      created_at: songAttributes.created_at,
    },
    contextColumnValue: "anatomy",
    extraFilters: [
      {
        param: "category",
        column: songAttributes.attribute_category,
        schema: z.string().optional(),
        mode: "eq",
      },
    ],
  },

  // =========================================================================
  // 8. anatomy/song-profiles
  // =========================================================================
  {
    context: "anatomy",
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
    contextColumnValue: "anatomy",
    extraFilters: [
      {
        param: "song_id",
        column: songProfiles.song_id,
        schema: z.coerce.number().int().positive().optional(),
        mode: "eq",
      },
    ],
    listEnricher: profileListEnricher,
    detailEnricher: profileDetailEnricher,
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
    listEnricher: binSongListEnricher,
    detailEnricher: binSongDetailEnricher,
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
    detailEnricher: sunoPromptDetailEnricher,
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
  },
];
