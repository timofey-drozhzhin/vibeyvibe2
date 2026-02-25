import { useState } from "react";
import type { CrudFilter } from "@refinedev/core";
import { useList, useNavigation } from "@refinedev/core";
import {
  Table,
  Card,
  Group,
  Title,
  Text,
  ActionIcon,
  Pagination,
  Button,
  Badge,
  Anchor,
} from "@mantine/core";
import {
  IconEye,
  IconEdit,
  IconPlus,
  IconExternalLink,
} from "@tabler/icons-react";
import { ListToolbar } from "../../../components/shared/list-toolbar.js";
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
  const { show, edit, create } = useNavigation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [archiveFilter, setArchiveFilter] = useState("active");

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
    pagination: { currentPage: page, pageSize: 10 },
    filters,
  });

  const records = result.data ?? [];
  const total = result.total ?? 0;
  const pageCount = Math.ceil(total / 10);

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={3}>Bin Sources</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => create("bin/sources")}
        >
          Add Source
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
              <Table.Th>Name</Table.Th>
              <Table.Th>URL</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th style={{ width: 100 }}>Actions</Table.Th>
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
                  <Table.Td>
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
                    {!source.archived && (
                      <Badge variant="light" color="green">
                        Active
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => show("bin/sources", source.id)}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        onClick={() => edit("bin/sources", source.id)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Group>
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
    </>
  );
};
