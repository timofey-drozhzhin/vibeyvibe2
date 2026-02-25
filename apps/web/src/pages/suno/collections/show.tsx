import { useState, useEffect } from "react";
import { useShow, useNavigation, useUpdate } from "@refinedev/core";
import {
  Group,
  Stack,
  Text,
  Table,
  Badge,
  Loader,
  Center,
  ActionIcon,
  Tooltip,
  Modal,
  TextInput,
  Textarea,
  Button,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useSearchParams } from "react-router";
import { notifications } from "@mantine/notifications";
import { IconEye, IconUnlink } from "@tabler/icons-react";
import { ArchiveBadge, ArchiveButton } from "../../../components/shared/archive-toggle.js";
import { AssignModal } from "../../../components/shared/assign-modal.js";
import { ShowPageHeader, SectionCard } from "../../../components/shared/show-page.js";

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

  const record = query?.data?.data;
  const isLoading = query?.isLoading ?? false;
  const prompts = record?.prompts ?? [];

  // Edit modal
  const [searchParams, setSearchParams] = useSearchParams();
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] =
    useDisclosure(false);

  useEffect(() => {
    if (searchParams.get("edit") === "true" && record) {
      openEditModal();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, record]);

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
        Collection not found.
      </Text>
    );
  }

  return (
    <Stack gap="md">
      <ShowPageHeader
        title={record.name}
        onBack={() => list("suno/collections")}
        onEdit={openEditModal}
        badges={<ArchiveBadge archived={record.archived} />}
      />

      <SectionCard title="Details">
        <Stack gap="sm">
          <div>
            <Text size="sm" fw={500} c="dimmed">Description</Text>
            <Text>{record.description || "-"}</Text>
          </div>
          <div>
            <Text size="sm" fw={500} c="dimmed">Created</Text>
            <Text size="sm">
              {record.createdAt ? new Date(record.createdAt).toLocaleString() : "-"}
            </Text>
          </div>
        </Stack>
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

      {/* Edit Modal */}
      <EditModal
        opened={editModalOpened}
        onClose={closeEditModal}
        record={record}
        onSaved={() => { closeEditModal(); query.refetch(); }}
      />

      {/* Assign Prompt Modal */}
      {record.id && (
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
      )}
    </Stack>
  );
};

// Edit Modal - name, description, archive
const EditModal = ({
  opened,
  onClose,
  record,
  onSaved,
}: {
  opened: boolean;
  onClose: () => void;
  record: SunoCollectionDetail;
  onSaved: () => void;
}) => {
  const [name, setName] = useState(record.name);
  const [description, setDescription] = useState(record.description ?? "");
  const { mutateAsync: updateRecord, mutation } = useUpdate();

  useEffect(() => {
    if (opened) {
      setName(record.name);
      setDescription(record.description ?? "");
    }
  }, [opened, record]);

  const handleSubmit = async () => {
    await updateRecord({
      resource: "suno/collections",
      id: record.id,
      values: { name, description: description || null },
    });
    onSaved();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Collection">
      <Stack gap="md">
        <TextInput
          label="Name"
          required
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Collection name"
        />
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          placeholder="Collection description"
          minRows={3}
          autosize
        />
        <Group justify="space-between" mt="md">
          <ArchiveButton
            archived={record.archived}
            onToggle={async (val) => {
              await updateRecord({
                resource: "suno/collections",
                id: record.id,
                values: { archived: val },
              });
              onSaved();
            }}
          />
          <Group>
            <Button onClick={handleSubmit} loading={mutation.isPending} disabled={!name.trim()}>
              Save
            </Button>
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
};
