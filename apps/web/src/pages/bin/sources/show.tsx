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
import { IconArrowLeft, IconEdit, IconExternalLink } from "@tabler/icons-react";
import { ArchiveBadge } from "../../../components/shared/archive-toggle.js";

interface BinSource {
  id: number;
  name: string;
  url: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export const BinSourceShow = () => {
  const { list, edit } = useNavigation();

  const { query: showQuery, result } = useShow<BinSource>({ resource: "bin/sources" });
  const record = result;
  const isLoading = showQuery?.isLoading;

  if (isLoading) {
    return <Title order={3}>Loading...</Title>;
  }

  if (!record) {
    return <Title order={3}>Source not found</Title>;
  }

  return (
    <>
      <Group mb="md">
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => list("bin/sources")}
        >
          Back to list
        </Button>
      </Group>

      <Group justify="space-between" mb="md">
        <Title order={3}>{record.name}</Title>
        <Button
          variant="light"
          leftSection={<IconEdit size={16} />}
          onClick={() => edit("bin/sources", record.id)}
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
              URL
            </Text>
            {record.url ? (
              <Anchor href={record.url} target="_blank" rel="noopener">
                {record.url}{" "}
                <IconExternalLink
                  size={14}
                  style={{ verticalAlign: "middle" }}
                />
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
