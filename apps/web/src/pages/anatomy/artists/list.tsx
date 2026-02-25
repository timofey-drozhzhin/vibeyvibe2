import { useState } from "react";
import { useList, useNavigation } from "@refinedev/core";
import {
  Table,
  Group,
  Text,
  Title,
  Button,
  Pagination,
  ActionIcon,
  Tooltip,
  Card,
  Loader,
  Center,

} from "@mantine/core";
import { IconEdit, IconPlus } from "@tabler/icons-react";
import { ListToolbar } from "../../../components/shared/list-toolbar.js";
import { SortableHeader } from "../../../components/shared/sortable-header.js";
import { RatingDisplay } from "../../../components/shared/rating-field.js";
import { ArchiveBadge } from "../../../components/shared/archive-toggle.js";

interface AnatomyArtist {
  id: string;
  name: string;
  isni: string;
  rating: number;
  archived: boolean;
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
}

export const AnatomyArtistList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [archiveFilter, setArchiveFilter] = useState("active");
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

  const { query: listQuery, result } = useList<AnatomyArtist>({
    resource: "anatomy/artists",
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
        <Title order={2}>Anatomy Artists</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => create("anatomy/artists")}
        >
          Create
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
            No artists found.
          </Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <SortableHeader field="name" label="Name" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <Table.Th>Releases</Table.Th>
                <SortableHeader field="rating" label="Rating" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <Table.Th>Status</Table.Th>
                <SortableHeader field="createdAt" label="Added" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {records.map((artist) => (
                <Table.Tr key={artist.id}>
                  <Table.Td className="clickable-name" onClick={() => show("anatomy/artists", artist.id)}>
                    <Text fw={500}>{artist.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">{(artist as any).songCount || 0}</Text>
                  </Table.Td>
                  <Table.Td>
                    <RatingDisplay value={artist.rating} />
                  </Table.Td>
                  <Table.Td>
                    <ArchiveBadge archived={artist.archived} />
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {artist.createdAt
                        ? new Date(artist.createdAt).toLocaleDateString()
                        : "-"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label="Edit">
                        <ActionIcon
                          variant="subtle"
                          onClick={() => edit("anatomy/artists", artist.id)}
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
