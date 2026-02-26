import { useShow, useNavigation, useUpdate } from "@refinedev/core";
import {
  Text,
  Table,
  Code,
  Loader,
  Center,
} from "@mantine/core";
import { RatingField } from "../../../components/shared/rating-field.js";
import { RatingDisplay } from "../../../components/shared/rating-field.js";
import { ImageUpload } from "../../../components/shared/image-upload.js";
import { EditableField } from "../../../components/shared/editable-field.js";
import { EntityPage, SectionCard } from "../../../components/shared/entity-page.js";

interface AnatomySong {
  id: string;
  name: string;
  isrc: string;
  releaseDate: string;
  rating: number;
  archived: boolean;
}

interface AnatomyArtistDetail {
  id: string;
  name: string;
  isni: string | null;
  rating: number;
  archived: boolean;
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
  songs: AnatomySong[];
}

const isniRegex = /^\d{15}[\dX]$/;

export const AnatomyArtistShow = () => {
  const { query: showQuery } = useShow<AnatomyArtistDetail>({
    resource: "anatomy/artists",
  });
  const { list, show } = useNavigation();
  const { mutateAsync: updateRecord } = useUpdate();

  const record = showQuery?.data?.data;
  const isLoading = showQuery?.isPending;

  // Inline save helper
  const saveField = async (field: string, value: string) => {
    await updateRecord({
      resource: "anatomy/artists",
      id: record!.id,
      values: { [field]: value || null },
    });
    showQuery.refetch();
  };

  const handleRatingChange = async (newRating: number) => {
    await updateRecord({
      resource: "anatomy/artists",
      id: record!.id,
      values: { rating: newRating },
    });
    showQuery.refetch();
  };

  if (isLoading) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }

  if (!record) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        Artist not found.
      </Text>
    );
  }

  return (
    <EntityPage
      title={record.name}
      onBack={() => list("anatomy/artists")}
      onTitleSave={async (newTitle) => {
        await updateRecord({
          resource: "anatomy/artists",
          id: record.id,
          values: { name: newTitle },
        });
        showQuery.refetch();
      }}
      archived={record.archived}
      onArchiveToggle={async (val) => {
        await updateRecord({
          resource: "anatomy/artists",
          id: record.id,
          values: { archived: val },
        });
        showQuery.refetch();
      }}
      rightPanel={
        <ImageUpload
          path={record.imagePath}
          onUpload={(path) => saveField("imagePath", path)}
          alt={record.name}
          size={300}
          directory="artists"
        />
      }
    >
      {/* Artist details */}
      <SectionCard title="Artist Details">
        <Table>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td fw={600} w={180}>ISNI</Table.Td>
              <Table.Td>
                <EditableField
                  value={record.isni}
                  onSave={(v) => saveField("isni", v)}
                  placeholder="e.g. 0000000012345678"
                  renderDisplay={(v) => <Code>{v}</Code>}
                  validate={(v) =>
                    v && !isniRegex.test(v) ? "Invalid ISNI format" : null
                  }
                />
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Rating</Table.Td>
              <Table.Td>
                <RatingField value={record.rating} onChange={handleRatingChange} />
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Created</Table.Td>
              <Table.Td>{record.createdAt}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Updated</Table.Td>
              <Table.Td>{record.updatedAt}</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </SectionCard>

      {/* Songs */}
      <SectionCard title="Songs">
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>ISRC</Table.Th>
              <Table.Th>Release Date</Table.Th>
              <Table.Th>Rating</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(!record.songs || record.songs.length === 0) && (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text c="dimmed" ta="center" py="md">No songs found.</Text>
                </Table.Td>
              </Table.Tr>
            )}
            {record.songs?.map((song) => (
              <Table.Tr
                key={song.id}
                className="clickable-name"
                onClick={() => show("anatomy/songs", song.id)}
              >
                <Table.Td><Text fw={500}>{song.name}</Text></Table.Td>
                <Table.Td><Code>{song.isrc}</Code></Table.Td>
                <Table.Td>{song.releaseDate}</Table.Td>
                <Table.Td><RatingDisplay value={song.rating} /></Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </SectionCard>
    </EntityPage>
  );
};
