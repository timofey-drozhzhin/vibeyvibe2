import { sqliteTable, text, real, integer, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const anatomySongs = sqliteTable("anatomy_songs", {
  id: text("id").primaryKey(),
  isrc: text("isrc").notNull().unique(),
  name: text("name").notNull(),
  imagePath: text("image_path"),
  releaseDate: text("release_date").notNull(),
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

export const anatomyArtists = sqliteTable("anatomy_artists", {
  id: text("id").primaryKey(),
  isni: text("isni").notNull().unique(),
  name: text("name").notNull(),
  imagePath: text("image_path"),
  rating: real("rating").default(0).notNull(),
  archived: integer("archived", { mode: "boolean" }).default(false).notNull(),
  createdAt: text("created_at")
    .default(sql`(current_timestamp)`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(current_timestamp)`)
    .notNull(),
});

export const anatomySongArtists = sqliteTable(
  "anatomy_song_artists",
  {
    id: text("id").primaryKey(),
    songId: text("song_id")
      .notNull()
      .references(() => anatomySongs.id),
    artistId: text("artist_id")
      .notNull()
      .references(() => anatomyArtists.id),
    createdAt: text("created_at")
      .default(sql`(current_timestamp)`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("anatomy_song_artists_unique").on(
      table.songId,
      table.artistId
    ),
  ]
);

export const anatomyAttributes = sqliteTable("anatomy_attributes", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  instruction: text("instruction"),
  examples: text("examples"),
  archived: integer("archived", { mode: "boolean" }).default(false).notNull(),
  createdAt: text("created_at")
    .default(sql`(current_timestamp)`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(current_timestamp)`)
    .notNull(),
});

export const anatomyProfiles = sqliteTable(
  "anatomy_profiles",
  {
    id: text("id").primaryKey(),
    songId: text("song_id")
      .notNull()
      .references(() => anatomySongs.id),
    value: text("value").notNull(), // JSON: {"tempo": "120 BPM", "mood": "melancholic", ...}
    archived: integer("archived", { mode: "boolean" }).default(false).notNull(),
    createdAt: text("created_at")
      .default(sql`(current_timestamp)`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(current_timestamp)`)
      .notNull(),
  },
  (table) => [index("anatomy_profiles_song_idx").on(table.songId)]
);
