import { useState } from "react";
import { useList, useNavigation, useCreate } from "@refinedev/core";
import {
  Table,
  Group,
  Button,
  Title,
  Stack,
  Pagination,
  Text,
  LoadingOverlay,
  Avatar,
  Modal,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";
import { ListToolbar } from "../../../components/shared/list-toolbar.js";
import { SortableHeader } from "../../../components/shared/sortable-header.js";
import { RatingDisplay } from "../../../components/shared/rating-field.js";
import { ArchiveBadge } from "../../../components/shared/archive-toggle.js";

export const AlbumList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [archiveFilter, setArchiveFilter] = useState("active");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { show } = useNavigation();
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [newName, setNewName] = useState("");
  const { mutate: createRecord, mutation: createMutation } = useCreate();

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleCreate = () => {
    createRecord(
      { resource: "my-music/albums", values: { name: newName } },
      {
        onSuccess: (data) => {
          closeCreate(); setNewName("");
          show("my-music/albums", data.data.id!);
        },
      },
    );
  };

  const archivedValue =
    archiveFilter === "archived"
      ? true
      : archiveFilter === "active"
        ? false
        : undefined;

  const listResult = useList({
    resource: "my-music/albums",
    pagination: { currentPage: page, pageSize: 20 },
    filters: [
      { field: "search", operator: "contains", value: search },
      { field: "archived", operator: "eq", value: archivedValue },
    ],
    sorters: [{ field: sortField, order: sortOrder }],
  });

  const loading = listResult.query.isPending;
  const albums = listResult.result.data ?? [];
  const total = listResult.result.total ?? 0;
  const pageCount = Math.ceil(total / 20);

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Albums</Title>
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
      />

      <div style={{ position: "relative", minHeight: 200 }}>
        <LoadingOverlay visible={loading} />
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={50}></Table.Th>
              <SortableHeader field="name" label="Name" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <Table.Th>EAN</Table.Th>
              <SortableHeader field="releaseDate" label="Release Date" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <SortableHeader field="rating" label="Rating" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <Table.Th>Status</Table.Th>
              <SortableHeader field="createdAt" label="Added" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {albums.length === 0 && !loading && (
              <Table.Tr>
                <Table.Td colSpan={7}>
                  <Text c="dimmed" ta="center" py="md">
                    No albums found.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {albums.map((album: any) => (
              <Table.Tr key={album.id}>
                <Table.Td>
                  <Avatar size={32} radius="sm" src={album.imagePath ? `/api/storage/${album.imagePath}` : null} />
                </Table.Td>
                <Table.Td className="clickable-name" onClick={() => show("my-music/albums", album.id)}>
                  <Text fw={500}>{album.name}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {album.ean || "-"}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{album.releaseDate || "-"}</Text>
                </Table.Td>
                <Table.Td>
                  <RatingDisplay value={album.rating ?? 0} />
                </Table.Td>
                <Table.Td>
                  <ArchiveBadge archived={album.archived} />
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {album.createdAt
                      ? new Date(album.createdAt).toLocaleDateString()
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

      <Modal opened={createOpened} onClose={closeCreate} title="New Album">
        <Stack gap="md">
          <TextInput label="Name" required value={newName} onChange={(e) => setNewName(e.currentTarget.value)} placeholder="Album name" onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) handleCreate(); }} />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeCreate}>Cancel</Button>
            <Button onClick={handleCreate} loading={createMutation.isPending} disabled={!newName.trim()}>Create</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};
