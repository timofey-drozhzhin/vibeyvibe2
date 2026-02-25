import { useState } from "react";
import { useList, useNavigation } from "@refinedev/core";
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
  Avatar,
} from "@mantine/core";
import { IconEye, IconEdit, IconPlus } from "@tabler/icons-react";
import { ListToolbar } from "../../../components/shared/list-toolbar.js";
import { SortableHeader } from "../../../components/shared/sortable-header.js";
import { RatingDisplay } from "../../../components/shared/rating-field.js";
import { ArchiveBadge } from "../../../components/shared/archive-toggle.js";

export const SongList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [archiveFilter, setArchiveFilter] = useState("active");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { show, edit, create } = useNavigation();

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

  const listResult = useList({
    resource: "my-music/songs",
    pagination: { currentPage: page, pageSize: 20 },
    filters: [
      { field: "search", operator: "contains", value: search },
      { field: "archived", operator: "eq", value: archivedValue },
    ],
    sorters: [{ field: sortField, order: sortOrder }],
  });

  const songs = listResult.result.data ?? [];
  const total = listResult.result.total ?? 0;
  const pageCount = Math.ceil(total / 20);

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Songs</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => create("my-music/songs")}
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
        <LoadingOverlay visible={listResult.query.isPending} />
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={50}></Table.Th>
              <SortableHeader field="name" label="Name" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <Table.Th>ISRC</Table.Th>
              <SortableHeader field="releaseDate" label="Release Date" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <SortableHeader field="rating" label="Rating" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <Table.Th>Status</Table.Th>
              <SortableHeader field="createdAt" label="Created" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {songs.length === 0 && !listResult.query.isPending && (
              <Table.Tr>
                <Table.Td colSpan={7}>
                  <Text c="dimmed" ta="center" py="md">
                    No songs found.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {songs.map((song: any) => (
              <Table.Tr key={song.id}>
                <Table.Td>
                  <Avatar size={32} radius="sm" src={song.imagePath ? `/api/storage/${song.imagePath}` : null} />
                </Table.Td>
                <Table.Td>{song.name}</Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {song.isrc || "-"}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{song.releaseDate || "-"}</Text>
                </Table.Td>
                <Table.Td>
                  <RatingDisplay value={song.rating ?? 0} />
                </Table.Td>
                <Table.Td>
                  <ArchiveBadge archived={song.archived} />
                  {!song.archived && (
                    <Badge color="green" variant="light">
                      Active
                    </Badge>
                  )}
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
                    <Tooltip label="View">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => show("my-music/songs", song.id)}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Edit">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => edit("my-music/songs", song.id)}
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
