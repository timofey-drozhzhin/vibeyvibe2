/**
 * Official Spotify Web API client.
 *
 * Uses the Client Credentials flow to access Spotify's REST API for
 * track, album, and playlist metadata. Edge-compatible (fetch only).
 */

import { getAccessToken } from "./token-manager.js";
import { detectSpotifyType } from "./types.js";
import type { SpotifyTrack, SpotifyImportResult } from "./types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Maximum number of tracks to fetch from a playlist (pagination guard). */
const MAX_PLAYLIST_TRACKS = 500;

/**
 * Make an authenticated GET request to the Spotify Web API.
 */
async function spotifyApiFetch(
  path: string,
  clientId: string,
  clientSecret: string
): Promise<any> {
  const token = await getAccessToken(clientId, clientSecret);
  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Spotify API error (${response.status}): ${errorText}`
    );
  }

  return response.json();
}

/**
 * Make an authenticated GET request to a full Spotify API URL (for pagination).
 */
async function spotifyApiFetchUrl(
  url: string,
  clientId: string,
  clientSecret: string
): Promise<any> {
  const token = await getAccessToken(clientId, clientSecret);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Spotify API error (${response.status}): ${errorText}`
    );
  }

  return response.json();
}

/**
 * Pick the largest image from a Spotify images array.
 */
function pickLargestImage(images?: any[]): string | undefined {
  if (!images?.length) return undefined;
  return images.reduce((a: any, b: any) =>
    (a.width ?? 0) > (b.width ?? 0) ? a : b
  ).url;
}

/**
 * Normalize an official Spotify API track object into our SpotifyTrack shape.
 */
function normalizeOfficialTrack(
  track: any,
  fallbackImage?: string
): SpotifyTrack {
  return {
    name: track.name,
    artists: (track.artists || []).map((a: any) => ({ name: a.name, spotifyId: a.id || undefined })),
    album: track.album?.name ? { name: track.album.name, spotifyId: track.album.id || undefined } : undefined,
    releaseDate: track.album?.release_date?.slice(0, 10) ?? undefined,
    isrc: track.external_ids?.isrc ?? undefined,
    imageUrl: pickLargestImage(track.album?.images) ?? fallbackImage,
    spotifyId: track.id,
  };
}

/**
 * Extract a Spotify resource ID from a URL.
 * Works with open.spotify.com URLs (e.g., /track/6rqhFgbbKwnb9MLmUQDhG6).
 */
function extractId(url: string, type: string): string {
  const parsed = new URL(url);
  const match = parsed.pathname.match(
    new RegExp(`/${type}/([a-zA-Z0-9]+)`)
  );
  if (!match) {
    throw new Error(`Could not extract ${type} ID from URL: ${url}`);
  }
  return match[1];
}

/**
 * Resolve a spotify.link short URL to its full open.spotify.com URL.
 * Returns the original URL if it's already a full URL or resolution fails.
 */
async function resolveShortUrl(url: string): Promise<string> {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "spotify.link") return url;

    const response = await fetch(url, { redirect: "follow" });
    // The final URL after redirects is the resolved open.spotify.com URL
    return response.url;
  } catch {
    return url;
  }
}

// ---------------------------------------------------------------------------
// Track
// ---------------------------------------------------------------------------

async function fetchTrack(
  url: string,
  clientId: string,
  clientSecret: string
): Promise<SpotifyImportResult> {
  const id = extractId(url, "track");
  const data = await spotifyApiFetch(`/tracks/${id}`, clientId, clientSecret);
  const track = normalizeOfficialTrack(data);
  return { type: "track", tracks: [track] };
}

// ---------------------------------------------------------------------------
// Album
// ---------------------------------------------------------------------------

