import { useState } from "react";
import type { CrudFilter } from "@refinedev/core";
import { useList, useNavigation } from "@refinedev/core";
import {
  Table,
  Card,
  Group,
  Title,
  Text,
  ActionIcon,
  Pagination,
  Button,
  Badge,
  Select,
} from "@mantine/core";
import { IconEdit, IconPlus, IconMusic } from "@tabler/icons-react";
import { ListToolbar } from "../../../components/shared/list-toolbar.js";
import { SortableHeader } from "../../../components/shared/sortable-header.js";
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

interface BinSource {
  id: string;
  name: string;
}

export const BinSongList = () => {
  const { show, edit, create } = useNavigation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [archiveFilter, setArchiveFilter] = useState("active");
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Fetch sources for the filter dropdown
  const { result: sourcesResult } = useList<BinSource>({
    resource: "bin/sources",
    pagination: { pageSize: 100 },
  });
  const sources = sourcesResult.data ?? [];
  const sourceOptions = sources.map((s: BinSource) => ({ value: s.id, label: s.name }));

  const filters: CrudFilter[] = [];
  if (search) {
    filters.push({ field: "search", operator: "contains", value: search });
  }
  if (archiveFilter === "active") {
    filters.push({ field: "archived", operator: "eq", value: false });
  } else if (archiveFilter === "archived") {
    filters.push({ field: "archived", operator: "eq", value: true });
  }
  if (sourceFilter) {
    filters.push({ field: "sourceId", operator: "eq", value: sourceFilter });
  }

  const { query: listQuery, result } = useList<BinSong>({
    resource: "bin/songs",
    pagination: { currentPage: page, pageSize: 20 },
    filters,
    sorters: [{ field: sortField, order: sortOrder }],
  });

  const records = result.data ?? [];
  const total = result.total ?? 0;
  const pageCount = Math.ceil(total / 20);

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={3}>Bin Songs</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => create("bin/songs")}
        >
          Add Song
        </Button>
      </Group>

      <ListToolbar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        archiveFilter={archiveFilter}
        onArchiveFilterChange={(v) => {
          setArchiveFilter(v);
          setPage(1);
        }}
      >
        <Select
          placeholder="Source"
          data={sourceOptions}
          value={sourceFilter}
          onChange={(v) => {
            setSourceFilter(v);
            setPage(1);
          }}
          clearable
          size="sm"
          style={{ minWidth: 160 }}
        />
      </ListToolbar>

      <Card withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <SortableHeader field="name" label="Name" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <Table.Th>Source</Table.Th>
              <Table.Th>Asset</Table.Th>
              <Table.Th>Status</Table.Th>
              <SortableHeader field="createdAt" label="Created" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <Table.Th style={{ width: 100 }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {listQuery.isPending ? (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text ta="center" c="dimmed" py="md">
                    Loading...
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : records.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text ta="center" c="dimmed" py="md">
                    No songs found
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              records.map((song: BinSong) => (
                <Table.Tr key={song.id}>
                  <Table.Td style={{ cursor: "pointer" }} onClick={() => show("bin/songs", song.id)}>
                    <Text fw={500}>{song.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    {song.source?.name ? (
                      <Text size="sm">{song.source.name}</Text>
                    ) : (
                      <Text size="sm" c="dimmed">
                        --
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {song.assetPath ? (
                      <Badge
                        variant="light"
                        color="green"
                        leftSection={<IconMusic size={12} />}
                      >
                        Audio
                      </Badge>
                    ) : (
                      <Text size="sm" c="dimmed">
                        --
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <ArchiveBadge archived={song.archived} />
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {song.createdAt
                        ? new Date(song.createdAt).toLocaleDateString()
                        : "-"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => edit("bin/songs", song.id)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>

        {pageCount > 1 && (
          <Group justify="center" mt="md">
            <Pagination value={page} onChange={setPage} total={pageCount} />
          </Group>
        )}
      </Card>
    </>
  );
};
