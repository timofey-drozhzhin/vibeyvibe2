import { useState } from "react";
import { useShow, useNavigation, useUpdate } from "@refinedev/core";
import {
  Group,
  Text,
  Table,
  Badge,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconEye, IconUnlink } from "@tabler/icons-react";
import { AssignModal } from "../../../components/shared/assign-modal.js";
import { EditableField } from "../../../components/shared/editable-field.js";
import { EntityPage, SectionCard } from "../../../components/shared/entity-page.js";

const API_URL = import.meta.env.VITE_API_URL || "";

interface SunoCollectionDetail {
  id: string;
  name: string;
  description: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  prompts: Array<{
    id: string;
    style: string | null;
    voiceGender: string | null;
    rating: number | null;
  }>;
}

export const SunoCollectionShow = () => {
  const { query } = useShow<SunoCollectionDetail>({ resource: "suno/collections" });
  const { list, show } = useNavigation();
  const { mutateAsync: updateRecord } = useUpdate();

  const record = query?.data?.data;
  const isLoading = query?.isLoading ?? false;
  const prompts = record?.prompts ?? [];

  // Prompt assign modal
  const [promptModalOpened, { open: openPromptModal, close: closePromptModal }] =
    useDisclosure(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemovePrompt = async (promptId: string) => {
    if (!record) return;
    setRemovingId(promptId);
    try {
      const res = await fetch(
        `${API_URL}/api/suno/collections/${record.id}/prompts/${promptId}`,
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
        message: "Prompt removed from collection.",
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

  return (
    <EntityPage
      title={record?.name ?? ""}
      onBack={() => list("suno/collections")}
      onTitleSave={async (newName) => {
        await updateRecord({
          resource: "suno/collections",
          id: record!.id,
          values: { name: newName },
        });
        query.refetch();
      }}
      archived={record?.archived}
      onArchiveToggle={async (val) => {
        await updateRecord({
          resource: "suno/collections",
          id: record!.id,
          values: { archived: val },
        });
        query.refetch();
      }}
      isLoading={isLoading}
      notFound={!isLoading && !record}
      notFoundMessage="Collection not found."
      modals={
        record?.id ? (
          <AssignModal
            opened={promptModalOpened}
            onClose={closePromptModal}
            title="Assign Prompt"
            resource="suno/prompts"
            assignUrl={`/api/suno/collections/${record.id}/prompts`}
            fieldName="promptId"
            labelField="style"
            onSuccess={() => query.refetch()}
          />
        ) : undefined
      }
    >
      <SectionCard title="Details">
        <div>
          <Text size="sm" fw={500} c="dimmed">Description</Text>
          <EditableField
            value={record?.description ?? null}
            onSave={async (v) => {
              await updateRecord({
                resource: "suno/collections",
                id: record!.id,
                values: { description: v || null },
              });
              query.refetch();
            }}
            placeholder="Add a description..."
            emptyText="Click to add description"
          />
        </div>
        <div>
          <Text size="sm" fw={500} c="dimmed">Created</Text>
          <Text size="sm">
            {record?.createdAt ? new Date(record.createdAt).toLocaleString() : "-"}
          </Text>
        </div>
      </SectionCard>

      <SectionCard
        title="Prompts"
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
                    No prompts in this collection.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {prompts.map((prompt) => (
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
                    <Tooltip label="Remove prompt from collection">
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
    </EntityPage>
  );
};
