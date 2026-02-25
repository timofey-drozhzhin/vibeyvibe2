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
  Loader,
  Center,
  Code,
} from "@mantine/core";
import { IconEye } from "@tabler/icons-react";
import { ListToolbar } from "../../../components/shared/list-toolbar.js";
import { RatingDisplay } from "../../../components/shared/rating-field.js";

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
  const { show } = useNavigation();

  const archivedValue =
    archiveFilter === "active" ? false : archiveFilter === "archived" ? true : undefined;

  const { query: listQuery, result } = useList<AnatomyArtist>({
    resource: "anatomy/artists",
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

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={2}>Anatomy Artists</Title>
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
                <Table.Th>Name</Table.Th>
                <Table.Th>ISNI</Table.Th>
                <Table.Th>Rating</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {records.map((artist) => (
                <Table.Tr key={artist.id}>
                  <Table.Td>
                    <Text fw={500}>{artist.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Code>{artist.isni}</Code>
                  </Table.Td>
                  <Table.Td>
                    <RatingDisplay value={artist.rating} />
                  </Table.Td>
                  <Table.Td>
                    {artist.archived ? (
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
                    <Tooltip label="View">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => show("anatomy/artists", artist.id)}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                    </Tooltip>
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
