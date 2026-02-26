import { useState } from "react";
import type { CrudFilter } from "@refinedev/core";
import { useList, useNavigation, useCreate } from "@refinedev/core";
import {
  Table,
  Card,
  Group,
  Title,
  Text,
  Pagination,
  Button,
  Anchor,
  Modal,
  TextInput,
  Stack,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconPlus,
  IconExternalLink,
} from "@tabler/icons-react";
import { ListToolbar } from "../../../components/shared/list-toolbar.js";
import { SortableHeader } from "../../../components/shared/sortable-header.js";
import { ArchiveBadge } from "../../../components/shared/archive-toggle.js";

interface BinSource {
  id: number;
  name: string;
  url: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export const BinSourceList = () => {
  const { show } = useNavigation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [archiveFilter, setArchiveFilter] = useState("active");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
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
    const result = await createRecord({ resource: "bin/sources", values: { name: newName } });
    closeCreate(); setNewName("");
    show("bin/sources", (result as any).data.id);
  };

  const filters: CrudFilter[] = [];
  if (search) {
    filters.push({ field: "search", operator: "contains", value: search });
  }
  if (archiveFilter === "active") {
    filters.push({ field: "archived", operator: "eq", value: false });
  } else if (archiveFilter === "archived") {
    filters.push({ field: "archived", operator: "eq", value: true });
  }

  const { query: listQuery, result } = useList<BinSource>({
    resource: "bin/sources",
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
        <Title order={3}>Bin Sources</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={openCreate}
        >
          New
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
      />

      <Card withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <SortableHeader field="name" label="Name" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <Table.Th>URL</Table.Th>
              <Table.Th>Status</Table.Th>
              <SortableHeader field="createdAt" label="Added" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {listQuery.isPending ? (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text ta="center" c="dimmed" py="md">
                    Loading...
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : records.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text ta="center" c="dimmed" py="md">
                    No sources found
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              records.map((source) => (
                <Table.Tr key={source.id}>
                  <Table.Td className="clickable-name" onClick={() => show("bin/sources", source.id)}>
                    <Text fw={500}>{source.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    {source.url ? (
                      <Anchor
                        href={source.url}
                        target="_blank"
                        rel="noopener"
                        size="sm"
                      >
                        {source.url}{" "}
                        <IconExternalLink
                          size={12}
                          style={{ verticalAlign: "middle" }}
                        />
                      </Anchor>
                    ) : (
                      <Text size="sm" c="dimmed">
                        --
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <ArchiveBadge archived={source.archived} />
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {source.createdAt
                        ? new Date(source.createdAt).toLocaleDateString()
                        : "-"}
                    </Text>
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

      <Modal opened={createOpened} onClose={closeCreate} title="New Source">
        <Stack gap="md">
          <TextInput label="Name" required value={newName} onChange={(e) => setNewName(e.currentTarget.value)} placeholder="Source name" onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) handleCreate(); }} />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeCreate}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating} disabled={!newName.trim()}>Create</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};
