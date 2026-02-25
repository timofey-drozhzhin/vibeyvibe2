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
import { RatingDisplay } from "../../../components/shared/rating-field.js";
import { ArchiveBadge } from "../../../components/shared/archive-toggle.js";

interface AnatomySong {
  id: string;
  name: string;
  isrc: string;
  releaseDate: string;
  rating: number;
  archived: boolean;
  imagePath: string | null;
  spotifyId: string | null;
  appleMusicId: string | null;
  youtubeId: string | null;
  createdAt: string;
  updatedAt: string;
}

type SortField = "releaseDate" | "rating";

export const AnatomySongList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [archiveFilter, setArchiveFilter] = useState("active");
  const [sortField, setSortField] = useState<SortField>("releaseDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { show, edit, create } = useNavigation();

  const archivedValue =
    archiveFilter === "active" ? false : archiveFilter === "archived" ? true : undefined;

  const { query: listQuery, result } = useList<AnatomySong>({
    resource: "anatomy/songs",
    pagination: { currentPage: page, pageSize: 10 },
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
  const pageCount = Math.ceil(total / 10);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortIndicator = (field: SortField) =>
    sortField === field ? (sortOrder === "asc" ? " \u2191" : " \u2193") : "";

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={2}>Anatomy Songs</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => create("anatomy/songs")}
        >
          Add Song
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
            No songs found.
          </Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>ISRC</Table.Th>
                <Table.Th
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleSort("releaseDate")}
                >
                  Release Date{sortIndicator("releaseDate")}
                </Table.Th>
                <Table.Th
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleSort("rating")}
                >
                  Rating{sortIndicator("rating")}
                </Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {records.map((song) => (
                <Table.Tr key={song.id}>
                  <Table.Td>
                    <Text fw={500}>{song.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" ff="monospace">
                      {song.isrc}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{song.releaseDate}</Text>
                  </Table.Td>
                  <Table.Td>
                    <RatingDisplay value={song.rating} />
                  </Table.Td>
                  <Table.Td>
                    {song.archived ? (
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
                      <Tooltip label="View">
                        <ActionIcon
                          variant="subtle"
                          onClick={() => show("anatomy/songs", song.id)}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Edit">
                        <ActionIcon
                          variant="subtle"
                          onClick={() => edit("anatomy/songs", song.id)}
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
