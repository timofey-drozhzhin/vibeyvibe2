import { useState } from "react";
import { useList, useNavigation, type CrudFilter } from "@refinedev/core";
import {
  Table,
  Group,
  Title,
  Stack,
  Pagination,
  ActionIcon,
  Tooltip,
  Text,
  LoadingOverlay,
} from "@mantine/core";
import { IconEye } from "@tabler/icons-react";
import { ListToolbar } from "../../../components/shared/list-toolbar.js";
import { SortableHeader } from "../../../components/shared/sortable-header.js";

export const SunoGenerationList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [archiveFilter, setArchiveFilter] = useState("active");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { show } = useNavigation();

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const archivedValue =
    archiveFilter === "archived"
      ? true
      : archiveFilter === "active"
        ? false
        : undefined;

  const filters: CrudFilter[] = [];
  if (search) {
    filters.push({ field: "search", operator: "contains", value: search });
  }
  if (archivedValue !== undefined) {
    filters.push({ field: "archived", operator: "eq", value: archivedValue });
  }

  const { query: listQuery, result } = useList({
    resource: "suno/generations",
    pagination: { currentPage: page, pageSize: 20 },
    filters,
    sorters: [{ field: sortField, order: sortOrder }],
  });

  const generations = result.data ?? [];
  const total = result.total ?? 0;
  const pageCount = Math.ceil(total / 20);

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Generations</Title>
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
        <LoadingOverlay visible={listQuery.isPending} />
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Suno ID</Table.Th>
              <Table.Th>Bin Song</Table.Th>
              <SortableHeader field="createdAt" label="Created" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {generations.length === 0 && !listQuery.isPending && (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text c="dimmed" ta="center" py="md">
                    No generations found.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {generations.map((generation: any) => (
              <Table.Tr key={generation.id}>
                <Table.Td>
                  <Text size="sm" ff="monospace">
                    {generation.sunoId || "-"}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c={generation.binSongId ? undefined : "dimmed"}>
                    {generation.binSongId || "-"}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {generation.createdAt
                      ? new Date(generation.createdAt).toLocaleDateString()
                      : "-"}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Tooltip label="View">
                    <ActionIcon
                      variant="subtle"
                      onClick={() => show("suno/generations", generation.id)}
                    >
                      <IconEye size={16} />
                    </ActionIcon>
                  </Tooltip>
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