async function fetchAlbum(
  url: string,
  clientId: string,
  clientSecret: string
): Promise<SpotifyImportResult> {
  const id = extractId(url, "album");
  const albumData = await spotifyApiFetch(
    `/albums/${id}`,
    clientId,
    clientSecret
  );

  const albumImage = pickLargestImage(albumData.images);
  const albumName = albumData.name;
  const albumReleaseDate = albumData.release_date?.slice(0, 10);

  // Album track items are "simplified" — they lack external_ids (ISRC) and
  // album info. Batch-fetch full track objects to get ISRCs.
  const trackItems = albumData.tracks?.items ?? [];
  const trackIds: string[] = trackItems.map((t: any) => t.id).filter(Boolean);
  const fullTracks = new Map<string, any>();

  // Batch endpoint accepts up to 50 IDs per request
  for (let i = 0; i < trackIds.length; i += 50) {
    const batch = trackIds.slice(i, i + 50);
    const batchData = await spotifyApiFetch(
      `/tracks?ids=${batch.join(",")}`,
      clientId,
      clientSecret
    );
    for (const track of batchData.tracks ?? []) {
      if (track) fullTracks.set(track.id, track);
    }
  }

  const tracks: SpotifyTrack[] = trackItems.map((item: any) => {
    const full = fullTracks.get(item.id);
    if (full) {
      return normalizeOfficialTrack(full, albumImage);
    }
    // Fallback if batch fetch missed this track
    return {
      name: item.name,
      artists: (item.artists || []).map((a: any) => ({ name: a.name, spotifyId: a.id || undefined })),
      album: albumName ? { name: albumName, spotifyId: id } : undefined,
      releaseDate: albumReleaseDate,
      isrc: undefined,
      imageUrl: albumImage,
      spotifyId: item.id,
    };
  });

  return { type: "album", tracks };
}

// ---------------------------------------------------------------------------
// Playlist
// ---------------------------------------------------------------------------

async function fetchPlaylist(
  url: string,
  clientId: string,
  clientSecret: string
): Promise<SpotifyImportResult> {
  const id = extractId(url, "playlist");
  const playlistData = await spotifyApiFetch(
    `/playlists/${id}`,
    clientId,
    clientSecret
  );

  const playlistImage = pickLargestImage(playlistData.images);
  const tracks: SpotifyTrack[] = [];

  // First page of tracks
  let tracksPage = playlistData.tracks;

  while (tracksPage && tracks.length < MAX_PLAYLIST_TRACKS) {
    for (const item of tracksPage.items ?? []) {
      if (tracks.length >= MAX_PLAYLIST_TRACKS) break;
      // Playlist items have a .track property (full track object)
      const track = item?.track;
      if (!track || track.is_local) continue;
      tracks.push(normalizeOfficialTrack(track, playlistImage));
    }

    // Follow pagination
    if (tracksPage.next && tracks.length < MAX_PLAYLIST_TRACKS) {
      tracksPage = await spotifyApiFetchUrl(
        tracksPage.next,
        clientId,
        clientSecret
      );
    } else {
      break;
    }
  }

  return { type: "playlist", tracks };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch metadata for a Spotify URL using the official Web API.
 *
 * Requires valid client credentials. The URL may be a short spotify.link
 * which will be resolved before processing.
 */
export async function fetchViaWebApi(
  url: string,
  type: "track" | "album" | "playlist",
  clientId: string,
  clientSecret: string
): Promise<SpotifyImportResult> {
  // Resolve short URLs before extracting IDs
  const resolvedUrl = await resolveShortUrl(url);

  // Re-detect type from resolved URL if it was a short link
  const resolvedType =
    url !== resolvedUrl ? detectSpotifyType(resolvedUrl) : type;
  const effectiveType =
    resolvedType !== "unknown" ? resolvedType : type;

  switch (effectiveType) {
    case "track":
      return fetchTrack(resolvedUrl, clientId, clientSecret);
    case "album":
      return fetchAlbum(resolvedUrl, clientId, clientSecret);
    case "playlist":
      return fetchPlaylist(resolvedUrl, clientId, clientSecret);
  }
}
