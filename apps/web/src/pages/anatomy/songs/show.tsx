import { useShow, useNavigation } from "@refinedev/core";
import {
  Card,
  Group,
  Stack,
  Title,
  Text,
  Badge,
  Button,
  Table,
  Loader,
  Center,
  Code,
} from "@mantine/core";
import { IconArrowLeft, IconEdit, IconPlus } from "@tabler/icons-react";
import { RatingField } from "../../../components/shared/rating-field.js";
import { ArchiveBadge } from "../../../components/shared/archive-toggle.js";

interface AnatomyArtist {
  id: string;
  name: string;
  isni: string;
  rating: number;
  archived: boolean;
}

interface AnatomyProfile {
  id: string;
  songId: string;
  value: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AnatomySongDetail {
  id: string;
  name: string;
  isrc: string;
  releaseDate: string;
  rating: number;
  archived: boolean;
  imagePath: string | null;
  spotifyId: string | null;
  appleMusicId: string | null;
  youtubeId: string | null;
  createdAt: string;
  updatedAt: string;
  activeProfile: AnatomyProfile | null;
  artists: AnatomyArtist[];
}

export const AnatomySongShow = () => {
  const { query: showQuery } = useShow<AnatomySongDetail>({
    resource: "anatomy/songs",
  });
  const { edit, list, show } = useNavigation();

  const record = showQuery?.data?.data;
  const isLoading = showQuery?.isPending;

  if (isLoading) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }

  if (!record) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        Song not found.
      </Text>
    );
  }

  // Parse active profile value
  let profileData: Record<string, string> | null = null;
  if (record.activeProfile?.value) {
    try {
      profileData = JSON.parse(record.activeProfile.value);
    } catch {
      // Invalid JSON, will show raw value
    }
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Group>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => list("anatomy/songs")}
          >
            Back
          </Button>
          <Title order={2}>{record.name}</Title>
          <ArchiveBadge archived={record.archived} />
        </Group>
        <Group>
          <Button
            variant="light"
            leftSection={<IconEdit size={16} />}
            onClick={() => edit("anatomy/songs", record.id)}
          >
            Edit
          </Button>
          <Button
            variant="light"
            leftSection={<IconPlus size={16} />}
            component="a"
            href={`/anatomy/songs/${record.id}/profiles/create`}
          >
            New Profile
          </Button>
        </Group>
      </Group>

      {/* Song details */}
      <Card withBorder>
        <Title order={4} mb="md">
          Song Details
        </Title>
        <Table>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td fw={600} w={180}>
                ISRC
              </Table.Td>
              <Table.Td>
                <Code>{record.isrc}</Code>
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Release Date</Table.Td>
              <Table.Td>{record.releaseDate}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Rating</Table.Td>
              <Table.Td>
                <RatingField value={record.rating} readOnly />
              </Table.Td>
            </Table.Tr>
            {record.spotifyId && (
              <Table.Tr>
                <Table.Td fw={600}>Spotify ID</Table.Td>
                <Table.Td>
                  <Code>{record.spotifyId}</Code>
                </Table.Td>
              </Table.Tr>
            )}
            {record.appleMusicId && (
              <Table.Tr>
                <Table.Td fw={600}>Apple Music ID</Table.Td>
                <Table.Td>
                  <Code>{record.appleMusicId}</Code>
                </Table.Td>
              </Table.Tr>
            )}
            {record.youtubeId && (
              <Table.Tr>
                <Table.Td fw={600}>YouTube ID</Table.Td>
                <Table.Td>
                  <Code>{record.youtubeId}</Code>
                </Table.Td>
              </Table.Tr>
            )}
            <Table.Tr>
              <Table.Td fw={600}>Created</Table.Td>
              <Table.Td>{record.createdAt}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Updated</Table.Td>
              <Table.Td>{record.updatedAt}</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Card>

      {/* Artists */}
      {record.artists && record.artists.length > 0 && (
        <Card withBorder>
          <Title order={4} mb="md">
            Artists
          </Title>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>ISNI</Table.Th>
                <Table.Th>Rating</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {record.artists.map((artist) => (
                <Table.Tr
                  key={artist.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => show("anatomy/artists", artist.id)}
                >
                  <Table.Td>
                    <Text fw={500}>{artist.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Code>{artist.isni}</Code>
                  </Table.Td>
                  <Table.Td>
                    <RatingField value={artist.rating} readOnly size={16} />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      {/* Active Profile */}
      <Card withBorder>
        <Title order={4} mb="md">
          Active Profile
        </Title>
        {record.activeProfile === null ? (
          <Text c="dimmed">No active profile. Create one to define song attributes.</Text>
        ) : profileData ? (
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Attribute</Table.Th>
                <Table.Th>Value</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {Object.entries(profileData).map(([key, value]) => (
                <Table.Tr key={key}>
                  <Table.Td fw={600}>{key}</Table.Td>
                  <Table.Td>
                    <Text size="sm">{String(value)}</Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Stack gap="xs">
            <Text c="dimmed" size="sm">
              Raw profile value (invalid JSON):
            </Text>
            <Code block>{record.activeProfile.value}</Code>
          </Stack>
        )}
        {record.activeProfile && (
          <Text size="xs" c="dimmed" mt="sm">
            Profile created: {record.activeProfile.createdAt}
          </Text>
        )}
      </Card>
    </Stack>
  );
};
