import { fetchSpotifyData } from "../services/spotify/index.js";

const args = process.argv.slice(2).filter((a) => a !== "--");
const url = args[0];
if (!url) {
  console.error("Usage: pnpm spotify-preview <spotify-url>");
  process.exit(1);
}

try {
  const result = await fetchSpotifyData(url);
  console.log(JSON.stringify(result, null, 2));
} catch (err: any) {
  console.error("Error:", err.message);
  process.exit(1);
}
