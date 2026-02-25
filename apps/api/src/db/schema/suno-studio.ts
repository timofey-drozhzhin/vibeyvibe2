import { sqliteTable, text, real, integer, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { anatomyProfiles } from "./anatomy";
import { binSongs } from "./bin";

export const sunoPrompts = sqliteTable("suno_prompts", {
  id: text("id").primaryKey(),
  lyrics: text("lyrics"),
  style: text("style"),
  voiceGender: text("voice_gender"), // "male", "female", "neutral"
  notes: text("notes"),
  profileId: text("profile_id").references(() => anatomyProfiles.id),
  rating: real("rating").default(0).notNull(),
  archived: integer("archived", { mode: "boolean" }).default(false).notNull(),
  createdAt: text("created_at")
    .default(sql`(current_timestamp)`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(current_timestamp)`)
    .notNull(),
});

export const sunoCollections = sqliteTable("suno_collections", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: text("created_at")
    .default(sql`(current_timestamp)`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(current_timestamp)`)
    .notNull(),
});

export const sunoCollectionPrompts = sqliteTable(
  "suno_collection_prompts",
  {
    id: text("id").primaryKey(),
    collectionId: text("collection_id")
      .notNull()
      .references(() => sunoCollections.id),
    promptId: text("prompt_id")
      .notNull()
      .references(() => sunoPrompts.id),
    createdAt: text("created_at")
      .default(sql`(current_timestamp)`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("suno_collection_prompts_unique").on(
      table.collectionId,
      table.promptId
    ),
  ]
);

export const sunoGenerations = sqliteTable("suno_generations", {
  id: text("id").primaryKey(),
  sunoId: text("suno_id"),
  binSongId: text("bin_song_id").references(() => binSongs.id),
  createdAt: text("created_at")
    .default(sql`(current_timestamp)`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(current_timestamp)`)
    .notNull(),
});

export const sunoGenerationPrompts = sqliteTable(
  "suno_generation_prompts",
  {
    id: text("id").primaryKey(),
    generationId: text("generation_id")
      .notNull()
      .references(() => sunoGenerations.id),
    promptId: text("prompt_id")
      .notNull()
      .references(() => sunoPrompts.id),
    createdAt: text("created_at")
      .default(sql`(current_timestamp)`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("suno_generation_prompts_unique").on(
      table.generationId,
      table.promptId
    ),
  ]
);
