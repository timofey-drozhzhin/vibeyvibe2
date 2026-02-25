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
} from "@mantine/core";
import { IconEye, IconEdit, IconPlus, IconMusic } from "@tabler/icons-react";
import { ListToolbar } from "../../../components/shared/list-toolbar.js";
import { ArchiveBadge } from "../../../components/shared/archive-toggle.js";

interface BinSong {
  id: number;
  name: string;
  sourceId: number | null;
  assetPath: string | null;
  sourceUrl: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  source?: { id: number; name: string } | null;
}

export const BinSongList = () => {
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

  const { query: listQuery, result } = useList<BinSong>({
    resource: "bin/songs",
    pagination: { currentPage: page, pageSize: 10 },
    filters,
  });

  const records = result.data ?? [];
  const total = result.total ?? 0;
  const pageCount = Math.ceil(total / 10);

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={3}>Bin Songs</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => create("bin/songs")}
        >
          Add Song
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
              <Table.Th>Source</Table.Th>
              <Table.Th>Asset</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th style={{ width: 100 }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {listQuery.isPending ? (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text ta="center" c="dimmed" py="md">
                    Loading...
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : records.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text ta="center" c="dimmed" py="md">
                    No songs found
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              records.map((song: BinSong) => (
                <Table.Tr key={song.id}>
                  <Table.Td>
                    <Text fw={500}>{song.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    {song.source?.name ? (
                      <Text size="sm">{song.source.name}</Text>
                    ) : (
                      <Text size="sm" c="dimmed">
                        --
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {song.assetPath ? (
                      <Badge
                        variant="light"
                        color="green"
                        leftSection={<IconMusic size={12} />}
                      >
                        Audio
                      </Badge>
                    ) : (
                      <Text size="sm" c="dimmed">
                        --
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <ArchiveBadge archived={song.archived} />
                    {!song.archived && (
                      <Badge variant="light" color="green">
                        Active
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => show("bin/songs", song.id)}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        onClick={() => edit("bin/songs", song.id)}
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
