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
  Modal,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";
import { ListToolbar } from "../../../components/shared/list-toolbar.js";
import { SortableHeader } from "../../../components/shared/sortable-header.js";

export const SunoCollectionList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [archiveFilter, setArchiveFilter] = useState("active");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { show } = useNavigation();
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [newName, setNewName] = useState("");
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
    const result = await createRecord({ resource: "suno/collections", values: { name: newName } });
    closeCreate(); setNewName("");
    show("suno/collections", (result as any).data.id);
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
    resource: "suno/collections",
    pagination: { currentPage: page, pageSize: 20 },
    filters,
    sorters: [{ field: sortField, order: sortOrder }],
  });

  const collections = result.data ?? [];
  const total = result.total ?? 0;
  const pageCount = Math.ceil(total / 20);

  const truncate = (text: string | null | undefined, max: number) => {
    if (!text) return "-";
    return text.length > max ? text.slice(0, max) + "..." : text;
  };

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Collections</Title>
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
        <LoadingOverlay visible={listQuery.isPending} />
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <SortableHeader field="name" label="Name" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <Table.Th>Description</Table.Th>
              <SortableHeader field="createdAt" label="Added" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {collections.length === 0 && !listQuery.isPending && (
              <Table.Tr>
                <Table.Td colSpan={3}>
                  <Text c="dimmed" ta="center" py="md">
                    No collections found.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {collections.map((collection: any) => (
              <Table.Tr key={collection.id}>
                <Table.Td className="clickable-name" onClick={() => show("suno/collections", collection.id)}>
                  <Text size="sm" fw={500}>
                    {collection.name}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {truncate(collection.description, 60)}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {collection.createdAt
                      ? new Date(collection.createdAt).toLocaleDateString()
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

      <Modal opened={createOpened} onClose={closeCreate} title="New Collection">
        <Stack gap="md">
          <TextInput label="Name" required value={newName} onChange={(e) => setNewName(e.currentTarget.value)} placeholder="Collection name" onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) handleCreate(); }} />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeCreate}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating} disabled={!newName.trim()}>Create</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};
