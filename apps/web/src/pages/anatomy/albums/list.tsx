import { useState } from "react";
import { useList, useNavigation, useCreate } from "@refinedev/core";
import {
  Table,
  Group,
  Text,
  Title,
  Button,
  Pagination,
  Card,
  Loader,
  Center,
  Modal,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";
import { ListToolbar } from "../../../components/shared/list-toolbar.js";
import { SortableHeader } from "../../../components/shared/sortable-header.js";
import { RatingDisplay } from "../../../components/shared/rating-field.js";
import { ArchiveBadge } from "../../../components/shared/archive-toggle.js";

interface AnatomyAlbum {
  id: string;
  name: string;
  ean: string | null;
  releaseDate: string | null;
  rating: number;
  archived: boolean;
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
}

export const AnatomyAlbumList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [archiveFilter, setArchiveFilter] = useState("active");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { show } = useNavigation();
  const { mutate: createRecord } = useCreate();

  const [opened, { open, close }] = useDisclosure(false);
  const [newName, setNewName] = useState("");

  const handleCreate = () => {
    createRecord(
      {
        resource: "anatomy/albums",
        values: { name: newName },
      },
      {
        onSuccess: (data) => {
          close();
          setNewName("");
          if (data?.data?.id) {
            show("anatomy/albums", data.data.id);
          }
        },
      },
    );
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const archivedValue =
    archiveFilter === "active" ? false : archiveFilter === "archived" ? true : undefined;

  const { query: listQuery, result } = useList<AnatomyAlbum>({
    resource: "anatomy/albums",
    pagination: { currentPage: page, pageSize: 20 },
    filters: [
      { field: "search", operator: "contains", value: search || undefined },
      ...(archivedValue !== undefined
        ? [{ field: "archived" as const, operator: "eq" as const, value: archivedValue }]
        : []),
    ],
    sorters: [{ field: sortField, order: sortOrder }],
  });

  const records = result.data ?? [];
  const total = result.total ?? 0;
  const pageCount = Math.ceil(total / 20);

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={2}>Anatomy Albums</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={open}
        >
          New
        </Button>
      </Group>

      <ListToolbar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        archiveFilter={archiveFilter}
        onArchiveFilterChange={(val) => {
          setArchiveFilter(val);
          setPage(1);
        }}
      />

      <Card withBorder>
        {listQuery.isPending ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : records.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            No albums found.
          </Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <SortableHeader field="name" label="Name" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <Table.Th>EAN</Table.Th>
                <SortableHeader field="releaseDate" label="Release Date" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <SortableHeader field="rating" label="Rating" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <Table.Th>Status</Table.Th>
                <SortableHeader field="createdAt" label="Added" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {records.map((album) => (
                <Table.Tr key={album.id}>
                  <Table.Td className="clickable-name" onClick={() => show("anatomy/albums", album.id)}>
                    <Text fw={500}>{album.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">{album.ean || "-"}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{album.releaseDate || "-"}</Text>
                  </Table.Td>
                  <Table.Td>
                    <RatingDisplay value={album.rating} />
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
        )}

        {pageCount > 1 && (
          <Group justify="center" mt="md">
            <Pagination value={page} onChange={setPage} total={pageCount} />
          </Group>
        )}
      </Card>

      <Modal opened={opened} onClose={close} title="New Album">
        <TextInput
          label="Name"
          placeholder="Album name"
          value={newName}
          onChange={(e) => setNewName(e.currentTarget.value)}
          mb="md"
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={close}>Cancel</Button>
          <Button onClick={handleCreate} disabled={newName.trim() === ""}>Create</Button>
        </Group>
      </Modal>
    </>
  );
};
