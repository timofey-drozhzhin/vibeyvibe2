import { config } from "dotenv";
config();

import { getDb } from "./index.js";
import * as schema from "./schema/index.js";
import { nanoid } from "nanoid";

async function seed() {
  const db = getDb();

  console.log("Seeding database...");

  // Create dev user (for Better Auth)
  const userId = nanoid();
  await db.insert(schema.user).values({
    id: userId,
    name: "Admin",
    email: "admin@vibeyvibe.local",
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).onConflictDoNothing();

  // Create account with password for dev user
  await db.insert(schema.account).values({
    id: nanoid(),
    accountId: userId,
    providerId: "credential",
    userId: userId,
    password: "$2a$10$placeholder", // Will be set properly via Better Auth signup
    createdAt: new Date(),
    updatedAt: new Date(),
  }).onConflictDoNothing();

  // Seed some anatomy attributes
  const attributes = [
    { name: "tempo", description: "Song tempo in BPM", instruction: "Identify the approximate BPM and tempo feel (slow, mid-tempo, uptempo, fast)", examples: "72 BPM - Slow ballad\n120 BPM - Mid-tempo pop\n140 BPM - Uptempo dance" },
    { name: "mood", description: "Emotional mood/atmosphere", instruction: "Describe the overall emotional tone and atmosphere of the song", examples: "Melancholic, introspective\nEuphoric, energetic\nDark, brooding" },
    { name: "vocal_style", description: "Vocal delivery and style", instruction: "Describe the vocal technique, range, and delivery style", examples: "Breathy, intimate vocals\nPowerful belting\nRaspy, soulful delivery" },
    { name: "genre", description: "Primary and secondary genres", instruction: "Identify the main genre and any sub-genres or genre fusions", examples: "Pop/R&B fusion\nIndie rock with electronic elements\nTrap soul" },
    { name: "instrumentation", description: "Key instruments and sounds", instruction: "List the main instruments and production elements that define the song's sound", examples: "808 bass, hi-hats, synth pads\nAcoustic guitar, strings, piano\nElectronic synths, drum machine" },
    { name: "structure", description: "Song structure and arrangement", instruction: "Map out the song structure (verse, chorus, bridge, etc.) and notable arrangement choices", examples: "Verse-Chorus-Verse-Chorus-Bridge-Chorus\nIntro-Verse-Pre-Chorus-Drop-Verse-Drop-Outro" },
  ];

  for (const attr of attributes) {
    await db.insert(schema.anatomyAttributes).values({
      id: nanoid(),
      name: attr.name,
      description: attr.description,
      instruction: attr.instruction,
      examples: attr.examples,
      archived: false,
    }).onConflictDoNothing();
  }

  // Seed a bin source
  await db.insert(schema.binSources).values({
    id: nanoid(),
    name: "YouTube",
    url: "https://youtube.com",
    archived: false,
  }).onConflictDoNothing();

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
