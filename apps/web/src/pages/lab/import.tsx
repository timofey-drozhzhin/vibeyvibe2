import { useState, useCallback } from "react";
import { useNavigation, useApiUrl } from "@refinedev/core";
import {
  Alert,
  Anchor,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Center,
  Group,
  Loader,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconArrowLeft,
  IconClipboard,
  IconDownload,
  IconCheck,
} from "@tabler/icons-react";
import { formatDate } from "../../utils/format-date.js";

// ---------------------------------------------------------------------------
// Types matching the API response
// ---------------------------------------------------------------------------

interface SpotifyArtist {
  name: string;
  spotifyId?: string;
  imageUrl?: string | null;
}

interface SpotifyTrack {
  name: string;
  artists: SpotifyArtist[];
  album?: { name: string; spotifyId?: string } | null;
  releaseDate?: string | null;
  isrc?: string | null;
  imageUrl?: string | null;
  spotifyId: string;
}

interface ExistingEntries {
  songs: string[];
  artists: string[];
  albums: string[];
}

interface ImportPreviewResponse {
  data: {
    type: string;
    url: string;
    tracks: SpotifyTrack[];
    existing: ExistingEntries;
  };
}

interface ImportConfirmResponse {
  data: {
    created: any[];
    updated: any[];
    totalCreated: number;
    totalUpdated: number;
    artistsCreated: number;
    artistsUpdated: number;
    albumsCreated: number;
    albumsUpdated: number;
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const LabImport = () => {
  const { list } = useNavigation();
  const apiUrl = useApiUrl();

  // Form state
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");

  // Preview state
  const [isLoading, setIsLoading] = useState(false);
  const [previewTracks, setPreviewTracks] = useState<SpotifyTrack[]>([]);
  const [previewType, setPreviewType] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [excludedArtistKeys, setExcludedArtistKeys] = useState<Set<string>>(new Set());
  const [excludedAlbumKeys, setExcludedAlbumKeys] = useState<Set<string>>(new Set());
  const [existingEntries, setExistingEntries] = useState<ExistingEntries>({ songs: [], artists: [], albums: [] });

  // Confirm state
  const [isConfirming, setIsConfirming] = useState(false);
  const [importResult, setImportResult] = useState<
    ImportConfirmResponse["data"] | null
  >(null);

  // ---------- Validation ----------

  function isValidSpotifyUrl(value: string): boolean {
    try {
      const parsed = new URL(value);
      return (
        parsed.hostname === "open.spotify.com" ||
        parsed.hostname === "spotify.link"
      );
    } catch {
      return false;
    }
  }

  // ---------- Fetch preview ----------

  const handleImport = useCallback(async () => {
    setUrlError("");
    setImportResult(null);

    if (!url.trim()) {
      setUrlError("Please enter a Spotify URL.");
      return;
    }

    if (!isValidSpotifyUrl(url.trim())) {
      setUrlError(
        "Invalid URL. Please enter a valid Spotify track, album, or playlist URL."
      );
      return;
    }

    setIsLoading(true);
    setPreviewTracks([]);
    setPreviewType(null);
    setSelectedIds(new Set());
    setExcludedArtistKeys(new Set());
    setExcludedAlbumKeys(new Set());
    setExistingEntries({ songs: [], artists: [], albums: [] });

    try {
      const res = await fetch(`${apiUrl}/lab/import`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const body = await res.json();

      if (!res.ok) {
        setUrlError(body.error || `Request failed (${res.status})`);
        return;
      }

      const tracks: SpotifyTrack[] = body.data?.tracks ?? [];
      if (tracks.length === 0) {
        setUrlError("No tracks found at this URL.");
        return;
      }

      setPreviewTracks(tracks);
      setPreviewType(body.data?.type ?? null);
      setExistingEntries(body.data?.existing ?? { songs: [], artists: [], albums: [] });
      // Select all by default
      setSelectedIds(new Set(tracks.map((t) => t.spotifyId)));
    } catch (err: any) {
      setUrlError(err?.message ?? "Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [url, apiUrl]);

  // ---------- Confirm import ----------

  const handleConfirm = useCallback(async () => {
    const selected = previewTracks.filter((t) => selectedIds.has(t.spotifyId));
    if (selected.length === 0) return;

    // Strip excluded artists/albums from each track
    const tracksToSend = selected.map((t) => ({
      ...t,
      artists: t.artists.filter((a) => {
        const key = a.spotifyId || a.name.toLowerCase();
        return !excludedArtistKeys.has(key);
      }),
      album: t.album?.name
        ? excludedAlbumKeys.has(t.album.spotifyId || t.album.name.toLowerCase())
          ? null
          : t.album
        : t.album,
    })).filter((t) => t.artists.length > 0); // songs need at least 1 artist

    if (tracksToSend.length === 0) return;

    setIsConfirming(true);

    try {
      const res = await fetch(`${apiUrl}/lab/import/confirm`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracks: tracksToSend }),
      });

      const body = await res.json();

      if (!res.ok) {
        notifications.show({
          title: "Import failed",
          message: body.error || `Request failed (${res.status})`,
          color: "red",
        });
        return;
      }

      const result = body.data as ImportConfirmResponse["data"];
      setImportResult(result);

      {
        const parts: string[] = [];
        if (result.totalCreated > 0) parts.push(`${result.totalCreated} song(s) created`);
        if (result.totalUpdated > 0) parts.push(`${result.totalUpdated} song(s) updated`);
        if (result.artistsCreated > 0) parts.push(`${result.artistsCreated} artist(s) created`);
        if (result.artistsUpdated > 0) parts.push(`${result.artistsUpdated} artist(s) updated`);
        if (result.albumsCreated > 0) parts.push(`${result.albumsCreated} album(s) created`);
        if (result.albumsUpdated > 0) parts.push(`${result.albumsUpdated} album(s) updated`);
        notifications.show({
          title: "Import successful",
          message: parts.join(", ") + ".",
          color: "green",
        });
      }
    } catch (err: any) {
      notifications.show({
        title: "Import failed",
        message: err?.message ?? "Network error. Please try again.",
        color: "red",
      });
    } finally {
      setIsConfirming(false);
    }
  }, [previewTracks, selectedIds, excludedArtistKeys, excludedAlbumKeys, apiUrl]);

  // ---------- Selection helpers ----------

  const toggleTrack = (spotifyId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(spotifyId)) {
        next.delete(spotifyId);
      } else {
        next.add(spotifyId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === previewTracks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(previewTracks.map((t) => t.spotifyId)));
    }
  };

  // ---------- Artist/Album selection helpers ----------

  const getArtistKey = (a: SpotifyArtist) => a.spotifyId || a.name.toLowerCase();

  const toggleArtist = (key: string) => {
    setExcludedArtistKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleAllArtists = (allKeys: string[]) => {
    const allExcluded = allKeys.every((k) => excludedArtistKeys.has(k));
    if (allExcluded) {
      setExcludedArtistKeys((prev) => {
        const next = new Set(prev);
        for (const k of allKeys) next.delete(k);
        return next;
      });
    } else {
      setExcludedArtistKeys((prev) => {
        const next = new Set(prev);
        for (const k of allKeys) next.add(k);
        return next;
      });
    }
  };

  const getAlbumKey = (a: { name: string; spotifyId?: string }) => a.spotifyId || a.name.toLowerCase();

  const toggleAlbum = (key: string) => {
    setExcludedAlbumKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleAllAlbums = (allKeys: string[]) => {
    const allExcluded = allKeys.every((k) => excludedAlbumKeys.has(k));
    if (allExcluded) {
      setExcludedAlbumKeys((prev) => {
        const next = new Set(prev);
        for (const k of allKeys) next.delete(k);
        return next;
      });
    } else {
      setExcludedAlbumKeys((prev) => {
        const next = new Set(prev);
        for (const k of allKeys) next.add(k);
        return next;
      });
    }
  };

  // ---------- Paste from clipboard ----------

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setUrlError("");
      }
    } catch {
      // Clipboard API may not be available
    }
  };

  // ---------- Render ----------

  const allSelected =
    previewTracks.length > 0 && selectedIds.size === previewTracks.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  // Sets for quick "exists" lookup
  const existingSongSet = new Set(existingEntries.songs);
  const existingArtistSet = new Set(existingEntries.artists);
  const existingAlbumSet = new Set(existingEntries.albums);

  // Derive unique artists and albums from selected tracks
  const selectedTracks = previewTracks.filter((t) => selectedIds.has(t.spotifyId));

  const uniqueArtists = (() => {
    const map = new Map<string, SpotifyArtist>();
    for (const track of selectedTracks) {
      for (const a of track.artists) {
        const key = a.spotifyId || a.name.toLowerCase();
        if (!map.has(key)) map.set(key, a);
      }
    }
    return Array.from(map.values());
  })();

  const uniqueAlbums = (() => {
    const map = new Map<string, { name: string; spotifyId?: string; imageUrl?: string | null; releaseDate?: string | null; artists: SpotifyArtist[] }>();
    for (const track of selectedTracks) {
      if (track.album?.name) {
        const key = track.album.spotifyId || track.album.name.toLowerCase();
        const existing = map.get(key);
        if (!existing) {
          map.set(key, {
            name: track.album.name,
            spotifyId: track.album.spotifyId,
            imageUrl: track.imageUrl,
            releaseDate: track.releaseDate,
            artists: [...track.artists],
          });
        } else {
          // Merge in any new artists from this track
          for (const a of track.artists) {
            const aKey = a.spotifyId || a.name.toLowerCase();
            if (!existing.artists.some((ea) => (ea.spotifyId || ea.name.toLowerCase()) === aKey)) {
              existing.artists.push(a);
            }
          }
        }
      }
    }
    return Array.from(map.values());
  })();

  return (
    <Stack gap="md">
      <Group>
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => list("lab/songs")}
        >
          Back to Songs
        </Button>
        <Title order={2}>Import from Spotify</Title>
      </Group>

      {/* URL input */}
      <Card withBorder>
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Paste a Spotify track, album, or playlist URL to extract song
            metadata. You can review the results before importing.
          </Text>

          <Group align="flex-end" gap="sm">
            <TextInput
              flex={1}
              label="Spotify URL"
              placeholder="https://open.spotify.com/track/..."
              value={url}
              onChange={(e) => {
                setUrl(e.currentTarget.value);
                setUrlError("");
              }}
              error={urlError || undefined}
              rightSection={
                <IconClipboard
                  size={16}
                  style={{ cursor: "pointer", opacity: 0.6 }}
                  onClick={handlePaste}
                />
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") handleImport();
              }}
            />
            <Button
              leftSection={<IconDownload size={16} />}
              onClick={handleImport}
              loading={isLoading}
              disabled={!url.trim()}
            >
              Import
            </Button>
          </Group>
        </Stack>
      </Card>

      {/* Loading */}
      {isLoading && (
        <Center py="xl">
          <Loader />
        </Center>
      )}

      {/* Import result summary */}
      {importResult && (
        <Alert
          icon={<IconCheck size={18} />}
          color="green"
          title="Import complete"
        >
          <Stack gap={4}>
            <Text size="sm">
              {[
                importResult.totalCreated > 0 && `${importResult.totalCreated} song(s) created`,
                importResult.totalUpdated > 0 && `${importResult.totalUpdated} song(s) updated`,
                importResult.artistsCreated > 0 && `${importResult.artistsCreated} artist(s) created`,
                importResult.artistsUpdated > 0 && `${importResult.artistsUpdated} artist(s) updated`,
                importResult.albumsCreated > 0 && `${importResult.albumsCreated} album(s) created`,
                importResult.albumsUpdated > 0 && `${importResult.albumsUpdated} album(s) updated`,
              ].filter(Boolean).join(", ")}.
            </Text>
            <Group mt="sm">
              <Button
                size="xs"
                variant="light"
                onClick={() => list("lab/songs")}
              >
                View Songs
              </Button>
              <Button
                size="xs"
                variant="subtle"
                onClick={() => {
                  setUrl("");
                  setPreviewTracks([]);
                  setPreviewType(null);
                  setSelectedIds(new Set());
                  setExcludedArtistKeys(new Set());
                  setExcludedAlbumKeys(new Set());
                  setExistingEntries({ songs: [], artists: [], albums: [] });
                  setImportResult(null);
                }}
              >
                Import Another
              </Button>
            </Group>
          </Stack>
        </Alert>
      )}

      {/* Preview sections */}
      {previewTracks.length > 0 && !importResult && (
        <Stack gap="md">
          {/* Header with confirm button */}
          <Group justify="space-between">
            <Group gap="sm">
              <Title order={3}>Preview</Title>
              {previewType && (
                <Badge variant="light" color="violet">
                  {previewType}
                </Badge>
              )}
            </Group>
            <Button
              leftSection={<IconCheck size={16} />}
              onClick={handleConfirm}
              loading={isConfirming}
              disabled={selectedIds.size === 0}
            >
              Confirm Import
            </Button>
          </Group>

          {/* Songs section */}
          <Card withBorder>
            <Stack gap="sm">
              <Group gap="xs">
                <Title order={4}>Songs</Title>
                <Badge variant="light" size="sm">{selectedTracks.length}</Badge>
              </Group>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th w={40}>
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected}
                        onChange={toggleAll}
                        aria-label="Select all"
                      />
                    </Table.Th>
                    <Table.Th w={50}></Table.Th>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Artists</Table.Th>
                    <Table.Th>Album</Table.Th>
                    <Table.Th>Release Date</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {previewTracks.map((track) => (
                    <Table.Tr key={track.spotifyId}>
                      <Table.Td>
                        <Checkbox
                          checked={selectedIds.has(track.spotifyId)}
                          onChange={() => toggleTrack(track.spotifyId)}
                          aria-label={`Select ${track.name}`}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Avatar
                          size={32}
                          radius="sm"
                          src={track.imageUrl ?? null}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Anchor
                            size="sm"
                            fw={500}
                            href={`https://open.spotify.com/track/${track.spotifyId}`}
                            target="_blank"
                            underline="hover"
                          >
                            {track.name}
                          </Anchor>
                          {existingSongSet.has(track.spotifyId) && (
                            <Badge size="xs" variant="light" color="red">Overrides</Badge>
                          )}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4} wrap="wrap">
                          {track.artists.map((a, i) => (
                            <Badge
                              key={i}
                              variant="light"
                              size="sm"
                              component="a"
                              href={a.spotifyId
                                ? `https://open.spotify.com/artist/${a.spotifyId}`
                                : `https://open.spotify.com/search/${encodeURIComponent(a.name)}`
                              }
                              target="_blank"
                              style={{ cursor: "pointer" }}
                            >
                              {a.name}
                            </Badge>
                          ))}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        {track.album?.name ? (
                          <Anchor
                            size="sm"
                            href={track.album.spotifyId
                              ? `https://open.spotify.com/album/${track.album.spotifyId}`
                              : `https://open.spotify.com/search/${encodeURIComponent(track.album.name)}`
                            }
                            target="_blank"
                            underline="hover"
                          >
                            {track.album.name}
                          </Anchor>
                        ) : (
                          <Text size="sm">-</Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{track.releaseDate ? formatDate(track.releaseDate) : "-"}</Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Stack>
          </Card>

          {/* Artists section */}
          {uniqueArtists.length > 0 && (() => {
            const artistKeys = uniqueArtists.map(getArtistKey);
            const selectedCount = artistKeys.filter((k) => !excludedArtistKeys.has(k)).length;
            const allArtistsSelected = selectedCount === uniqueArtists.length;
            const someArtistsSelected = selectedCount > 0 && !allArtistsSelected;
            return (
              <Card withBorder>
                <Stack gap="sm">
                  <Group gap="xs">
                    <Title order={4}>Artists</Title>
                    <Badge variant="light" size="sm">{selectedCount}</Badge>
                  </Group>
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th w={40}>
                          <Checkbox
                            checked={allArtistsSelected}
                            indeterminate={someArtistsSelected}
                            onChange={() => toggleAllArtists(artistKeys)}
                            aria-label="Select all artists"
                          />
                        </Table.Th>
                        <Table.Th w={50}></Table.Th>
                        <Table.Th>Name</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {uniqueArtists.map((artist) => {
                        const key = getArtistKey(artist);
                        return (
                          <Table.Tr key={key}>
                            <Table.Td>
                              <Checkbox
                                checked={!excludedArtistKeys.has(key)}
                                onChange={() => toggleArtist(key)}
                                aria-label={`Select ${artist.name}`}
                              />
                            </Table.Td>
                            <Table.Td>
                              <Avatar
                                size={32}
                                radius="sm"
                                src={artist.imageUrl ?? null}
                              />
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs">
                                <Anchor
                                  size="sm"
                                  fw={500}
                                  href={artist.spotifyId
                                    ? `https://open.spotify.com/artist/${artist.spotifyId}`
                                    : `https://open.spotify.com/search/${encodeURIComponent(artist.name)}`
                                  }
                                  target="_blank"
                                  underline="hover"
                                >
                                  {artist.name}
                                </Anchor>
                                {existingArtistSet.has(key) && (
                                  <Badge size="xs" variant="light" color="red">Overrides</Badge>
                                )}
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </Stack>
              </Card>
            );
          })()}

          {/* Albums section */}
          {uniqueAlbums.length > 0 && (() => {
            const albumKeys = uniqueAlbums.map(getAlbumKey);
            const selectedCount = albumKeys.filter((k) => !excludedAlbumKeys.has(k)).length;
            const allAlbumsSelected = selectedCount === uniqueAlbums.length;
            const someAlbumsSelected = selectedCount > 0 && !allAlbumsSelected;
            return (
              <Card withBorder>
                <Stack gap="sm">
                  <Group gap="xs">
                    <Title order={4}>Albums</Title>
                    <Badge variant="light" size="sm">{selectedCount}</Badge>
                  </Group>
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th w={40}>
                          <Checkbox
                            checked={allAlbumsSelected}
                            indeterminate={someAlbumsSelected}
                            onChange={() => toggleAllAlbums(albumKeys)}
                            aria-label="Select all albums"
                          />
                        </Table.Th>
                        <Table.Th w={50}></Table.Th>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Artists</Table.Th>
                        <Table.Th>Release Date</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {uniqueAlbums.map((album) => {
                        const key = getAlbumKey(album);
                        return (
                          <Table.Tr key={key}>
                            <Table.Td>
                              <Checkbox
                                checked={!excludedAlbumKeys.has(key)}
                                onChange={() => toggleAlbum(key)}
                                aria-label={`Select ${album.name}`}
                              />
                            </Table.Td>
                            <Table.Td>
                              <Avatar
                                size={32}
                                radius="sm"
                                src={album.imageUrl ?? null}
                              />
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs">
                                <Anchor
                                  size="sm"
                                  fw={500}
                                  href={album.spotifyId
                                    ? `https://open.spotify.com/album/${album.spotifyId}`
                                    : `https://open.spotify.com/search/${encodeURIComponent(album.name)}`
                                  }
                                  target="_blank"
                                  underline="hover"
                                >
                                  {album.name}
                                </Anchor>
                                {existingAlbumSet.has(key) && (
                                  <Badge size="xs" variant="light" color="red">Overrides</Badge>
                                )}
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Group gap={4} wrap="wrap">
                                {album.artists.map((a, i) => (
                                  <Badge
                                    key={i}
                                    variant="light"
                                    size="sm"
                                    component="a"
                                    href={a.spotifyId
                                      ? `https://open.spotify.com/artist/${a.spotifyId}`
                                      : `https://open.spotify.com/search/${encodeURIComponent(a.name)}`
                                    }
                                    target="_blank"
                                    style={{ cursor: "pointer" }}
                                  >
                                    {a.name}
                                  </Badge>
                                ))}
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">{album.releaseDate ? formatDate(album.releaseDate) : "-"}</Text>
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </Stack>
              </Card>
            );
          })()}
        </Stack>
      )}
    </Stack>
  );
};
