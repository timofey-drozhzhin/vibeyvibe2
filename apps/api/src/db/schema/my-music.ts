import { sqliteTable, text, real, integer, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const mySongs = sqliteTable("my_songs", {
  id: text("id").primaryKey(),
  isrc: text("isrc").unique(),
  name: text("name").notNull(),
  imagePath: text("image_path"),
  releaseDate: text("release_date"),
  rating: real("rating").default(0).notNull(),
  archived: integer("archived", { mode: "boolean" }).default(false).notNull(),
  spotifyId: text("spotify_id"),
  appleMusicId: text("apple_music_id"),
  youtubeId: text("youtube_id"),
  createdAt: text("created_at")
    .default(sql`(current_timestamp)`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(current_timestamp)`)
    .notNull(),
});

export const myArtists = sqliteTable("my_artists", {
  id: text("id").primaryKey(),
  isni: text("isni").unique(),
  name: text("name").notNull(),
  imagePath: text("image_path"),
  rating: real("rating").default(0).notNull(),
  archived: integer("archived", { mode: "boolean" }).default(false).notNull(),
  spotifyId: text("spotify_id"),
  youtubeUsername: text("youtube_username"),
  tiktokUsername: text("tiktok_username"),
  instagramUsername: text("instagram_username"),
  createdAt: text("created_at")
    .default(sql`(current_timestamp)`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(current_timestamp)`)
    .notNull(),
});

export const myAlbums = sqliteTable("my_albums", {
  id: text("id").primaryKey(),
  ean: text("ean").unique(),
  name: text("name").notNull(),
  releaseDate: text("release_date"),
  rating: real("rating").default(0).notNull(),
  archived: integer("archived", { mode: "boolean" }).default(false).notNull(),
  spotifyId: text("spotify_id"),
  appleMusicId: text("apple_music_id"),
  youtubeId: text("youtube_id"),
  createdAt: text("created_at")
    .default(sql`(current_timestamp)`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(current_timestamp)`)
    .notNull(),
});

export const mySongArtists = sqliteTable(
  "my_song_artists",
  {
    id: text("id").primaryKey(),
    songId: text("song_id")
      .notNull()
      .references(() => mySongs.id),
    artistId: text("artist_id")
      .notNull()
      .references(() => myArtists.id),
    createdAt: text("created_at")
      .default(sql`(current_timestamp)`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("my_song_artists_unique").on(table.songId, table.artistId),
  ]
);

export const mySongAlbums = sqliteTable(
  "my_song_albums",
  {
    id: text("id").primaryKey(),
    songId: text("song_id")
      .notNull()
      .references(() => mySongs.id),
    albumId: text("album_id")
      .notNull()
      .references(() => myAlbums.id),
    createdAt: text("created_at")
      .default(sql`(current_timestamp)`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("my_song_albums_unique").on(table.songId, table.albumId),
  ]
);
