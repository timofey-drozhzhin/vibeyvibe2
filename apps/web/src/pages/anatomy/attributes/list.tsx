import { useState } from "react";
import { useList, useNavigation } from "@refinedev/core";
import {
  Table,
  Group,
  Text,
  Title,
  Badge,
  Pagination,
  ActionIcon,
  Tooltip,
  Card,
  Button,
  Loader,
  Center,
  Select,
} from "@mantine/core";
import { IconEdit, IconPlus } from "@tabler/icons-react";
import { ListToolbar } from "../../../components/shared/list-toolbar.js";
import { SortableHeader } from "../../../components/shared/sortable-header.js";
import { ArchiveBadge } from "../../../components/shared/archive-toggle.js";

interface AnatomyAttribute {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  instruction: string | null;
  examples: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export const AnatomyAttributeList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [archiveFilter, setArchiveFilter] = useState("active");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
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
    archiveFilter === "active" ? false : archiveFilter === "archived" ? true : undefined;

  const { query: listQuery, result } = useList<AnatomyAttribute>({
    resource: "anatomy/attributes",
    pagination: { currentPage: page, pageSize: 20 },
    filters: [
      { field: "search", operator: "contains", value: search || undefined },
      ...(archivedValue !== undefined
        ? [{ field: "archived" as const, operator: "eq" as const, value: archivedValue }]
        : []),
      ...(categoryFilter
        ? [{ field: "category" as const, operator: "eq" as const, value: categoryFilter }]
        : []),
    ],
    sorters: [{ field: sortField, order: sortOrder }],
  });

  const records = result.data ?? [];
  const total = result.total ?? 0;
  const pageCount = Math.ceil(total / 20);

  const truncate = (text: string | null, maxLen: number) => {
    if (!text) return "--";
    return text.length > maxLen ? text.slice(0, maxLen) + "..." : text;
  };

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={2}>Anatomy Attributes</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => create("anatomy/attributes")}
        >
          Add Attribute
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
      >
        <Select
          placeholder="All Categories"
          clearable
          size="sm"
          w={180}
          value={categoryFilter}
          onChange={(val) => {
            setCategoryFilter(val);
            setPage(1);
          }}
          data={[
            { value: "genre", label: "Genre" },
            { value: "structure", label: "Structure" },
            { value: "composition", label: "Composition" },
            { value: "rhythm", label: "Rhythm" },
            { value: "instrumentation", label: "Instrumentation" },
            { value: "vocals", label: "Vocals" },
            { value: "lyrics", label: "Lyrics" },
            { value: "production", label: "Production" },
            { value: "mood", label: "Mood" },
            { value: "energy", label: "Energy" },
            { value: "signature", label: "Signature" },
          ]}
        />
      </ListToolbar>

      <Card withBorder>
        {listQuery.isPending ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : records.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            No attributes found.
          </Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <SortableHeader field="name" label="Name" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <SortableHeader field="category" label="Category" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <Table.Th>Description</Table.Th>
                <Table.Th>Status</Table.Th>
                <SortableHeader field="createdAt" label="Added" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {records.map((attr) => (
                <Table.Tr key={attr.id}>
                  <Table.Td className="clickable-name" onClick={() => show("anatomy/attributes", attr.id)}>
                    <Text fw={500}>{attr.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    {attr.category ? (
                      <Badge variant="light" size="sm">
                        {attr.category}
                      </Badge>
                    ) : (
                      <Text size="sm" c="dimmed">--</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {truncate(attr.description, 80)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <ArchiveBadge archived={attr.archived} />
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {attr.createdAt
                        ? new Date(attr.createdAt).toLocaleDateString()
                        : "-"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label="Edit">
                        <ActionIcon
                          variant="subtle"
                          onClick={() => edit("anatomy/attributes", attr.id)}
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
        )}

        {pageCount > 1 && (
          <Group justify="center" mt="md">
            <Pagination value={page} onChange={setPage} total={pageCount} />
          </Group>
        )}
      </Card>
    </>
  );
};
