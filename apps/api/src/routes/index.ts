import { Hono } from "hono";
import { myMusicSongsRoutes } from "./my-music/songs.js";
import { myMusicArtistsRoutes } from "./my-music/artists.js";
import { myMusicAlbumsRoutes } from "./my-music/albums.js";
import { anatomySongsRoutes } from "./anatomy/songs.js";
import { anatomyArtistsRoutes } from "./anatomy/artists.js";
import { anatomyAlbumsRoutes } from "./anatomy/albums.js";
import { anatomyAttributesRoutes } from "./anatomy/attributes.js";
import { anatomyProfilesRoutes } from "./anatomy/profiles.js";
import { anatomyImportRoutes } from "./anatomy/import.js";
import { binSongsRoutes } from "./bin/songs.js";
import { binSourcesRoutes } from "./bin/sources.js";
import { sunoPromptsRoutes } from "./suno/prompts.js";
import { sunoCollectionsRoutes } from "./suno/collections.js";
import { sunoGenerationsRoutes } from "./suno/generations.js";
import { uploadRoutes } from "./upload.js";
import { storageRoutes } from "./storage.js";

export const routes = new Hono();

// My Music
routes.route("/my-music/songs", myMusicSongsRoutes);
routes.route("/my-music/artists", myMusicArtistsRoutes);
routes.route("/my-music/albums", myMusicAlbumsRoutes);

// Anatomy
routes.route("/anatomy/songs", anatomySongsRoutes);
routes.route("/anatomy/artists", anatomyArtistsRoutes);
routes.route("/anatomy/albums", anatomyAlbumsRoutes);
routes.route("/anatomy/attributes", anatomyAttributesRoutes);
routes.route("/anatomy/profiles", anatomyProfilesRoutes);
routes.route("/anatomy", anatomyImportRoutes);

// Bin
routes.route("/bin/songs", binSongsRoutes);
routes.route("/bin/sources", binSourcesRoutes);

// Suno Studio
routes.route("/suno/prompts", sunoPromptsRoutes);
routes.route("/suno/collections", sunoCollectionsRoutes);
routes.route("/suno/generations", sunoGenerationsRoutes);

// Upload
routes.route("/upload", uploadRoutes);

// Storage (file serving)
routes.route("/storage", storageRoutes);

// Dashboard
routes.get("/dashboard/stats", async (c) => {
  const db = (await import("../db/index.js")).getDb();
  const { sql } = await import("drizzle-orm");
  const schema = await import("../db/schema/index.js");

  const count = (table: any) =>
    db
      .select({ count: sql<number>`count(*)` })
      .from(table)
      .then((r: any) => r[0].count);

  const [mySongs, myArtists, myAlbums, anatomySongs, anatomyArtists, binSongs, sunoPrompts, sunoCollections, sunoGenerations] =
    await Promise.all([
      count(schema.mySongs),
      count(schema.myArtists),
      count(schema.myAlbums),
      count(schema.anatomySongs),
      count(schema.anatomyArtists),
      count(schema.binSongs),
      count(schema.sunoPrompts),
      count(schema.sunoCollections),
      count(schema.sunoGenerations),
    ]);

  return c.json({
    myMusic: { songs: mySongs, artists: myArtists, albums: myAlbums },
    anatomy: { songs: anatomySongs, artists: anatomyArtists },
    bin: { songs: binSongs },
    suno: { prompts: sunoPrompts, collections: sunoCollections, generations: sunoGenerations },
  });
});
