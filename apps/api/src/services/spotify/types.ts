/**
 * Shared types and utilities for Spotify metadata extraction.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface SpotifyArtist {
  name: string;
  spotifyId?: string;
  imageUrl?: string;
}

export interface SpotifyTrack {
  name: string;
  artists: SpotifyArtist[];
  album?: { name: string; spotifyId?: string };
  releaseDate?: string;
  isrc?: string;
  imageUrl?: string;
  spotifyId: string;
}

export interface SpotifyImportResult {
  type: "track" | "album" | "playlist";
  tracks: SpotifyTrack[];
}

// ---------------------------------------------------------------------------
// URL utilities
// ---------------------------------------------------------------------------

/**
 * Detect the Spotify resource type from a URL path.
 */
export function detectSpotifyType(
  url: string
): "track" | "album" | "playlist" | "unknown" {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname;
    if (path.includes("/track/")) return "track";
    if (path.includes("/album/")) return "album";
    if (path.includes("/playlist/")) return "playlist";
    return "unknown";
  } catch {
    return "unknown";
  }
}
