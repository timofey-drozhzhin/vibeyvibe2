/**
 * Spotify Client Credentials token manager.
 *
 * Caches the access token in memory with TTL tracking.
 * Edge-compatible — uses only `fetch` and `btoa`.
 */

interface CachedToken {
  accessToken: string;
  expiresAt: number; // Unix timestamp in ms
}

let cached: CachedToken | null = null;

/** Buffer before expiry to avoid using a token right at its TTL boundary. */
const EXPIRY_BUFFER_MS = 60_000;

/**
 * Get a valid Spotify access token, requesting a new one if the cache
 * is empty or expired.
 */
export async function getAccessToken(
  clientId: string,
  clientSecret: string
): Promise<string> {
  if (cached && Date.now() < cached.expiresAt - EXPIRY_BUFFER_MS) {
    return cached.accessToken;
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Spotify token request failed (${response.status}): ${errorText}`
    );
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };
  cached = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cached.accessToken;
}

/** Clear the cached token. Useful for testing. */
export function clearTokenCache(): void {
  cached = null;
}
