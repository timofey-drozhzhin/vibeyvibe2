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
import { PlatformLinks } from "../../../components/shared/platform-links.js";

export const SongList = () => {
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
      { resource: "my-music/songs", values: { name: newName } },
      {
        onSuccess: (data) => {
          closeCreate(); setNewName("");
          show("my-music/songs", data.data.id!);
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
        <LoadingOverlay visible={listResult.query.isPending} />
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={50}></Table.Th>
              <SortableHeader field="name" label="Name" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <Table.Th>Artists</Table.Th>
              <SortableHeader field="releaseDate" label="Release Date" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <SortableHeader field="rating" label="Rating" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <Table.Th>Status</Table.Th>
              <SortableHeader field="createdAt" label="Added" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {songs.length === 0 && !listResult.query.isPending && (
              <Table.Tr>
                <Table.Td colSpan={8}>
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
                <Table.Td className="clickable-name" onClick={() => show("my-music/songs", song.id)}>
                  <Text fw={500}>{song.name}</Text>
                </Table.Td>
                <Table.Td>
                  {song.artists?.length > 0 ? (
                    <Group gap={0} wrap="wrap">
                      {song.artists.map((a: any, i: number) => (
                        <span key={a.id}>
                          <Text
                            component="span"
                            size="sm"
                            className="clickable-name"
                            onClick={(e: React.MouseEvent) => { e.stopPropagation(); show("my-music/artists", a.id); }}
                          >
                            {a.name}
                          </Text>
                          {i < song.artists.length - 1 && <Text component="span" size="sm" c="dimmed">,&nbsp;</Text>}
                        </span>
                      ))}
                    </Group>
                  ) : (
                    <Text size="sm" c="dimmed">-</Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{song.releaseDate || "-"}</Text>
                </Table.Td>
                <Table.Td>
                  <RatingDisplay value={song.rating ?? 0} />
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
                  <PlatformLinks spotifyId={song.spotifyId} appleMusicId={song.appleMusicId} youtubeId={song.youtubeId} />
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

      <Modal opened={createOpened} onClose={closeCreate} title="New Song">
        <Stack gap="md">
          <TextInput label="Name" required value={newName} onChange={(e) => setNewName(e.currentTarget.value)} placeholder="Song name" onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) handleCreate(); }} />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeCreate}>Cancel</Button>
            <Button onClick={handleCreate} loading={createMutation.isPending} disabled={!newName.trim()}>Create</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};
