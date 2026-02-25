/**
 * Spotify metadata extraction service.
 *
 * Uses the `spotify-url-info` library to scrape public Spotify embed pages
 * and extract track metadata without requiring Spotify API credentials.
 *
 * The service is designed with a clean interface so the underlying library
 * can be swapped out in the future without affecting consumers.
 */

import spotifyUrlInfo from "spotify-url-info";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface SpotifyArtist {
  name: string;
}

export interface SpotifyTrack {
  name: string;
  artists: SpotifyArtist[];
  album?: { name: string };
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
// Internals
// ---------------------------------------------------------------------------

const { getData, getDetails } = spotifyUrlInfo(fetch);

/**
 * Extract the Spotify ID from a Spotify URI string.
 * URIs look like `spotify:track:6rqhFgbbKwnb9MLmUQDhG6`
 */
function spotifyIdFromUri(uri?: string): string {
  if (!uri) return "";
  const parts = uri.split(":");
  return parts[parts.length - 1] || "";
}

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

/**
 * Build a normalised SpotifyTrack from the raw data returned by
 * spotify-url-info's `getData` (for a single track) or from an individual
 * track entry inside an album / playlist.
 */
function normalizeTrack(raw: any, fallback?: { imageUrl?: string; album?: string; releaseDate?: string }): SpotifyTrack {
  // Artists can appear in several shapes depending on what spotify-url-info
  // returns.  Handle the most common ones.
  let artists: SpotifyArtist[] = [];

  if (Array.isArray(raw.artists)) {
    artists = raw.artists.map((a: any) =>
      typeof a === "string" ? { name: a } : { name: a.name ?? String(a) }
    );
  } else if (typeof raw.artist === "string" && raw.artist) {
    // The `toTrack` shape from spotify-url-info joins artists into a single string.
    artists = raw.artist.split(/, | & /).map((n: string) => ({ name: n.trim() }));
  }

  // Extract image URL.  `coverArt.sources` is the most reliable field on
  // the raw getData response, but `images` also appears sometimes.
  let imageUrl = fallback?.imageUrl;
  if (raw.coverArt?.sources?.length) {
    imageUrl = raw.coverArt.sources.reduce((a: any, b: any) =>
      (a.width ?? 0) > (b.width ?? 0) ? a : b
    ).url;
  } else if (raw.images?.length) {
    imageUrl = raw.images.reduce((a: any, b: any) =>
      (a.width ?? 0) > (b.width ?? 0) ? a : b
    ).url;
  }

  // Release date
  const releaseDate =
    raw.releaseDate?.isoString ??
    raw.release_date ??
    raw.date ??
    fallback?.releaseDate ??
    undefined;

  // Album name — only present on individual track getData responses
  const albumName = raw.album?.name ?? fallback?.album ?? undefined;

  return {
    name: raw.name ?? raw.title ?? "Unknown",
    artists,
    album: albumName ? { name: albumName } : undefined,
    releaseDate: releaseDate ? releaseDate.slice(0, 10) : undefined, // YYYY-MM-DD
    isrc: raw.external_ids?.isrc ?? raw.isrc ?? undefined,
    imageUrl,
    spotifyId: spotifyIdFromUri(raw.uri) || raw.id || "",
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch metadata for a Spotify URL (track, album, or playlist).
 *
 * Returns an array of normalised tracks extracted from the URL.
 * For a single track URL the array will contain one entry.
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

  try {
    if (type === "track") {
      // For a single track we use getData which returns the richest response.
      const data = await getData(url);
      const track = normalizeTrack(data);
      return { type, tracks: [track] };
    }

    // For albums and playlists, getDetails gives us both the preview
    // (which has the album / playlist image) and the track list.
    const details = await getDetails(url);
    const containerImage = details.preview?.image;
    const containerDate = details.preview?.date
      ? details.preview.date.slice(0, 10)
      : undefined;
    const containerTitle = details.preview?.title;

    const tracks: SpotifyTrack[] = (details.tracks ?? []).map((t: any) =>
      normalizeTrack(t, {
        imageUrl: containerImage,
        album: type === "album" ? containerTitle : undefined,
        releaseDate: containerDate,
      })
    );

    return { type, tracks };
  } catch (err: any) {
    // Re-throw with a friendlier message
    const message =
      err?.message ?? "Unknown error while fetching Spotify data.";
    throw new Error(`Spotify fetch failed: ${message}`);
  }
}
