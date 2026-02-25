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
} from "@mantine/core";
import { IconEye, IconEdit, IconPlus } from "@tabler/icons-react";

export const SunoCollectionList = () => {
  const [page, setPage] = useState(1);
  const { show, edit, create } = useNavigation();

  const { query: listQuery, result } = useList({
    resource: "suno/collections",
    pagination: { currentPage: page, pageSize: 10 },
    sorters: [{ field: "createdAt", order: "desc" }],
  });

  const collections = result.data ?? [];
  const total = result.total ?? 0;
  const pageCount = Math.ceil(total / 10);

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
          onClick={() => create("suno/collections")}
        >
          Create
        </Button>
      </Group>

      <div style={{ position: "relative", minHeight: 200 }}>
        <LoadingOverlay visible={listQuery.isPending} />
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Created</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {collections.length === 0 && !listQuery.isPending && (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text c="dimmed" ta="center" py="md">
                    No collections found.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {collections.map((collection: any) => (
              <Table.Tr key={collection.id}>
                <Table.Td>
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
                <Table.Td>
                  <Group gap="xs">
                    <Tooltip label="View">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => show("suno/collections", collection.id)}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Edit">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => edit("suno/collections", collection.id)}
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
