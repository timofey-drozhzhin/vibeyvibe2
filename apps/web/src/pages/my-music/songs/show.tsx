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
} from "@mantine/core";
import { IconArrowLeft, IconEdit } from "@tabler/icons-react";
import { RatingDisplay } from "../../../components/shared/rating-field.js";
import { ArchiveBadge } from "../../../components/shared/archive-toggle.js";

export const SongShow = () => {
  const { list, edit, show: showNav } = useNavigation();
  const { query, result } = useShow({
    resource: "my-music/songs",
  });

  const record = result;

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
                <Text size="xs" c="dimmed">
                  Image Path
                </Text>
                <Text size="sm">{record.imagePath}</Text>
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

      {record?.artists && record.artists.length > 0 && (
        <Card withBorder p="lg">
          <Stack>
            <Title order={5}>Artists</Title>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>ISNI</Table.Th>
                  <Table.Th>Rating</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {record.artists.map((artist: any) => (
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
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Stack>
        </Card>
      )}

      {record?.albums && record.albums.length > 0 && (
        <Card withBorder p="lg">
          <Stack>
            <Title order={5}>Albums</Title>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>EAN</Table.Th>
                  <Table.Th>Release Date</Table.Th>
                  <Table.Th>Rating</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {record.albums.map((album: any) => (
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
