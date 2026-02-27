import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
  index,
} from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Base entity columns (spread into all entity tables, NOT pivot tables)
// ---------------------------------------------------------------------------
const baseEntityColumns = {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  context: text("context").notNull(),
  archived: integer("archived", { mode: "boolean" as const }).default(false),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
};

// ===========================================================================
// 1. Songs
// ===========================================================================
export const songs = sqliteTable(
  "songs",
  {
    ...baseEntityColumns,
    isrc: text("isrc"),
    image_path: text("image_path"),
    release_date: text("release_date"),
    rating: real("rating"),
    spotify_uid: text("spotify_uid"),
    apple_music_uid: text("apple_music_uid"),
    youtube_uid: text("youtube_uid"),
  },
  (table) => [
    index("songs_context_idx").on(table.context),
    index("songs_isrc_idx").on(table.isrc),
    index("songs_spotify_uid_idx").on(table.spotify_uid),
  ]
);

export const songsRelations = relations(songs, ({ many }) => ({
  artistSongs: many(artistSongs),
  albumSongs: many(albumSongs),
  songVibes: many(songVibes),
}));

// ===========================================================================
// 2. Artists
// ===========================================================================
export const artists = sqliteTable(
  "artists",
  {
    ...baseEntityColumns,
    isni: text("isni"),
    image_path: text("image_path"),
    rating: real("rating"),
  },
  (table) => [index("artists_context_idx").on(table.context)]
);

export const artistsRelations = relations(artists, ({ many }) => ({
  artistSongs: many(artistSongs),
}));

// ===========================================================================
// 3. Albums
// ===========================================================================
export const albums = sqliteTable(
  "albums",
  {
    ...baseEntityColumns,
    ean: text("ean"),
    image_path: text("image_path"),
    release_date: text("release_date"),
    rating: real("rating"),
    spotify_uid: text("spotify_uid"),
    apple_music_uid: text("apple_music_uid"),
    youtube_uid: text("youtube_uid"),
  },
  (table) => [index("albums_context_idx").on(table.context)]
);

export const albumsRelations = relations(albums, ({ many }) => ({
  albumSongs: many(albumSongs),
}));

// ===========================================================================
// 4. Artist Songs (PIVOT — no base schema)
// ===========================================================================
export const artistSongs = sqliteTable(
  "artist_songs",
  {
    artist_id: integer("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    song_id: integer("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.artist_id, table.song_id] })]
);

export const artistSongsRelations = relations(artistSongs, ({ one }) => ({
  artist: one(artists, {
    fields: [artistSongs.artist_id],
    references: [artists.id],
  }),
  song: one(songs, {
    fields: [artistSongs.song_id],
    references: [songs.id],
  }),
}));

