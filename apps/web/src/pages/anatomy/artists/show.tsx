import { useShow, useNavigation } from "@refinedev/core";
import {
  ActionIcon,
  Card,
  Group,
  Stack,
  Title,
  Text,
  Button,
  Table,
  Code,
  Loader,
  Center,
} from "@mantine/core";
import { IconArrowLeft, IconEye } from "@tabler/icons-react";
import { RatingField } from "../../../components/shared/rating-field.js";
import { ArchiveBadge } from "../../../components/shared/archive-toggle.js";
import { RatingDisplay } from "../../../components/shared/rating-field.js";

interface AnatomySong {
  id: string;
  name: string;
  isrc: string;
  releaseDate: string;
  rating: number;
  archived: boolean;
}

interface AnatomyArtistDetail {
  id: string;
  name: string;
  isni: string;
  rating: number;
  archived: boolean;
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
  songs: AnatomySong[];
}

export const AnatomyArtistShow = () => {
  const { query: showQuery } = useShow<AnatomyArtistDetail>({
    resource: "anatomy/artists",
  });
  const { list, show } = useNavigation();

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
        Artist not found.
      </Text>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Group>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => list("anatomy/artists")}
          >
            Back
          </Button>
          <Title order={2}>{record.name}</Title>
          <ArchiveBadge archived={record.archived} />
        </Group>
      </Group>

      {/* Artist details */}
      <Card withBorder>
        <Title order={4} mb="md">
          Artist Details
        </Title>
        <Table>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td fw={600} w={180}>
                ISNI
              </Table.Td>
              <Table.Td>
                <Code>{record.isni}</Code>
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Rating</Table.Td>
              <Table.Td>
                <RatingField value={record.rating} readOnly />
              </Table.Td>
            </Table.Tr>
            {record.imagePath && (
              <Table.Tr>
                <Table.Td fw={600}>Image</Table.Td>
                <Table.Td>
                  <Code>{record.imagePath}</Code>
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

      {/* Songs */}
      {record.songs && record.songs.length > 0 && (
        <Card withBorder>
          <Title order={4} mb="md">
            Songs
          </Title>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>ISRC</Table.Th>
                <Table.Th>Release Date</Table.Th>
                <Table.Th>Rating</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {record.songs.map((song) => (
                <Table.Tr key={song.id}>
                  <Table.Td>
                    <Text fw={500}>{song.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Code>{song.isrc}</Code>
                  </Table.Td>
                  <Table.Td>{song.releaseDate}</Table.Td>
                  <Table.Td>
                    <RatingDisplay value={song.rating} />
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon
                      variant="subtle"
                      onClick={() => show("anatomy/songs", song.id)}
                    >
                      <IconEye size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}
    </Stack>
  );
};
