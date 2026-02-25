import { useShow, useNavigation } from "@refinedev/core";
import {
  Card,
  Group,
  Stack,
  Title,
  Text,
  Button,
  Anchor,
  Badge,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconEdit,
  IconMusic,
  IconExternalLink,
} from "@tabler/icons-react";
import { ArchiveBadge } from "../../../components/shared/archive-toggle.js";

interface BinSong {
  id: number;
  name: string;
  sourceId: number | null;
  assetPath: string | null;
  sourceUrl: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  source?: { id: number; name: string } | null;
}

export const BinSongShow = () => {
  const { list, edit } = useNavigation();

  const { query: showQuery, result } = useShow<BinSong>({ resource: "bin/songs" });
  const record = result;
  const isLoading = showQuery?.isLoading;

  if (isLoading) {
    return <Title order={3}>Loading...</Title>;
  }

  if (!record) {
    return <Title order={3}>Song not found</Title>;
  }

  return (
    <>
      <Group mb="md">
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => list("bin/songs")}
        >
          Back to list
        </Button>
      </Group>

      <Group justify="space-between" mb="md">
        <Title order={3}>{record.name}</Title>
        <Button
          variant="light"
          leftSection={<IconEdit size={16} />}
          onClick={() => edit("bin/songs", record.id)}
        >
          Edit
        </Button>
      </Group>

      <Card withBorder maw={600}>
        <Stack gap="md">
          <div>
            <Text size="sm" c="dimmed">
              Name
            </Text>
            <Text fw={500}>{record.name}</Text>
          </div>

          <div>
            <Text size="sm" c="dimmed">
              Source
            </Text>
            {record.source?.name ? (
              <Text>{record.source.name}</Text>
            ) : (
              <Text c="dimmed">None</Text>
            )}
          </div>

          <div>
            <Text size="sm" c="dimmed">
              Asset Path
            </Text>
            {record.assetPath ? (
              <Text>{record.assetPath}</Text>
            ) : (
              <Text c="dimmed">None</Text>
            )}
          </div>

          {record.assetPath && (
            <div>
              <Text size="sm" c="dimmed" mb="xs">
                Audio Player
              </Text>
              <audio controls src={record.assetPath} style={{ width: "100%" }}>
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          <div>
            <Text size="sm" c="dimmed">
              Source URL
            </Text>
            {record.sourceUrl ? (
              <Anchor href={record.sourceUrl} target="_blank" rel="noopener">
                {record.sourceUrl} <IconExternalLink size={14} style={{ verticalAlign: "middle" }} />
              </Anchor>
            ) : (
              <Text c="dimmed">None</Text>
            )}
          </div>

          <div>
            <Text size="sm" c="dimmed">
              Status
            </Text>
            <Group gap="xs" mt={4}>
              <ArchiveBadge archived={record.archived} />
              {!record.archived && (
                <Badge variant="light" color="green">
                  Active
                </Badge>
              )}
            </Group>
          </div>

          <div>
            <Text size="sm" c="dimmed">
              Created
            </Text>
            <Text>{new Date(record.createdAt).toLocaleString()}</Text>
          </div>

          <div>
            <Text size="sm" c="dimmed">
              Updated
            </Text>
            <Text>{new Date(record.updatedAt).toLocaleString()}</Text>
          </div>
        </Stack>
      </Card>
    </>
  );
};
