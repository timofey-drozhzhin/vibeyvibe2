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
import { IconArrowLeft, IconEye } from "@tabler/icons-react";

export const SunoGenerationShow = () => {
  const { list, show } = useNavigation();
  const { query } = useShow({ resource: "suno/generations" });
  const record = query?.data?.data;
  const isLoading = query?.isLoading ?? false;

  const prompts: any[] = record?.prompts ?? [];

  return (
    <Stack>
      <Group>
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => list("suno/generations")}
        >
          Back
        </Button>
        <Title order={3}>Generation Detail</Title>
      </Group>

      <Card withBorder padding="lg" style={{ position: "relative" }}>
        <LoadingOverlay visible={isLoading} />
        {record && (
          <Stack gap="md">
            <div>
              <Text size="sm" fw={500} c="dimmed">
                Suno ID
              </Text>
              <Text ff="monospace">{record.sunoId || "-"}</Text>
            </div>

            <div>
              <Text size="sm" fw={500} c="dimmed">
                Bin Song ID
              </Text>
              <Text>{record.binSongId || "-"}</Text>
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

            <div>
              <Text size="sm" fw={500} c="dimmed">
                Updated
              </Text>
              <Text size="sm">
                {record.updatedAt
                  ? new Date(record.updatedAt).toLocaleString()
                  : "-"}
              </Text>
            </div>
          </Stack>
        )}
      </Card>

      <Card withBorder padding="lg">
        <Stack gap="md">
          <Title order={5}>Linked Prompts</Title>

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
                      No prompts linked to this generation.
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
