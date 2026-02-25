import { useState } from "react";
import { useShow, useNavigation } from "@refinedev/core";
import {
  Card,
  Group,
  Stack,
  Title,
  Text,
  Button,
  Table,
  Badge,
  LoadingOverlay,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconArrowLeft, IconEdit, IconPlus, IconUnlink } from "@tabler/icons-react";
import { RatingDisplay } from "../../../components/shared/rating-field.js";
import { ArchiveBadge } from "../../../components/shared/archive-toggle.js";
import { AssignModal } from "../../../components/shared/assign-modal.js";
import { ImagePreview } from "../../../components/shared/image-preview.js";

const API_URL = import.meta.env.VITE_API_URL || "";

export const SongShow = () => {
  const { list, edit, show: showNav } = useNavigation();
  const { query, result } = useShow({
    resource: "my-music/songs",
  });

  const record = result;

  const [artistModalOpened, { open: openArtistModal, close: closeArtistModal }] =
    useDisclosure(false);
  const [albumModalOpened, { open: openAlbumModal, close: closeAlbumModal }] =
    useDisclosure(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemoveArtist = async (artistId: string) => {
    setRemovingId(artistId);
    try {
      const res = await fetch(
        `${API_URL}/api/my-music/songs/${record?.id}/artists/${artistId}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      notifications.show({
        title: "Removed",
        message: "Artist removed from song.",
        color: "green",
      });
      query.refetch();
    } catch (err: any) {
      notifications.show({
        title: "Error",
        message: err.message || "Failed to remove artist.",
        color: "red",
      });
    } finally {
      setRemovingId(null);
    }
  };

  const handleRemoveAlbum = async (albumId: string) => {
    setRemovingId(albumId);
    try {
      const res = await fetch(
        `${API_URL}/api/my-music/songs/${record?.id}/albums/${albumId}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      notifications.show({
        title: "Removed",
        message: "Album removed from song.",
        color: "green",
      });
      query.refetch();
    } catch (err: any) {
      notifications.show({
        title: "Error",
        message: err.message || "Failed to remove album.",
        color: "red",
      });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Stack>
      <Group justify="space-between">
        <Group>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => list("my-music/songs")}
          >
            Back
          </Button>
          <Title order={3}>Song Details</Title>
        </Group>
        {record?.id && (
          <Button
            leftSection={<IconEdit size={16} />}
            variant="outline"
            onClick={() => edit("my-music/songs", record.id!)}
          >
            Edit
          </Button>
        )}
      </Group>

      <Card withBorder p="lg" pos="relative">
        <LoadingOverlay visible={query.isLoading} />
        {record && (
          <Stack gap="sm">
            <Group>
              <Title order={4}>{record.name}</Title>
              <ArchiveBadge archived={record.archived} />
            </Group>

            <Group gap="xl">
              <div>
                <Text size="xs" c="dimmed">
                  ISRC
                </Text>
                <Text size="sm">{record.isrc || "-"}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  Release Date
                </Text>
                <Text size="sm">{record.releaseDate || "-"}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  Rating
                </Text>
                <RatingDisplay value={record.rating ?? 0} />
              </div>
            </Group>

            {record.imagePath && (
              <div>
                <Text size="xs" c="dimmed" mb={4}>
                  Image
                </Text>
                <ImagePreview path={record.imagePath} alt={record.name} />
              </div>
            )}

            <Group gap="xl">
              {record.spotifyId && (
                <div>
                  <Text size="xs" c="dimmed">
                    Spotify ID
                  </Text>
                  <Text size="sm">{record.spotifyId}</Text>
                </div>
              )}
              {record.appleMusicId && (
                <div>
                  <Text size="xs" c="dimmed">
                    Apple Music ID
                  </Text>
                  <Text size="sm">{record.appleMusicId}</Text>
                </div>
              )}
              {record.youtubeId && (
                <div>
                  <Text size="xs" c="dimmed">
                    YouTube ID
                  </Text>
                  <Text size="sm">{record.youtubeId}</Text>
                </div>
              )}
            </Group>

            <Group gap="xl">
              <div>
                <Text size="xs" c="dimmed">
                  Created
                </Text>
                <Text size="sm">{record.createdAt}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  Updated
                </Text>
                <Text size="sm">{record.updatedAt}</Text>
              </div>
            </Group>
          </Stack>
        )}
      </Card>

      <Card withBorder p="lg">
        <Stack>
          <Group justify="space-between">
            <Title order={5}>Artists</Title>
            {record?.id && (
              <Button
                size="xs"
                variant="light"
                leftSection={<IconPlus size={14} />}
                onClick={openArtistModal}
              >
                Assign Artist
              </Button>
            )}
          </Group>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>ISNI</Table.Th>
                <Table.Th>Rating</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th w={60}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(!record?.artists || record.artists.length === 0) && (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text c="dimmed" ta="center" py="md">
                      No artists assigned.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
              {record?.artists?.map((artist: any) => (
                <Table.Tr
                  key={artist.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => showNav("my-music/artists", artist.id)}
                >
                  <Table.Td>{artist.name}</Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {artist.isni || "-"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <RatingDisplay value={artist.rating ?? 0} />
                  </Table.Td>
                  <Table.Td>
                    {artist.archived ? (
                      <Badge color="red" variant="light">
                        Archived
                      </Badge>
                    ) : (
                      <Badge color="green" variant="light">
                        Active
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Tooltip label="Remove artist from song">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        loading={removingId === artist.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveArtist(artist.id);
                        }}
                      >
                        <IconUnlink size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </Card>

      <Card withBorder p="lg">
        <Stack>
          <Group justify="space-between">
            <Title order={5}>Albums</Title>
            {record?.id && (
              <Button
                size="xs"
                variant="light"
                leftSection={<IconPlus size={14} />}
                onClick={openAlbumModal}
              >
                Assign Album
              </Button>
            )}
          </Group>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>EAN</Table.Th>
                <Table.Th>Release Date</Table.Th>
                <Table.Th>Rating</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th w={60}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(!record?.albums || record.albums.length === 0) && (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text c="dimmed" ta="center" py="md">
                      No albums assigned.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
              {record?.albums?.map((album: any) => (
                <Table.Tr
                  key={album.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => showNav("my-music/albums", album.id)}
                >
                  <Table.Td>{album.name}</Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {album.ean || "-"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{album.releaseDate || "-"}</Text>
                  </Table.Td>
                  <Table.Td>
                    <RatingDisplay value={album.rating ?? 0} />
                  </Table.Td>
                  <Table.Td>
                    {album.archived ? (
                      <Badge color="red" variant="light">
                        Archived
                      </Badge>
                    ) : (
                      <Badge color="green" variant="light">
                        Active
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Tooltip label="Remove album from song">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        loading={removingId === album.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveAlbum(album.id);
                        }}
                      >
                        <IconUnlink size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </Card>

      {record?.id && (
        <>
          <AssignModal
            opened={artistModalOpened}
            onClose={closeArtistModal}
            title="Assign Artist"
            resource="my-music/artists"
            assignUrl={`/api/my-music/songs/${record.id}/artists`}
            fieldName="artistId"
            labelField="name"
            onSuccess={() => query.refetch()}
          />
          <AssignModal
            opened={albumModalOpened}
            onClose={closeAlbumModal}
            title="Assign Album"
            resource="my-music/albums"
            assignUrl={`/api/my-music/songs/${record.id}/albums`}
            fieldName="albumId"
            labelField="name"
            onSuccess={() => query.refetch()}
          />
        </>
      )}
    </Stack>
  );
};
