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
} from "@mantine/core";
import { IconEye, IconEdit, IconPlus } from "@tabler/icons-react";
import { ListToolbar } from "../../../components/shared/list-toolbar.js";

interface AnatomyAttribute {
  id: string;
  name: string;
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
  const { edit, create } = useNavigation();

  const archivedValue =
    archiveFilter === "active" ? false : archiveFilter === "archived" ? true : undefined;

  const { query: listQuery, result } = useList<AnatomyAttribute>({
    resource: "anatomy/attributes",
    pagination: { currentPage: page, pageSize: 10 },
    filters: [
      { field: "search", operator: "contains", value: search || undefined },
      ...(archivedValue !== undefined
        ? [{ field: "archived" as const, operator: "eq" as const, value: archivedValue }]
        : []),
    ],
  });

  const records = result.data ?? [];
  const total = result.total ?? 0;
  const pageCount = Math.ceil(total / 10);

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
      />

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
                <Table.Th>Name</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {records.map((attr) => (
                <Table.Tr key={attr.id}>
                  <Table.Td>
                    <Text fw={500}>{attr.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {truncate(attr.description, 80)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {attr.archived ? (
                      <Badge color="red" variant="light">
                        Archived
                      </Badge>
                    ) : (
                      <Badge color="green" variant="light">
                        Active
                      </Badge>
                    )}
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
