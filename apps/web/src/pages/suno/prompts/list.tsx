import { useState } from "react";
import { useList, useNavigation, useCreate, type CrudFilter } from "@refinedev/core";
import {
  Table,
  Group,
  Button,
  Title,
  Stack,
  Pagination,
  Text,
  LoadingOverlay,
  Badge,
  Select,
  Modal,
  Textarea,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";
import { ListToolbar } from "../../../components/shared/list-toolbar.js";
import { SortableHeader } from "../../../components/shared/sortable-header.js";
import { RatingDisplay } from "../../../components/shared/rating-field.js";
import { ArchiveBadge } from "../../../components/shared/archive-toggle.js";

interface SunoPrompt {
  id: number;
  lyrics: string | null;
  style: string | null;
  voiceGender: "male" | "female" | "neutral" | null;
  notes: string | null;
  profileId: string | null;
  rating: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export const SunoPromptList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [archiveFilter, setArchiveFilter] = useState("active");
  const [voiceGenderFilter, setVoiceGenderFilter] = useState<string | null>(null);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { show } = useNavigation();
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [newLyrics, setNewLyrics] = useState("");
  const createMutation = useCreate();
  const { mutateAsync: createRecord } = createMutation;
  const creating = createMutation.mutation.isPending;

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleCreate = async () => {
    const result = await createRecord({ resource: "suno/prompts", values: { lyrics: newLyrics || null } });
    closeCreate(); setNewLyrics("");
    show("suno/prompts", (result as any).data.id);
  };

  const archivedValue =
    archiveFilter === "archived"
      ? true
      : archiveFilter === "active"
        ? false
        : undefined;

  const filters: CrudFilter[] = [
    { field: "search", operator: "contains", value: search || undefined },
    { field: "archived", operator: "eq", value: archivedValue },
  ];
  if (voiceGenderFilter) {
    filters.push({ field: "voiceGender", operator: "eq", value: voiceGenderFilter });
  }

  const listResult = useList<SunoPrompt>({
    resource: "suno/prompts",
    pagination: { currentPage: page, pageSize: 20 },
    filters,
    sorters: [{ field: sortField, order: sortOrder }],
  });

  const prompts = listResult.result.data ?? [];
  const total = listResult.result.total ?? 0;
  const pageCount = Math.ceil(total / 20);
  const isLoading = listResult.query.isPending;

  const truncate = (text: string | null | undefined, max: number) => {
    if (!text) return "-";
    return text.length > max ? text.slice(0, max) + "..." : text;
  };

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Prompts</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={openCreate}
        >
          New
        </Button>
      </Group>

      <ListToolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        archiveFilter={archiveFilter}
        onArchiveFilterChange={(value) => {
          setArchiveFilter(value);
          setPage(1);
        }}
      >
        <Select
          placeholder="Voice Gender"
          data={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
            { value: "neutral", label: "Neutral" },
          ]}
          value={voiceGenderFilter}
          onChange={(v) => {
            setVoiceGenderFilter(v);
            setPage(1);
          }}
          clearable
          size="sm"
          style={{ minWidth: 140 }}
        />
      </ListToolbar>

      <div style={{ position: "relative", minHeight: 200 }}>
        <LoadingOverlay visible={isLoading} />
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <SortableHeader field="style" label="Style" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <Table.Th>Voice</Table.Th>
              <SortableHeader field="rating" label="Rating" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <Table.Th>Status</Table.Th>
              <SortableHeader field="createdAt" label="Added" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {prompts.length === 0 && !isLoading && (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text c="dimmed" ta="center" py="md">
                    No prompts found.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {prompts.map((prompt) => (
              <Table.Tr key={prompt.id}>
                <Table.Td className="clickable-name" onClick={() => show("suno/prompts", prompt.id)}>
                  <Text fw={500} size="sm">{truncate(prompt.style, 40)}</Text>
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
                  <RatingDisplay value={prompt.rating ?? 0} />
                </Table.Td>
                <Table.Td>
                  <ArchiveBadge archived={prompt.archived} />
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {prompt.createdAt
                      ? new Date(prompt.createdAt).toLocaleDateString()
                      : "-"}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </div>

      {pageCount > 1 && (
        <Group justify="center" mt="md">
          <Pagination value={page} onChange={setPage} total={pageCount} />
        </Group>
      )}

      <Modal opened={createOpened} onClose={closeCreate} title="New Prompt">
        <Stack gap="md">
          <Textarea label="Lyrics" value={newLyrics} onChange={(e) => setNewLyrics(e.currentTarget.value)} placeholder="Enter lyrics..." minRows={4} />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeCreate}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating}>Create</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};
