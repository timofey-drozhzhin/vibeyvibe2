import { useShow, useNavigation, useUpdate } from "@refinedev/core";
import {
  Code,
  Text,
  Table,
} from "@mantine/core";
import { RatingField, RatingDisplay } from "../../../components/shared/rating-field.js";
import { ArchiveBadge } from "../../../components/shared/archive-toggle.js";
import { ImageUpload } from "../../../components/shared/image-upload.js";
import { MediaEmbeds } from "../../../components/shared/media-embeds.js";
import { EditableField } from "../../../components/shared/editable-field.js";
import { EntityPage, SectionCard } from "../../../components/shared/entity-page.js";

interface AlbumSong {
  id: string;
  name: string;
  isrc: string;
  releaseDate: string;
  rating: number;
  archived: boolean;
}

interface AlbumDetail {
  id: string;
  name: string;
  ean: string;
  releaseDate: string;
  rating: number;
  archived: boolean;
  imagePath: string | null;
  spotifyId: string | null;
  appleMusicId: string | null;
  youtubeId: string | null;
  createdAt: string;
  updatedAt: string;
  songs: AlbumSong[];
}

const eanRegex = /^\d{13}$/;

export const AlbumShow = () => {
  const { query: showQuery } = useShow<AlbumDetail>({
    resource: "my-music/albums",
  });
  const { list, show } = useNavigation();
  const { mutateAsync: updateRecord } = useUpdate();

  const record = showQuery?.data?.data;
  const isLoading = showQuery?.isPending;

  // Inline save helper
  const saveField = async (field: string, value: string) => {
    await updateRecord({
      resource: "my-music/albums",
      id: record!.id,
      values: { [field]: value || null },
    });
    showQuery.refetch();
  };

  const handleRatingChange = async (newRating: number) => {
    await updateRecord({
      resource: "my-music/albums",
      id: record!.id,
      values: { rating: newRating },
    });
    showQuery.refetch();
  };

  if (isLoading) {
    return (
      <EntityPage
        title=""
        onBack={() => list("my-music/albums")}
        isLoading
      >
        <div />
      </EntityPage>
    );
  }

  if (!record) {
    return (
      <EntityPage
        title=""
        onBack={() => list("my-music/albums")}
        notFound
        notFoundMessage="Album not found."
      >
        <div />
      </EntityPage>
    );
  }

  return (
    <EntityPage
      title={record.name}
      onBack={() => list("my-music/albums")}
      onTitleSave={async (newName) => {
        await updateRecord({
          resource: "my-music/albums",
          id: record.id,
          values: { name: newName },
        });
        showQuery.refetch();
      }}
      archived={record.archived}
      onArchiveToggle={async (val) => {
        await updateRecord({
          resource: "my-music/albums",
          id: record.id,
          values: { archived: val },
        });
        showQuery.refetch();
      }}
      rightPanel={
        <>
          <ImageUpload
            path={record.imagePath}
            onUpload={(path) => saveField("imagePath", path)}
            alt={record.name}
            size={300}
            directory="albums"
          />
          <MediaEmbeds
            spotifyId={record.spotifyId}
            appleMusicId={record.appleMusicId}
            youtubeId={record.youtubeId}
            onSave={saveField}
            type="album"
          />
        </>
      }
    >
      {/* Album details */}
      <SectionCard title="Album Details">
        <Table>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td fw={600} w={180}>EAN</Table.Td>
              <Table.Td>
                <EditableField
                  value={record.ean}
                  onSave={(v) => saveField("ean", v)}
                  placeholder="e.g. 1234567890123"
                  renderDisplay={(v) => <Code>{v}</Code>}
                  validate={(v) =>
                    v && !eanRegex.test(v) ? "EAN must be exactly 13 digits" : null
                  }
                />
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Release Date</Table.Td>
              <Table.Td>
                <EditableField
                  value={record.releaseDate}
                  onSave={(v) => saveField("releaseDate", v)}
                  placeholder="YYYY-MM-DD"
                  type="date"
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
      {record.songs && record.songs.length > 0 && (
        <SectionCard title="Songs">
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>ISRC</Table.Th>
                <Table.Th>Release Date</Table.Th>
                <Table.Th>Rating</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {record.songs.map((song) => (
                <Table.Tr
                  key={song.id}
                  className="clickable-name"
                  onClick={() => show("my-music/songs", song.id)}
                >
                  <Table.Td><Text fw={500}>{song.name}</Text></Table.Td>
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
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </SectionCard>
      )}
    </EntityPage>
  );
};
