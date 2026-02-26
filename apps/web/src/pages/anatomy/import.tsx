import { useState, useCallback } from "react";
import { useNavigation, useCustom, useApiUrl } from "@refinedev/core";
import {
  Alert,
  Avatar,
  Badge,
  Box,
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
  IconAlertCircle,
  IconCheck,
} from "@tabler/icons-react";

// ---------------------------------------------------------------------------
// Types matching the API response
// ---------------------------------------------------------------------------

interface SpotifyArtist {
  name: string;
}

interface SpotifyTrack {
  name: string;
  artists: SpotifyArtist[];
  album?: { name: string } | null;
  releaseDate?: string | null;
  isrc?: string | null;
  imageUrl?: string | null;
  spotifyId: string;
}

interface ImportPreviewResponse {
  data: {
    type: string;
    url: string;
    tracks: SpotifyTrack[];
  };
}

interface ImportConfirmResponse {
  data: {
    created: any[];
    skipped: { name: string; reason: string }[];
    totalCreated: number;
    totalSkipped: number;
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AnatomyImport = () => {
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

    try {
      const res = await fetch(`${apiUrl}/anatomy/import`, {
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

    setIsConfirming(true);

    try {
      const res = await fetch(`${apiUrl}/anatomy/import/confirm`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracks: selected }),
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

      if (result.totalCreated > 0) {
        notifications.show({
          title: "Import successful",
          message: `${result.totalCreated} song(s) imported.${
            result.totalSkipped > 0
              ? ` ${result.totalSkipped} skipped.`
              : ""
          }`,
          color: "green",
        });
      } else {
        notifications.show({
          title: "Nothing imported",
          message:
            result.totalSkipped > 0
              ? `All ${result.totalSkipped} song(s) were skipped (duplicates).`
              : "No songs were imported.",
          color: "yellow",
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
  }, [previewTracks, selectedIds, apiUrl]);

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

  return (
    <Stack gap="md">
      <Group>
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => list("anatomy/songs")}
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
              {importResult.totalCreated} song(s) created.
            </Text>
            {importResult.totalSkipped > 0 && (
              <Text size="sm">
                {importResult.totalSkipped} song(s) skipped:
              </Text>
            )}
            {importResult.skipped.map((s, i) => (
              <Text key={i} size="xs" c="dimmed">
                - {s.name}: {s.reason}
              </Text>
            ))}
            <Group mt="sm">
              <Button
                size="xs"
                variant="light"
                onClick={() => list("anatomy/songs")}
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
                  setImportResult(null);
                }}
              >
                Import Another
              </Button>
            </Group>
          </Stack>
        </Alert>
      )}

      {/* Preview table */}
      {previewTracks.length > 0 && !importResult && (
        <Card withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Group gap="sm">
                <Title order={4}>Preview</Title>
                {previewType && (
                  <Badge variant="light" color="violet">
                    {previewType}
                  </Badge>
                )}
                <Text size="sm" c="dimmed">
                  {previewTracks.length} track(s) found
                </Text>
              </Group>
              <Button
                leftSection={<IconCheck size={16} />}
                onClick={handleConfirm}
                loading={isConfirming}
                disabled={selectedIds.size === 0}
              >
                Confirm Import ({selectedIds.size})
              </Button>
            </Group>

            <Table striped highlightOnHover>
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
                      <Text size="sm" fw={500}>
                        {track.name}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {track.artists.map((a) => a.name).join(", ")}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {track.album?.name ?? "-"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{track.releaseDate ?? "-"}</Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Stack>
        </Card>
      )}
    </Stack>
  );
};
