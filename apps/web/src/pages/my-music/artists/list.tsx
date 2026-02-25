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
  Avatar,
} from "@mantine/core";
import { IconEdit, IconPlus } from "@tabler/icons-react";
import { ListToolbar } from "../../../components/shared/list-toolbar.js";
import { SortableHeader } from "../../../components/shared/sortable-header.js";
import { RatingDisplay } from "../../../components/shared/rating-field.js";
import { ArchiveBadge } from "../../../components/shared/archive-toggle.js";

export const ArtistList = () => {
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
    resource: "my-music/artists",
    pagination: { currentPage: page, pageSize: 20 },
    filters: [
      { field: "search", operator: "contains", value: search },
      { field: "archived", operator: "eq", value: archivedValue },
    ],
    sorters: [{ field: sortField, order: sortOrder }],
  });

  const loading = listResult.query.isPending;
  const artists = listResult.result.data ?? [];
  const total = listResult.result.total ?? 0;
  const pageCount = Math.ceil(total / 20);

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Artists</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => create("my-music/artists")}
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
        <LoadingOverlay visible={loading} />
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={50}></Table.Th>
              <SortableHeader field="name" label="Name" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <Table.Th>Releases</Table.Th>
              <SortableHeader field="rating" label="Rating" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <Table.Th>Status</Table.Th>
              <SortableHeader field="createdAt" label="Added" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {artists.length === 0 && !loading && (
              <Table.Tr>
                <Table.Td colSpan={7}>
                  <Text c="dimmed" ta="center" py="md">
                    No artists found.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {artists.map((artist: any) => (
              <Table.Tr key={artist.id}>
                <Table.Td>
                  <Avatar size={32} radius="sm" src={artist.imagePath ? `/api/storage/${artist.imagePath}` : null} />
                </Table.Td>
                <Table.Td className="clickable-name" onClick={() => show("my-music/artists", artist.id)}>
                  <Text fw={500}>{artist.name}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">{artist.songCount || 0}</Text>
                </Table.Td>
                <Table.Td>
                  <RatingDisplay value={artist.rating ?? 0} />
                </Table.Td>
                <Table.Td>
                  <ArchiveBadge archived={artist.archived} />
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {artist.createdAt
                      ? new Date(artist.createdAt).toLocaleDateString()
                      : "-"}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Tooltip label="Edit">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => edit("my-music/artists", artist.id)}
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
