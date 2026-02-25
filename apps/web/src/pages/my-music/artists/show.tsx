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

export const ArtistShow = () => {
  const { list, edit, show: showNav } = useNavigation();
  const { query, result } = useShow({
    resource: "my-music/artists",
  });

  const isLoading = query.isLoading;
  const record = result;

  return (
    <Stack>
      <Group justify="space-between">
        <Group>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => list("my-music/artists")}
          >
            Back
          </Button>
          <Title order={3}>Artist Details</Title>
        </Group>
        {record?.id && (
          <Button
            leftSection={<IconEdit size={16} />}
            variant="outline"
            onClick={() => edit("my-music/artists", record.id!)}
          >
            Edit
          </Button>
        )}
      </Group>

      <Card withBorder p="lg" pos="relative">
        <LoadingOverlay visible={isLoading} />
        {record && (
          <Stack gap="sm">
            <Group>
              <Title order={4}>{record.name}</Title>
              <ArchiveBadge archived={record.archived} />
            </Group>

            <Group gap="xl">
              <div>
                <Text size="xs" c="dimmed">
                  ISNI
                </Text>
                <Text size="sm">{record.isni || "-"}</Text>
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
              {record.youtubeUsername && (
                <div>
                  <Text size="xs" c="dimmed">
                    YouTube
                  </Text>
                  <Text size="sm">{record.youtubeUsername}</Text>
                </div>
              )}
              {record.tiktokUsername && (
                <div>
                  <Text size="xs" c="dimmed">
                    TikTok
                  </Text>
                  <Text size="sm">{record.tiktokUsername}</Text>
                </div>
              )}
              {record.instagramUsername && (
                <div>
                  <Text size="xs" c="dimmed">
                    Instagram
                  </Text>
                  <Text size="sm">{record.instagramUsername}</Text>
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

      {record?.songs && record.songs.length > 0 && (
        <Card withBorder p="lg">
          <Stack>
            <Title order={5}>Songs</Title>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>ISRC</Table.Th>
                  <Table.Th>Release Date</Table.Th>
                  <Table.Th>Rating</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {record.songs.map((song: any) => (
                  <Table.Tr
                    key={song.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => showNav("my-music/songs", song.id)}
                  >
                    <Table.Td>{song.name}</Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {song.isrc || "-"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{song.releaseDate || "-"}</Text>
                    </Table.Td>
                    <Table.Td>
                      <RatingDisplay value={song.rating ?? 0} />
                    </Table.Td>
                    <Table.Td>
                      {song.archived ? (
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
