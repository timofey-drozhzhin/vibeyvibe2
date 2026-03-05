/**
 * Spotify metadata extraction via the `spotify-url-info` scraping library.
 *
 * Scrapes public Spotify embed pages to extract track metadata without
 * requiring Spotify API credentials. Used as a fallback when the official
 * Web API is not configured or fails.
 *
 * Architecture:
 * - `fetchSingleTrack(spotifyId)` is the core unit: scrapes embed data +
 *   parses the main track page HTML for album/artist IDs.
 * - For track URLs: calls fetchSingleTrack once.
 * - For album/playlist URLs: extracts track IDs from the container, then
 *   calls fetchSingleTrack for each. Per-track data is always the source
 *   of truth over container-level metadata.
 */

import spotifyUrlInfo from "spotify-url-info";
import { detectSpotifyType } from "./types.js";
import type { SpotifyTrack, SpotifyImportResult } from "./types.js";

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
 * Fetch metadata from the main Spotify track page HTML.
 *
 * Extracts album name (from og:description), album Spotify ID and artist
 * Spotify IDs (from link patterns in the page). The spotify-url-info
 * library scrapes embed pages which lack this structured data.
 */
async function fetchTrackPageMetadata(
  spotifyId: string
): Promise<{
  albumName?: string;
  albumSpotifyId?: string;
  artistIds?: string[];
}> {
  try {
    const res = await fetch(`https://open.spotify.com/track/${spotifyId}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      redirect: "follow",
    });
    if (!res.ok) return {};

    const html = await res.text();

    // Extract album name from og:description
    // Format: "Artist · Album · Song · Year"
    let albumName: string | undefined;
    const ogMatch = html.match(
      /<meta\s+property="og:description"\s+content="([^"]+)"/
    );
    if (ogMatch) {
      const parts = ogMatch[1].split(" · ");
      if (parts.length >= 3) {
        albumName = parts[1].trim() || undefined;
      }
    }

    // Extract album Spotify ID from album links in HTML
    let albumSpotifyId: string | undefined;
    const albumMatch = html.match(/\/album\/([a-zA-Z0-9]{22})/);
    if (albumMatch) {
      albumSpotifyId = albumMatch[1];
    }

    // Extract unique artist Spotify IDs from artist links in HTML
    const artistIdSet = new Set<string>();
    const artistLinkRegex = /\/artist\/([a-zA-Z0-9]{22})/g;
    let artistMatch;
    while ((artistMatch = artistLinkRegex.exec(html)) !== null) {
      artistIdSet.add(artistMatch[1]);
    }

    return {
      albumName,
      albumSpotifyId,
      artistIds: artistIdSet.size > 0 ? Array.from(artistIdSet) : undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Pick the largest image from spotify-url-info embed data.
 */
function pickLargestEmbedImage(raw: any): string | undefined {
  if (raw.coverArt?.sources?.length) {
    return raw.coverArt.sources.reduce((a: any, b: any) =>
      (a.width ?? 0) > (b.width ?? 0) ? a : b
    ).url;
  }
  if (raw.images?.length) {
    return raw.images.reduce((a: any, b: any) =>
      (a.width ?? 0) > (b.width ?? 0) ? a : b
    ).url;
  }
  if (raw.visualIdentity?.image?.length) {
    return raw.visualIdentity.image.reduce((a: any, b: any) =>
      (a.maxWidth ?? 0) > (b.maxWidth ?? 0) ? a : b
    ).url;
  }
  return undefined;
}

/**
 * Normalize raw embed data from spotify-url-info into a SpotifyTrack.
 */
function normalizeEmbedData(raw: any): SpotifyTrack {
  // Artists
  let artists: { name: string; spotifyId?: string }[] = [];
  if (Array.isArray(raw.artists)) {
    artists = raw.artists.map((a: any) => {
      if (typeof a === "string") return { name: a };
      const id = a.uri ? spotifyIdFromUri(a.uri) : a.id;
      return { name: a.name ?? String(a), spotifyId: id || undefined };
    });
  } else if (typeof raw.artist === "string" && raw.artist) {
    artists = [{ name: raw.artist.trim() }];
  }

  // Image URL
  const imageUrl = pickLargestEmbedImage(raw);

  // Release date
  const releaseDate =
    raw.releaseDate?.isoString ??
    raw.release_date ??
    raw.date ??
    undefined;

  // Album name
  const albumName =
    raw.albumOfTrack?.name ??
    raw.album?.name ??
    (typeof raw.album === "string" ? raw.album : undefined) ??
    undefined;

  // Album Spotify ID from URI
  const albumSpotifyId =
    spotifyIdFromUri(raw.albumOfTrack?.uri) ||
    (typeof raw.album === "object" ? spotifyIdFromUri(raw.album?.uri) : undefined) ||
    undefined;

  return {
    name: raw.name ?? raw.title ?? "Unknown",
    artists,
    album: albumName ? { name: albumName, spotifyId: albumSpotifyId || undefined } : undefined,
    releaseDate: releaseDate ? releaseDate.slice(0, 10) : undefined,
    isrc: raw.external_ids?.isrc ?? raw.isrc ?? undefined,
    imageUrl,
    spotifyId: spotifyIdFromUri(raw.uri) || raw.id || "",
  };
}

// ---------------------------------------------------------------------------
// Core: fetch a single track (embed data + page metadata)
// ---------------------------------------------------------------------------

/**
 * Fetch full metadata for a single track by its Spotify ID.
 *
 * 1. Scrapes the embed page via spotify-url-info for structured data
 *    (name, artists, ISRC, images, release date).
 * 2. Fetches the main track page HTML for album/artist Spotify IDs.
 */
async function fetchSingleTrack(spotifyId: string): Promise<SpotifyTrack> {
  const embedUrl = `https://open.spotify.com/track/${spotifyId}`;
  const data = await getData(embedUrl);
  const track = normalizeEmbedData(data);

  // Ensure the spotifyId is set (embed data may not have URI)
  if (!track.spotifyId) track.spotifyId = spotifyId;

  // Fetch album/artist IDs from the main track page
  const metadata = await fetchTrackPageMetadata(spotifyId);

  // Apply album info
  if (!track.album && metadata.albumName) {
    track.album = { name: metadata.albumName, spotifyId: metadata.albumSpotifyId };
  } else if (track.album && !track.album.spotifyId && metadata.albumSpotifyId) {
    track.album.spotifyId = metadata.albumSpotifyId;
  }

  // Apply artist Spotify IDs
  if (metadata.artistIds && metadata.artistIds.length > 0) {
    for (let i = 0; i < track.artists.length && i < metadata.artistIds.length; i++) {
      if (!track.artists[i].spotifyId) {
        track.artists[i].spotifyId = metadata.artistIds[i];
      }
    }
  }

  return track;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch metadata for a Spotify URL using the scraping library.
 *
 * - Track URL: fetches the single track.
 * - Album/playlist URL: extracts track IDs from the container, then fetches
 *   each track individually. Per-track data takes priority over container data.
 */
export async function fetchViaScraper(
  url: string
): Promise<SpotifyImportResult> {
  const type = detectSpotifyType(url);

  if (type === "unknown") {
    throw new Error(
      "Unsupported Spotify URL. Please provide a track, album, or playlist URL."
    );
  }

  if (type === "track") {
    // Extract track ID from URL
    const idMatch = new URL(url).pathname.match(/\/track\/([a-zA-Z0-9]+)/);
    if (!idMatch) throw new Error("Could not extract track ID from URL");

    const track = await fetchSingleTrack(idMatch[1]);
    return { type, tracks: [track] };
  }

  // For albums and playlists: get the track list, then fetch each track
  const details = await getDetails(url);

  // Extract track Spotify IDs from the container response
  const trackIds: string[] = [];
  for (const t of details.tracks ?? []) {
    const id = spotifyIdFromUri(t.uri);
    if (id) trackIds.push(id);
  }

  if (trackIds.length === 0) {
    throw new Error("No tracks found at this URL.");
  }

  // Fetch each track through the shared pipeline, in batches of 5
  const tracks: SpotifyTrack[] = [];
  const BATCH_SIZE = 5;

  for (let i = 0; i < trackIds.length; i += BATCH_SIZE) {
    const batch = trackIds.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((id) => fetchSingleTrack(id))
    );
    for (const r of results) {
      if (r.status === "fulfilled") {
        tracks.push(r.value);
      }
    }
  }

  return { type, tracks };
}

/**
 * Enrich artist data with images by scraping artist embed pages.
 * Works without Spotify API credentials.
 */
export async function enrichArtistImagesByScraping(
  tracks: SpotifyTrack[]
): Promise<SpotifyTrack[]> {
  // Collect unique artist IDs
  const artistIds = new Set<string>();
  for (const t of tracks) {
    for (const a of t.artists) {
      if (a.spotifyId) artistIds.add(a.spotifyId);
    }
  }
  if (artistIds.size === 0) return tracks;

  // Fetch artist images in batches of 5
  const artistImages = new Map<string, string>();
  const ids = Array.from(artistIds);
  const BATCH_SIZE = 5;

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (id) => {
        const data = await getData(`https://open.spotify.com/artist/${id}`);
        const img = pickLargestEmbedImage(data);
        if (img) artistImages.set(id, img);
      })
    );
  }

  // Apply images to track artist data
  return tracks.map((t) => ({
    ...t,
    artists: t.artists.map((a) => ({
      ...a,
      imageUrl: a.spotifyId ? artistImages.get(a.spotifyId) : undefined,
    })),
  }));
}
