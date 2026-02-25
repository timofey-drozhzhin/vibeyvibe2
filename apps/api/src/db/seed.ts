import { config } from "dotenv";
config();

import { getDb } from "./index.js";
import * as schema from "./schema/index.js";

async function seed() {
  const db = getDb();

  console.log("Seeding database...");

  // ─── Dev User ──────────────────────────────────────────────────────────────
  const userId = "seed-admin-user-001";
  await db.insert(schema.user).values({
    id: userId,
    name: "Admin",
    email: "admin@vibeyvibe.local",
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).onConflictDoNothing();

  await db.insert(schema.account).values({
    id: "seed-admin-account-001",
    accountId: userId,
    providerId: "credential",
    userId: userId,
    password: "$2a$10$placeholder",
    createdAt: new Date(),
    updatedAt: new Date(),
  }).onConflictDoNothing();

  // ─── My Music: Artists ─────────────────────────────────────────────────────
  const myArtists = [
    { id: "seed-my-artist-kendrick", name: "Kendrick Lamar", isni: "0000000078078474" },
    { id: "seed-my-artist-sza", name: "SZA", isni: "0000000498765432" },
    { id: "seed-my-artist-tyler", name: "Tyler, the Creator", isni: "0000000412345678" },
  ];
  for (const a of myArtists) {
    await db.insert(schema.myArtists).values({ ...a, archived: false }).onConflictDoNothing();
  }

  // ─── My Music: Albums ──────────────────────────────────────────────────────
  const myAlbums = [
    { id: "seed-my-album-gkmc", name: "good kid, m.A.A.d city", ean: "0602537362011", releaseDate: "2012-10-22" },
    { id: "seed-my-album-sos", name: "SOS", ean: "0196588023125", releaseDate: "2022-12-09" },
  ];
  for (const a of myAlbums) {
    await db.insert(schema.myAlbums).values({ ...a, archived: false, rating: 0 }).onConflictDoNothing();
  }

  // ─── My Music: Songs ──────────────────────────────────────────────────────
  const mySongs = [
    { id: "seed-my-song-swimming", name: "Swimming Pools (Drank)", isrc: "USAF11200015", rating: 4, releaseDate: "2012-10-22", spotifyId: "5ByAIlEEnxYdvpnezg7HTX", youtubeId: "B5YNiCfWC3A" },
    { id: "seed-my-song-killbill", name: "Kill Bill", isrc: "USRC12200001", rating: 5, releaseDate: "2022-12-09", spotifyId: "1Qrg8KqiBpW07V7PNxwwwL", appleMusicId: "1649751085", youtubeId: "hJgcKRHuz_Y" },
    { id: "seed-my-song-earfquake", name: "EARFQUAKE", isrc: "USCM51900001", rating: 4, releaseDate: "2019-05-17", spotifyId: "5hVghJ4KaYES3BFUATCYn0", youtubeId: "HmAsUQEFYGI" },
    { id: "seed-my-song-moneytrees", name: "Money Trees", isrc: "USAF11200016", rating: 5, releaseDate: "2012-10-22", spotifyId: "2HbKqm4o0w5wEeEFXm2s4y", youtubeId: "iMK0tDBbmMU" },
    { id: "seed-my-song-shirt", name: "Shirt", isrc: "USRC12200002", rating: 3, releaseDate: "2022-12-09", spotifyId: "74MCSNz7GEQwW8f61GOfkL" },
  ];
  for (const s of mySongs) {
    await db.insert(schema.mySongs).values({ ...s, archived: false }).onConflictDoNothing();
  }

  // ─── My Music: Song-Artist Relationships ──────────────────────────────────
  const mySongArtists = [
    { id: "seed-msa-1", songId: "seed-my-song-swimming", artistId: "seed-my-artist-kendrick" },
    { id: "seed-msa-2", songId: "seed-my-song-moneytrees", artistId: "seed-my-artist-kendrick" },
    { id: "seed-msa-3", songId: "seed-my-song-killbill", artistId: "seed-my-artist-sza" },
    { id: "seed-msa-4", songId: "seed-my-song-shirt", artistId: "seed-my-artist-sza" },
    { id: "seed-msa-5", songId: "seed-my-song-earfquake", artistId: "seed-my-artist-tyler" },
  ];
  for (const r of mySongArtists) {
    try { await db.insert(schema.mySongArtists).values(r).onConflictDoNothing(); } catch { /* FK skip */ }
  }

  // ─── My Music: Song-Album Relationships ───────────────────────────────────
  const mySongAlbums = [
    { id: "seed-msal-1", songId: "seed-my-song-swimming", albumId: "seed-my-album-gkmc" },
    { id: "seed-msal-2", songId: "seed-my-song-moneytrees", albumId: "seed-my-album-gkmc" },
    { id: "seed-msal-3", songId: "seed-my-song-killbill", albumId: "seed-my-album-sos" },
    { id: "seed-msal-4", songId: "seed-my-song-shirt", albumId: "seed-my-album-sos" },
  ];
  for (const r of mySongAlbums) {
    try { await db.insert(schema.mySongAlbums).values(r).onConflictDoNothing(); } catch { /* FK skip */ }
  }

  // ─── Anatomy: Artists ─────────────────────────────────────────────────────
  const anatArtists = [
    { id: "seed-anat-artist-frank", name: "Frank Ocean", isni: "0000000114891282" },
    { id: "seed-anat-artist-weeknd", name: "The Weeknd", isni: "0000000368534204" },
  ];
  for (const a of anatArtists) {
    await db.insert(schema.anatomyArtists).values({ ...a, archived: false, rating: 0 }).onConflictDoNothing();
  }

  // ─── Anatomy: Songs ───────────────────────────────────────────────────────
  const anatSongs = [
    { id: "seed-anat-song-blinding", name: "Blinding Lights", isrc: "USUG11904425", rating: 5, releaseDate: "2019-11-29", spotifyId: "0VjIjW4GlUZAMYd2vXMi3b", youtubeId: "4NRXx6U8ABQ" },
    { id: "seed-anat-song-nights", name: "Nights", isrc: "USUG11600001", rating: 5, releaseDate: "2016-08-20", spotifyId: "7eqoqGkKe8gLv2Vba1RSCJ", youtubeId: "r4l9bFqgMaQ" },
  ];
  for (const s of anatSongs) {
    await db.insert(schema.anatomySongs).values({ ...s, archived: false }).onConflictDoNothing();
  }

  // ─── Anatomy: Song-Artist Relationships ───────────────────────────────────
  const anatSongArtists = [
    { id: "seed-asa-1", songId: "seed-anat-song-blinding", artistId: "seed-anat-artist-weeknd" },
    { id: "seed-asa-2", songId: "seed-anat-song-nights", artistId: "seed-anat-artist-frank" },
  ];
  for (const r of anatSongArtists) {
    try { await db.insert(schema.anatomySongArtists).values(r).onConflictDoNothing(); } catch { /* FK skip */ }
  }

  // ─── Bin: Sources ─────────────────────────────────────────────────────────
  const binSources = [
    { id: "seed-bin-source-youtube", name: "YouTube", url: "https://youtube.com" },
    { id: "seed-bin-source-spotify", name: "Spotify", url: "https://open.spotify.com" },
  ];
  for (const s of binSources) {
    await db.insert(schema.binSources).values({ ...s, archived: false }).onConflictDoNothing();
  }

  // ─── Bin: Songs ───────────────────────────────────────────────────────────
  const binSongs = [
    { id: "seed-bin-song-1", name: "untitled discovery 1", sourceId: "seed-bin-source-youtube" },
    { id: "seed-bin-song-2", name: "lofi beat sample", sourceId: "seed-bin-source-youtube" },
    { id: "seed-bin-song-3", name: "indie gem from playlist", sourceId: "seed-bin-source-spotify" },
  ];
  for (const s of binSongs) {
    await db.insert(schema.binSongs).values({ ...s, archived: false }).onConflictDoNothing();
  }

  // ─── Suno: Prompts ────────────────────────────────────────────────────────
  const sunoPrompts = [
    { id: "seed-suno-prompt-rnb", style: "neo-soul R&B", lyrics: "Verse about lost love under city lights...", voiceGender: "female" as const, rating: 4, notes: "Melancholic R&B Ballad" },
    { id: "seed-suno-prompt-trap", style: "aggressive trap", lyrics: "Bars about hustle and grind...", voiceGender: "male" as const, rating: 3, notes: "Hard Hitting Trap" },
  ];
  for (const p of sunoPrompts) {
    await db.insert(schema.sunoPrompts).values({ ...p, archived: false }).onConflictDoNothing();
  }

  // ─── Suno: Collections ────────────────────────────────────────────────────
  await db.insert(schema.sunoCollections).values({
    id: "seed-suno-collection-lnv",
    name: "Late Night Vibes",
    archived: false,
  }).onConflictDoNothing();

  // ─── Suno: Collection-Prompt Assignments ──────────────────────────────────
  const collPrompts = [
    { id: "seed-scp-1", collectionId: "seed-suno-collection-lnv", promptId: "seed-suno-prompt-rnb" },
    { id: "seed-scp-2", collectionId: "seed-suno-collection-lnv", promptId: "seed-suno-prompt-trap" },
  ];
  for (const r of collPrompts) {
    try { await db.insert(schema.sunoCollectionPrompts).values(r).onConflictDoNothing(); } catch { /* FK skip */ }
  }

  // ─── Suno: Generations ────────────────────────────────────────────────────
  await db.insert(schema.sunoGenerations).values({
    id: "seed-suno-gen-1",
    sunoId: "sample-generation-001",
    archived: false,
  }).onConflictDoNothing();

  // ─── Suno: Generation-Prompt Assignments ──────────────────────────────────
  try {
    await db.insert(schema.sunoGenerationPrompts).values({
      id: "seed-sgp-1",
      generationId: "seed-suno-gen-1",
      promptId: "seed-suno-prompt-rnb",
    }).onConflictDoNothing();
  } catch { /* FK skip */ }

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
