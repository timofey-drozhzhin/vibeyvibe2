import { useState } from "react";
import { useShow, useNavigation } from "@refinedev/core";
import {
  Stack,
  Text,
  Table,
  Badge,
  Loader,
  Center,
  Group,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconEye, IconUnlink } from "@tabler/icons-react";
import { AssignModal } from "../../../components/shared/assign-modal.js";
import { ShowPageHeader, SectionCard } from "../../../components/shared/show-page.js";

const API_URL = import.meta.env.VITE_API_URL || "";

export const SunoGenerationShow = () => {
  const { list, show } = useNavigation();
  const { query } = useShow({ resource: "suno/generations" });
  const record = query?.data?.data;
  const isLoading = query?.isLoading ?? false;

  const prompts: any[] = record?.prompts ?? [];

  const [promptModalOpened, { open: openPromptModal, close: closePromptModal }] =
    useDisclosure(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemovePrompt = async (promptId: string) => {
    if (!record) return;
    setRemovingId(promptId);
    try {
      const res = await fetch(
        `${API_URL}/api/suno/generations/${record.id}/prompts/${promptId}`,
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
        message: "Prompt removed from generation.",
        color: "green",
      });
      query.refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to remove prompt.";
      notifications.show({ title: "Error", message, color: "red" });
    } finally {
      setRemovingId(null);
    }
  };

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
        Generation not found.
      </Text>
    );
  }

  return (
    <Stack gap="md">
      <ShowPageHeader
        title="Generation Detail"
        onBack={() => list("suno/generations")}
      />

      <SectionCard title="Details">
        <Stack gap="sm">
          <div>
            <Text size="sm" fw={500} c="dimmed">Suno ID</Text>
            <Text ff="monospace">{record.sunoId || "-"}</Text>
          </div>
          <div>
            <Text size="sm" fw={500} c="dimmed">Bin Song ID</Text>
            <Text>{record.binSongId || "-"}</Text>
          </div>
          <div>
            <Text size="sm" fw={500} c="dimmed">Created</Text>
            <Text size="sm">
              {record.createdAt ? new Date(record.createdAt).toLocaleString() : "-"}
            </Text>
          </div>
          <div>
            <Text size="sm" fw={500} c="dimmed">Updated</Text>
            <Text size="sm">
              {record.updatedAt ? new Date(record.updatedAt).toLocaleString() : "-"}
            </Text>
          </div>
        </Stack>
      </SectionCard>

      <SectionCard
        title="Linked Prompts"
        action={{ label: "Assign Prompt", onClick: openPromptModal }}
      >
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
                    <Badge variant="light" size="sm">{prompt.voiceGender}</Badge>
                  ) : (
                    <Text size="sm" c="dimmed">-</Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{prompt.rating ?? 0}/10</Text>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Tooltip label="View Prompt">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => show("suno/prompts", prompt.id)}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Remove prompt from generation">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        loading={removingId === prompt.id}
                        onClick={() => handleRemovePrompt(prompt.id)}
                      >
                        <IconUnlink size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </SectionCard>

      {record.id && (
        <AssignModal
          opened={promptModalOpened}
          onClose={closePromptModal}
          title="Assign Prompt"
          resource="suno/prompts"
          assignUrl={`/api/suno/generations/${record.id}/prompts`}
          fieldName="promptId"
          labelField="style"
          onSuccess={() => query.refetch()}
        />
      )}
    </Stack>
  );
};
