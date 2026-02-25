import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const binSources = sqliteTable("bin_sources", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url"),
  archived: integer("archived", { mode: "boolean" }).default(false).notNull(),
  createdAt: text("created_at")
    .default(sql`(current_timestamp)`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(current_timestamp)`)
    .notNull(),
});

export const binSongs = sqliteTable("bin_songs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  sourceId: text("source_id").references(() => binSources.id),
  assetPath: text("asset_path"),
  sourceUrl: text("source_url"),
  archived: integer("archived", { mode: "boolean" }).default(false).notNull(),
  createdAt: text("created_at")
    .default(sql`(current_timestamp)`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(current_timestamp)`)
    .notNull(),
});
