import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../../.env") });

import { getDb } from "./index.js";
import {
  songs, artists, albums, artistSongs, albumSongs,
  songProfiles, songAttributes,
  binSources, binSongs,
  sunoPromptCollections, sunoPrompts, sunoCollectionPrompts,
  sunoSongPlaylists, sunoSongs,
} from "./schema/index.js";
import { user, account } from "./schema/auth.js";

async function seed() {
  const db = getDb();

  console.log("Seeding database...");

  // ─── Dev User ──────────────────────────────────────────────────────────────
  const userId = "seed-admin-user-001";
  await db.insert(user).values({
    id: userId,
    name: "Admin",
    email: "admin@vibeyvibe.local",
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).onConflictDoNothing();

  await db.insert(account).values({
    id: "seed-admin-account-001",
    accountId: userId,
    providerId: "credential",
    userId: userId,
    password: "$2a$10$placeholder",
    createdAt: new Date(),
    updatedAt: new Date(),
  }).onConflictDoNothing();

  console.log("  Admin user created");

  // ─── Artists (My Music) ──────────────────────────────────────────────────
  const [lunaEcho] = await db.insert(artists).values({
    name: "Luna Echo", context: "my_music", isni: "0000000121581532", image_path: null, rating: 0.8,
  }).returning();
  const [neonPulse] = await db.insert(artists).values({
    name: "Neon Pulse", context: "my_music", isni: "0000000234567890", image_path: null, rating: 0.7,
  }).returning();
  const [theWanderers] = await db.insert(artists).values({
    name: "The Wanderers", context: "my_music", isni: null, image_path: null, rating: 0.6,
  }).returning();

  console.log("  My Music artists created");

  // ─── Artists (Anatomy) ───────────────────────────────────────────────────
  const [daftPunk] = await db.insert(artists).values({
    name: "Daft Punk", context: "anatomy", isni: "0000000118779068", image_path: null, rating: 0.9,
  }).returning();
  const [radiohead] = await db.insert(artists).values({
    name: "Radiohead", context: "anatomy", isni: "0000000121070864", image_path: null, rating: 0.9,
  }).returning();

  console.log("  Anatomy artists created");

  // ─── Albums (My Music) ───────────────────────────────────────────────────
  const [midnightFrequencies] = await db.insert(albums).values({
    name: "Midnight Frequencies", context: "my_music", ean: null, release_date: "2024-03-15", rating: 0.8, image_path: null,
  }).returning();
  const [digitalDreams] = await db.insert(albums).values({
    name: "Digital Dreams", context: "my_music", ean: null, release_date: "2023-11-20", rating: 0.7, image_path: null,
  }).returning();

  console.log("  My Music albums created");

  // ─── Songs (My Music) ────────────────────────────────────────────────────
  const [electricSunrise] = await db.insert(songs).values({
    name: "Electric Sunrise", context: "my_music", isrc: "USRC12345678", release_date: "2024-03-15", rating: 0.9, spotify_uid: null, apple_music_uid: null, youtube_uid: null,
  }).returning();
  const [neonNights] = await db.insert(songs).values({
    name: "Neon Nights", context: "my_music", isrc: "USRC12345679", release_date: "2024-03-15", rating: 0.7, spotify_uid: null,
  }).returning();
  const [crystalWaves] = await db.insert(songs).values({
    name: "Crystal Waves", context: "my_music", isrc: "USRC12345680", release_date: "2023-11-20", rating: 0.6, spotify_uid: null,
  }).returning();
  const [vaporTrail] = await db.insert(songs).values({
    name: "Vapor Trail", context: "my_music", isrc: null, release_date: "2024-01-10", rating: 0.5,
  }).returning();
  const [shadowDance] = await db.insert(songs).values({
    name: "Shadow Dance", context: "my_music", isrc: null, release_date: null, rating: null,
  }).returning();

  console.log("  My Music songs created");

  // ─── Songs (Anatomy) ────────────────────────────────────────────────────
  const [aroundTheWorld] = await db.insert(songs).values({
    name: "Around the World", context: "anatomy", isrc: "FRZ039800212", release_date: "1997-03-17", rating: 0.8, spotify_uid: "3nsfB1vus2qaloUdcBZvDu",
  }).returning();
  const [everythingInItsRightPlace] = await db.insert(songs).values({
    name: "Everything In Its Right Place", context: "anatomy", isrc: "GBAYE0000696", release_date: "2000-10-02", rating: 0.9, spotify_uid: "2kJwzbxV2ppN0wnMTKaqnC",
  }).returning();

  console.log("  Anatomy songs created");

  // ─── Artist-Song Relationships ───────────────────────────────────────────
  await db.insert(artistSongs).values([
    { artist_id: lunaEcho.id, song_id: electricSunrise.id },
    { artist_id: lunaEcho.id, song_id: neonNights.id },
    { artist_id: neonPulse.id, song_id: crystalWaves.id },
    { artist_id: daftPunk.id, song_id: aroundTheWorld.id },
    { artist_id: radiohead.id, song_id: everythingInItsRightPlace.id },
  ]).onConflictDoNothing();

  console.log("  Artist-song relationships created");

  // ─── Album-Song Relationships ────────────────────────────────────────────
  await db.insert(albumSongs).values([
    { album_id: midnightFrequencies.id, song_id: electricSunrise.id },
    { album_id: midnightFrequencies.id, song_id: neonNights.id },
    { album_id: digitalDreams.id, song_id: crystalWaves.id },
  ]).onConflictDoNothing();

  console.log("  Album-song relationships created");

  // ─── Bin Sources ─────────────────────────────────────────────────────────
  const [ytSource] = await db.insert(binSources).values({
    name: "YouTube Discoveries", context: "bin", url: "https://youtube.com",
  }).returning();
  const [scSource] = await db.insert(binSources).values({
    name: "SoundCloud Finds", context: "bin", url: "https://soundcloud.com",
  }).returning();

  console.log("  Bin sources created");

  // ─── Bin Songs ───────────────────────────────────────────────────────────
  await db.insert(binSongs).values([
    { name: "Lo-fi Beat #42", context: "bin", asset_path: null, lyrics: null, notes: "Great vibe", rating: 0.7, bin_source_id: ytSource.id },
    { name: "Underground Remix", context: "bin", asset_path: null, lyrics: null, notes: null, rating: 0.5, bin_source_id: ytSource.id },
    { name: "Ambient Texture", context: "bin", asset_path: null, lyrics: null, notes: "Use for intro", rating: null, bin_source_id: scSource.id },
  ]);

  console.log("  Bin songs created");

  // ─── Suno Prompt Collections ─────────────────────────────────────────────
  const [chillVibes] = await db.insert(sunoPromptCollections).values({
    name: "Chill Vibes", context: "suno", description: "Relaxing electronic tracks",
  }).returning();
  const [energeticBangers] = await db.insert(sunoPromptCollections).values({
    name: "Energetic Bangers", context: "suno", description: "High energy dance tracks",
  }).returning();

  console.log("  Suno prompt collections created");

  // ─── Suno Prompts ────────────────────────────────────────────────────────
  const [lofiSunset] = await db.insert(sunoPrompts).values({
    name: "Lo-fi Sunset", context: "suno", lyrics: "Watching the sun go down...", prompt: "lo-fi hip hop, warm, vinyl crackle, sunset vibes", notes: "For chill collection", song_profile_id: null,
  }).returning();
  const [danceFloor] = await db.insert(sunoPrompts).values({
    name: "Dance Floor", context: "suno", lyrics: "Feel the beat drop...", prompt: "electronic dance, heavy bass, 128 BPM, festival energy", notes: "For energetic collection", song_profile_id: null,
  }).returning();

  console.log("  Suno prompts created");

  // ─── Suno Collection-Prompt Relationships ────────────────────────────────
  await db.insert(sunoCollectionPrompts).values([
    { collection_id: chillVibes.id, prompt_id: lofiSunset.id },
    { collection_id: energeticBangers.id, prompt_id: danceFloor.id },
  ]).onConflictDoNothing();

  console.log("  Suno collection-prompt relationships created");

  // ─── Suno Song Playlists ─────────────────────────────────────────────────
  const [bestGenerations] = await db.insert(sunoSongPlaylists).values({
    name: "Best Generations", context: "suno", description: "Top picks from Suno",
  }).returning();

  console.log("  Suno song playlists created");

  // ─── Suno Songs ──────────────────────────────────────────────────────────
  await db.insert(sunoSongs).values({
    name: "Generated Lo-fi Track", context: "suno", suno_uid: "suno_abc123", image_path: null, suno_prompt_id: lofiSunset.id, bin_song_id: null, suno_song_playlist_id: bestGenerations.id,
  });

  console.log("  Suno songs created");

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
