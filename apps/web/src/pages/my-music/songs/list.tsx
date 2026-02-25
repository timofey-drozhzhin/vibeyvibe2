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
  Badge,
} from "@mantine/core";
import { IconEye, IconEdit, IconPlus } from "@tabler/icons-react";
import { ListToolbar } from "../../../components/shared/list-toolbar.js";
import { RatingDisplay } from "../../../components/shared/rating-field.js";
import { ArchiveBadge } from "../../../components/shared/archive-toggle.js";

export const SongList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [archiveFilter, setArchiveFilter] = useState("active");
  const { show, edit, create } = useNavigation();

  const archivedValue =
    archiveFilter === "archived"
      ? true
      : archiveFilter === "active"
        ? false
        : undefined;

  const listResult = useList({
    resource: "my-music/songs",
    pagination: { currentPage: page, pageSize: 10 },
    filters: [
      { field: "search", operator: "contains", value: search },
      { field: "archived", operator: "eq", value: archivedValue },
    ],
    sorters: [{ field: "createdAt", order: "desc" }],
  });

  const songs = listResult.result.data ?? [];
  const total = listResult.result.total ?? 0;
  const pageCount = Math.ceil(total / 10);

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Songs</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => create("my-music/songs")}
        >
          Create
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
              <Table.Th>Name</Table.Th>
              <Table.Th>ISRC</Table.Th>
              <Table.Th>Release Date</Table.Th>
              <Table.Th>Rating</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {songs.length === 0 && !listResult.query.isPending && (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text c="dimmed" ta="center" py="md">
                    No songs found.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {songs.map((song: any) => (
              <Table.Tr key={song.id}>
                <Table.Td>{song.name}</Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {song.isrc || "-"}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{song.releaseDate || "-"}</Text>
                </Table.Td>
                <Table.Td>
                  <RatingDisplay value={song.rating ?? 0} />
                </Table.Td>
                <Table.Td>
                  <ArchiveBadge archived={song.archived} />
                  {!song.archived && (
                    <Badge color="green" variant="light">
                      Active
                    </Badge>
                  )}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Tooltip label="View">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => show("my-music/songs", song.id)}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Edit">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => edit("my-music/songs", song.id)}
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
