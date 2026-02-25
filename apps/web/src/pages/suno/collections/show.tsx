import { useShow, useNavigation } from "@refinedev/core";
import {
  Card,
  Button,
  Group,
  Stack,
  Title,
  Text,
  Table,
  Badge,
  LoadingOverlay,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { IconArrowLeft, IconEdit, IconEye } from "@tabler/icons-react";

export const SunoCollectionShow = () => {
  const { list, edit, show } = useNavigation();
  const { query } = useShow({ resource: "suno/collections" });
  const record = query?.data?.data;
  const isLoading = query?.isLoading ?? false;

  const prompts: any[] = record?.prompts ?? [];

  return (
    <Stack>
      <Group justify="space-between">
        <Group>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => list("suno/collections")}
          >
            Back
          </Button>
          <Title order={3}>Collection Detail</Title>
        </Group>
        {record && (
          <Button
            leftSection={<IconEdit size={16} />}
            variant="default"
            onClick={() => record.id && edit("suno/collections", record.id)}
          >
            Edit
          </Button>
        )}
      </Group>

      <Card withBorder padding="lg" style={{ position: "relative" }}>
        <LoadingOverlay visible={isLoading} />
        {record && (
          <Stack gap="md">
            <div>
              <Text size="sm" fw={500} c="dimmed">
                Name
              </Text>
              <Text fw={500}>{record.name}</Text>
            </div>

            <div>
              <Text size="sm" fw={500} c="dimmed">
                Description
              </Text>
              <Text>{record.description || "-"}</Text>
            </div>

            <div>
              <Text size="sm" fw={500} c="dimmed">
                Created
              </Text>
              <Text size="sm">
                {record.createdAt
                  ? new Date(record.createdAt).toLocaleString()
                  : "-"}
              </Text>
            </div>
          </Stack>
        )}
      </Card>

      <Card withBorder padding="lg">
        <Stack gap="md">
          <Title order={5}>Prompts in this Collection</Title>

          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Style</Table.Th>
                <Table.Th>Voice</Table.Th>
                <Table.Th>Rating</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {prompts.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={4}>
                    <Text c="dimmed" ta="center" py="md">
                      No prompts in this collection.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
              {prompts.map((prompt: any) => (
                <Table.Tr key={prompt.id}>
                  <Table.Td>
                    <Text size="sm">
                      {prompt.style
                        ? prompt.style.length > 40
                          ? prompt.style.slice(0, 40) + "..."
                          : prompt.style
                        : "-"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {prompt.voiceGender ? (
                      <Badge variant="light" size="sm">
                        {prompt.voiceGender}
                      </Badge>
                    ) : (
                      <Text size="sm" c="dimmed">
                        -
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{prompt.rating ?? 0}/10</Text>
                  </Table.Td>
                  <Table.Td>
                    <Tooltip label="View Prompt">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => show("suno/prompts", prompt.id)}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </Card>
    </Stack>
  );
};
