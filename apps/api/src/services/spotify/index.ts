/**
 * Spotify metadata extraction service.
 *
 * Uses the official Spotify Web API as the primary data source when
 * credentials are configured (SPOTIFY_CLIENT_ID + SPOTIFY_CLIENT_SECRET).
 * Falls back to the `spotify-url-info` scraping library when credentials
 * are not set or the API call fails.
 *
 * The public interface is unchanged — consumers call `fetchSpotifyData`
 * and `detectSpotifyType` without awareness of which strategy is used.
 */

import { getEnv } from "../../env.js";
import { fetchViaWebApi, enrichArtistImages } from "./web-api.js";
import { fetchViaScraper, enrichArtistImagesByScraping } from "./scraper.js";
import { detectSpotifyType } from "./types.js";
import type { SpotifyImportResult } from "./types.js";

// ---------------------------------------------------------------------------
// Re-exports (unchanged public interface)
// ---------------------------------------------------------------------------

export { detectSpotifyType } from "./types.js";
export type {
  SpotifyArtist,
  SpotifyTrack,
  SpotifyImportResult,
} from "./types.js";

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function getSpotifyCredentials(): {
  clientId: string;
  clientSecret: string;
} | null {
  const env = getEnv();
  if (env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET) {
    return {
      clientId: env.SPOTIFY_CLIENT_ID,
      clientSecret: env.SPOTIFY_CLIENT_SECRET,
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch metadata for a Spotify URL (track, album, or playlist).
 *
 * Returns an array of normalised tracks extracted from the URL.
 * For a single track URL the array will contain one entry.
 *
 * Strategy:
 * 1. If Spotify API credentials are configured, try the official Web API.
 * 2. On any failure (or if credentials are not set), fall back to scraping.
 */
export async function fetchSpotifyData(
  url: string
): Promise<SpotifyImportResult> {
  const type = detectSpotifyType(url);

  if (type === "unknown") {
    throw new Error(
      "Unsupported Spotify URL. Please provide a track, album, or playlist URL."
    );
  }

  const credentials = getSpotifyCredentials();
  let result: SpotifyImportResult | null = null;

  // Strategy 1: Official Web API (when credentials are configured)
  if (credentials) {
    try {
      result = await fetchViaWebApi(
        url,
        type,
        credentials.clientId,
        credentials.clientSecret
      );
    } catch (err: any) {
      console.warn(
        `[spotify] Web API failed, falling back to scraper: ${err?.message}`
      );
    }
  }

  // Strategy 2: Scraper fallback
  if (!result) {
    try {
      result = await fetchViaScraper(url);
    } catch (err: any) {
      const message =
        err?.message ?? "Unknown error while fetching Spotify data.";
      throw new Error(`Spotify fetch failed: ${message}`);
    }
  }

  // Enrich artists with individual images
  if (credentials) {
    result.tracks = await enrichArtistImages(
      result.tracks,
      credentials.clientId,
      credentials.clientSecret
    );
  } else {
    result.tracks = await enrichArtistImagesByScraping(result.tracks);
  }

  return result;
}
