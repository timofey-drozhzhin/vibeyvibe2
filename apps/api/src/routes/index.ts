import { Hono } from "hono";
import { createEntityRoutes } from "./factory/create-routes.js";
import { registry } from "./registry.js";
import labImport from "./extensions/lab-import.js";
import vibesGenerator from "./extensions/vibes-generator.js";
import sunoPromptGenerator from "./extensions/suno-prompt-generator.js";
import uploadRoutes from "./extensions/upload.js";
import storageRoutes from "./extensions/storage.js";

const routes = new Hono();

// Register all entity routes from registry
for (const config of registry) {
  const entityRouter = createEntityRoutes(config);
  routes.route(`/${config.context}/${config.slug}`, entityRouter);
}

// Extension routes
routes.route("/lab", labImport);
routes.route("/vibes-generator", vibesGenerator);
routes.route("/suno-prompt-generator", sunoPromptGenerator);
routes.route("/upload", uploadRoutes);
routes.route("/storage", storageRoutes);

// Dashboard stats
routes.get("/dashboard/stats", async (c) => {
  const { getDb } = await import("../db/index.js");
  const {
    songs,
    artists,
    albums,
    vibes,
    binSources,
    binSongs,
    sunoPrompts,
    sunoSongs,
    sunoSongPlaylists,
  } = await import("../db/schema/index.js");
  const { sql, eq } = await import("drizzle-orm");
  const db = getDb();

  const [
    myMusicSongs,
    myMusicArtists,
    myMusicAlbums,
    labSongs,
    labArtists,
    labAlbums,
    attrCount,
    binSrcCount,
    binSongCount,
    promptCount,
    sunoSongCount,
    playlistCount,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(songs).where(eq(songs.context, "my_music")),
    db.select({ count: sql<number>`count(*)` }).from(artists).where(eq(artists.context, "my_music")),
    db.select({ count: sql<number>`count(*)` }).from(albums).where(eq(albums.context, "my_music")),
    db.select({ count: sql<number>`count(*)` }).from(songs).where(eq(songs.context, "lab")),
    db.select({ count: sql<number>`count(*)` }).from(artists).where(eq(artists.context, "lab")),
    db.select({ count: sql<number>`count(*)` }).from(albums).where(eq(albums.context, "lab")),
    db.select({ count: sql<number>`count(*)` }).from(vibes),
    db.select({ count: sql<number>`count(*)` }).from(binSources),
    db.select({ count: sql<number>`count(*)` }).from(binSongs),
    db.select({ count: sql<number>`count(*)` }).from(sunoPrompts),
    db.select({ count: sql<number>`count(*)` }).from(sunoSongs),
    db.select({ count: sql<number>`count(*)` }).from(sunoSongPlaylists),
  ]);

  return c.json({
    myMusic: {
      songs: myMusicSongs[0].count,
      artists: myMusicArtists[0].count,
      albums: myMusicAlbums[0].count,
    },
    lab: {
      songs: labSongs[0].count,
      artists: labArtists[0].count,
      albums: labAlbums[0].count,
      vibes: attrCount[0].count,
    },
    bin: {
      sources: binSrcCount[0].count,
      songs: binSongCount[0].count,
    },
    suno: {
      prompts: promptCount[0].count,
      songs: sunoSongCount[0].count,
      playlists: playlistCount[0].count,
    },
  });
});

export default routes;