// ===========================================================================
// 5. Album Songs (PIVOT — no base schema)
// ===========================================================================
export const albumSongs = sqliteTable(
  "album_songs",
  {
    album_id: integer("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),
    song_id: integer("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.album_id, table.song_id] })]
);

export const albumSongsRelations = relations(albumSongs, ({ one }) => ({
  album: one(albums, {
    fields: [albumSongs.album_id],
    references: [albums.id],
  }),
  song: one(songs, {
    fields: [albumSongs.song_id],
    references: [songs.id],
  }),
}));

// ===========================================================================
// 6. Vibes
// ===========================================================================
export const vibes = sqliteTable("vibes", {
  ...baseEntityColumns,
  vibe_category: text("vibe_category").notNull(),
  description: text("description"),
  instructions: text("instructions"),
  examples: text("examples"),
});

export const vibesRelations = relations(vibes, ({ many }) => ({
  songVibes: many(songVibes),
}));

// ===========================================================================
// 7b. Song Vibes (ASSOCIATIVE PIVOT — has payload columns)
// ===========================================================================
export const songVibes = sqliteTable(
  "song_vibes",
  {
    song_id: integer("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),
    vibe_id: integer("vibe_id")
      .notNull()
      .references(() => vibes.id, { onDelete: "cascade" }),
    value: text("value").notNull(),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.song_id, table.vibe_id] })]
);

export const songVibesRelations = relations(songVibes, ({ one }) => ({
  song: one(songs, {
    fields: [songVibes.song_id],
    references: [songs.id],
  }),
  vibe: one(vibes, {
    fields: [songVibes.vibe_id],
    references: [vibes.id],
  }),
}));

// ===========================================================================
// 8. Bin Sources
// ===========================================================================
export const binSources = sqliteTable("bin_sources", {
  ...baseEntityColumns,
  url: text("url").notNull(),
});

export const binSourcesRelations = relations(binSources, ({ many }) => ({
  binSongs: many(binSongs),
}));

// ===========================================================================
// 9. Bin Songs
// ===========================================================================
export const binSongs = sqliteTable(
  "bin_songs",
  {
    ...baseEntityColumns,
    asset_path: text("asset_path"),
    lyrics: text("lyrics"),
    notes: text("notes"),
    rating: real("rating"),
    bin_source_id: integer("bin_source_id").references(() => binSources.id),
  },
  (table) => [index("bin_songs_bin_source_id_idx").on(table.bin_source_id)]
);

export const binSongsRelations = relations(binSongs, ({ one, many }) => ({
  binSource: one(binSources, {
    fields: [binSongs.bin_source_id],
    references: [binSources.id],
  }),
  sunoSongs: many(sunoSongs),
}));

// ===========================================================================
// 10. Suno Prompts
// ===========================================================================
export const sunoPrompts = sqliteTable(
  "suno_prompts",
  {
    ...baseEntityColumns,
    lyrics: text("lyrics"),
    prompt: text("prompt"),
    notes: text("notes"),
    song_id: integer("song_id").references(() => songs.id),
  },
  (table) => [index("suno_prompts_song_id_idx").on(table.song_id)]
);

export const sunoPromptsRelations = relations(
  sunoPrompts,
  ({ one, many }) => ({
    song: one(songs, {
      fields: [sunoPrompts.song_id],
      references: [songs.id],
    }),
    sunoSongs: many(sunoSongs),
  })
);

// ===========================================================================
// 13. Suno Song Playlists
// ===========================================================================
export const sunoSongPlaylists = sqliteTable("suno_song_playlists", {
  ...baseEntityColumns,
  description: text("description"),
});

export const sunoSongPlaylistsRelations = relations(
  sunoSongPlaylists,
  ({ many }) => ({
    sunoSongs: many(sunoSongs),
  })
);

// ===========================================================================
// 14. Suno Songs
// ===========================================================================
export const sunoSongs = sqliteTable(
  "suno_songs",
  {
    ...baseEntityColumns,
    suno_uid: text("suno_uid").notNull(),
    image_path: text("image_path"),
    suno_prompt_id: integer("suno_prompt_id").references(() => sunoPrompts.id),
    bin_song_id: integer("bin_song_id").references(() => binSongs.id),
    suno_song_playlist_id: integer("suno_song_playlist_id").references(
      () => sunoSongPlaylists.id
    ),
  },
  (table) => [
    index("suno_songs_suno_prompt_id_idx").on(table.suno_prompt_id),
    index("suno_songs_bin_song_id_idx").on(table.bin_song_id),
    index("suno_songs_suno_song_playlist_id_idx").on(
      table.suno_song_playlist_id
    ),
  ]
);

export const sunoSongsRelations = relations(sunoSongs, ({ one }) => ({
  sunoPrompt: one(sunoPrompts, {
    fields: [sunoSongs.suno_prompt_id],
    references: [sunoPrompts.id],
  }),
  binSong: one(binSongs, {
    fields: [sunoSongs.bin_song_id],
    references: [binSongs.id],
  }),
  sunoSongPlaylist: one(sunoSongPlaylists, {
    fields: [sunoSongs.suno_song_playlist_id],
    references: [sunoSongPlaylists.id],
  }),
}));
