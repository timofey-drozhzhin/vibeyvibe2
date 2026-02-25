import { useState } from "react";
import { useList, useNavigation, type CrudFilter } from "@refinedev/core";
import {
  Table,
  Group,
  Button,
  Title,
  Stack,
  Pagination,
  ActionIcon,
  Tooltip,
  Text,
  LoadingOverlay,
  Badge,
} from "@mantine/core";
import { IconEye, IconEdit, IconPlus } from "@tabler/icons-react";
import { ListToolbar } from "../../../components/shared/list-toolbar.js";
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
  const { show, edit, create } = useNavigation();

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

  const listResult = useList<SunoPrompt>({
    resource: "suno/prompts",
    pagination: { currentPage: page, pageSize: 10 },
    filters,
    sorters: [{ field: "createdAt", order: "desc" }],
  });

  const prompts = listResult.result.data ?? [];
  const total = listResult.result.total ?? 0;
  const pageCount = Math.ceil(total / 10);
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
          onClick={() => create("suno/prompts")}
        >
          Create
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
      />

      <div style={{ position: "relative", minHeight: 200 }}>
        <LoadingOverlay visible={isLoading} />
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Style</Table.Th>
              <Table.Th>Voice</Table.Th>
              <Table.Th>Rating</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Actions</Table.Th>
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
                <Table.Td>
                  <Text size="sm">{truncate(prompt.style, 40)}</Text>
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
                  {!prompt.archived && (
                    <Badge color="green" variant="light">
                      Active
                    </Badge>
                  )}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Tooltip label="View">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => show("suno/prompts", prompt.id)}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Edit">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => edit("suno/prompts", prompt.id)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
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
    </Stack>
  );
};
