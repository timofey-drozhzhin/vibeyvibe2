/**
 * Spotify metadata extraction via the `spotify-url-info` scraping library.
 *
 * Scrapes public Spotify embed pages to extract track metadata without
 * requiring Spotify API credentials. Used as a fallback when the official
 * Web API is not configured or fails.
 */

import spotifyUrlInfo from "spotify-url-info";
import { detectSpotifyType } from "./types.js";
import type { SpotifyTrack, SpotifyImportResult } from "./types.js";

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

const { getData, getDetails } = spotifyUrlInfo(fetch);

/**
 * Fetch the album name for a track from the main Spotify page's OG metadata.
 *
 * The spotify-url-info library scrapes embed pages which do not include album
 * info. The main page's og:description follows the pattern:
 *   "Artist · Album · Song · Year"
 * so the album name is the second segment.
 */
async function fetchAlbumFromOgTags(
  spotifyId: string
): Promise<string | undefined> {
  try {
    const res = await fetch(`https://open.spotify.com/track/${spotifyId}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      redirect: "follow",
    });
    if (!res.ok) return undefined;

    const html = await res.text();
    // Match: <meta property="og:description" content="...">
    const match = html.match(
      /<meta\s+property="og:description"\s+content="([^"]+)"/
    );
    if (!match) return undefined;

    // Format: "Artist · Album · Song · Year"
    const parts = match[1].split(" · ");
    if (parts.length >= 3) {
      // Second segment is the album name
      return parts[1].trim() || undefined;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

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
 * Build a normalised SpotifyTrack from the raw data returned by
 * spotify-url-info's `getData` (for a single track) or from an individual
 * track entry inside an album / playlist.
 */
function normalizeTrack(raw: any, fallback?: { imageUrl?: string; album?: string; releaseDate?: string }): SpotifyTrack {
  // Artists can appear in several shapes depending on what spotify-url-info
  // returns.  Handle the most common ones.
  let artists: { name: string }[] = [];

  if (Array.isArray(raw.artists)) {
    artists = raw.artists.map((a: any) =>
      typeof a === "string" ? { name: a } : { name: a.name ?? String(a) }
    );
  } else if (typeof raw.artist === "string" && raw.artist) {
    artists = [{ name: raw.artist.trim() }];
  }

  // Extract image URL from various possible locations in the raw data.
  let imageUrl = fallback?.imageUrl;
  if (raw.coverArt?.sources?.length) {
    imageUrl = raw.coverArt.sources.reduce((a: any, b: any) =>
      (a.width ?? 0) > (b.width ?? 0) ? a : b
    ).url;
  } else if (raw.images?.length) {
    imageUrl = raw.images.reduce((a: any, b: any) =>
      (a.width ?? 0) > (b.width ?? 0) ? a : b
    ).url;
  } else if (raw.visualIdentity?.image?.length) {
    // Modern Spotify embeds store images under visualIdentity.image
    // with maxWidth/maxHeight instead of width/height
    imageUrl = raw.visualIdentity.image.reduce((a: any, b: any) =>
      (a.maxWidth ?? 0) > (b.maxWidth ?? 0) ? a : b
    ).url;
  }

  // Release date
  const releaseDate =
    raw.releaseDate?.isoString ??
    raw.release_date ??
    raw.date ??
    fallback?.releaseDate ??
    undefined;

  // Album name — only present on individual track getData responses.
  // Spotify embed pages may use `albumOfTrack` or `album` depending on version.
  const albumName =
    raw.albumOfTrack?.name ??
    raw.album?.name ??
    (typeof raw.album === "string" ? raw.album : undefined) ??
    fallback?.album ??
    undefined;

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
 * Fetch metadata for a Spotify URL using the scraping library.
 *
 * Returns an array of normalised tracks extracted from the URL.
 * For a single track URL the array will contain one entry.
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
    // For a single track we use getData which returns the richest response.
    const data = await getData(url);
    const track = normalizeTrack(data);

    // The embed page doesn't include album info, so fetch it from the
    // main Spotify page's OG tags when missing.
    if (!track.album && track.spotifyId) {
      const albumName = await fetchAlbumFromOgTags(track.spotifyId);
      if (albumName) {
        track.album = { name: albumName };
      }
    }

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

  // First pass: normalize tracks from the container response
  const initialTracks: SpotifyTrack[] = (details.tracks ?? []).map(
    (t: any) =>
      normalizeTrack(t, {
        imageUrl: containerImage,
        album: type === "album" ? containerTitle : undefined,
        releaseDate: containerDate,
      })
  );

  // Second pass: enrich tracks that are missing ISRC, album, or
  // release date by fetching individual track data via getData.
  // Process in batches of 5 to avoid overwhelming the endpoint.
  const enriched: SpotifyTrack[] = [];
  const BATCH_SIZE = 5;

  for (let i = 0; i < initialTracks.length; i += BATCH_SIZE) {
    const batch = initialTracks.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (track) => {
        const needsEnrichment =
          !track.isrc || !track.album || !track.releaseDate;
        if (!needsEnrichment || !track.spotifyId) return track;

        try {
          const trackUrl = `https://open.spotify.com/track/${track.spotifyId}`;
          const richData = await getData(trackUrl);
          const rich = normalizeTrack(richData, {
            imageUrl: track.imageUrl,
          });

          // The embed page doesn't include album info, so fetch from OG tags
          let album = rich.album || track.album;
          if (!album && track.spotifyId) {
            const albumName = await fetchAlbumFromOgTags(track.spotifyId);
            if (albumName) album = { name: albumName };
          }

          // Merge: prefer rich data, fall back to initial
          return {
            ...track,
            isrc: rich.isrc || track.isrc,
            album,
            releaseDate: rich.releaseDate || track.releaseDate,
            imageUrl: rich.imageUrl || track.imageUrl,
          };
        } catch {
          // If individual fetch fails, keep what we have
          return track;
        }
      })
    );

    for (const r of results) {
      enriched.push(
        r.status === "fulfilled" ? r.value : batch[enriched.length % batch.length]
      );
    }
  }

  return { type, tracks: enriched };
}
