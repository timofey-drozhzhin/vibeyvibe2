import { useShow, useNavigation, useUpdate } from "@refinedev/core";
import {
  Anchor,
  Code,
  Text,
  Table,
} from "@mantine/core";
import { RatingField, RatingDisplay } from "../../../components/shared/rating-field.js";
import { ArchiveBadge } from "../../../components/shared/archive-toggle.js";
import { ImageUpload } from "../../../components/shared/image-upload.js";
import { EditableField } from "../../../components/shared/editable-field.js";
import { EntityPage, SectionCard } from "../../../components/shared/entity-page.js";

interface ArtistSong {
  id: string;
  name: string;
  isrc: string;
  releaseDate: string;
  rating: number;
  archived: boolean;
}

interface ArtistDetail {
  id: string;
  name: string;
  isni: string | null;
  rating: number;
  archived: boolean;
  imagePath: string | null;
  spotifyId: string | null;
  youtubeUsername: string | null;
  tiktokUsername: string | null;
  instagramUsername: string | null;
  createdAt: string;
  updatedAt: string;
  songs: ArtistSong[];
}

export const ArtistShow = () => {
  const { query: showQuery } = useShow<ArtistDetail>({
    resource: "my-music/artists",
  });
  const { list, show: showNav } = useNavigation();
  const { mutateAsync: updateRecord } = useUpdate();

  const record = showQuery?.data?.data;
  const isLoading = showQuery?.isPending;

  // Inline save helper
  const saveField = async (field: string, value: string) => {
    await updateRecord({
      resource: "my-music/artists",
      id: record!.id,
      values: { [field]: value || null },
    });
    showQuery.refetch();
  };

  const handleRatingChange = async (newRating: number) => {
    await updateRecord({
      resource: "my-music/artists",
      id: record!.id,
      values: { rating: newRating },
    });
    showQuery.refetch();
  };

  if (isLoading) {
    return (
      <EntityPage
        title=""
        onBack={() => list("my-music/artists")}
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
        onBack={() => list("my-music/artists")}
        notFound
        notFoundMessage="Artist not found."
      >
        <div />
      </EntityPage>
    );
  }

  return (
    <EntityPage
      title={record.name}
      onBack={() => list("my-music/artists")}
      onTitleSave={async (newName) => {
        await updateRecord({
          resource: "my-music/artists",
          id: record.id,
          values: { name: newName },
        });
        showQuery.refetch();
      }}
      archived={record.archived}
      onArchiveToggle={async (val) => {
        await updateRecord({
          resource: "my-music/artists",
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
              <Table.Td fw={600}>Spotify ID</Table.Td>
              <Table.Td>
                <EditableField
                  value={record.spotifyId}
                  onSave={(v) => saveField("spotifyId", v)}
                  placeholder="Spotify artist ID"
                  emptyText="Click to add"
                  renderDisplay={(v) => (
                    <Anchor
                      href={`https://open.spotify.com/artist/${v}`}
                      target="_blank"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Code>{v}</Code>
                    </Anchor>
                  )}
                />
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>YouTube Username</Table.Td>
              <Table.Td>
                <EditableField
                  value={record.youtubeUsername}
                  onSave={(v) => saveField("youtubeUsername", v)}
                  placeholder="YouTube username"
                  emptyText="Click to add"
                  renderDisplay={(v) => (
                    <Anchor
                      href={`https://youtube.com/${v}`}
                      target="_blank"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {v}
                    </Anchor>
                  )}
                />
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>TikTok Username</Table.Td>
              <Table.Td>
                <EditableField
                  value={record.tiktokUsername}
                  onSave={(v) => saveField("tiktokUsername", v)}
                  placeholder="TikTok username"
                  emptyText="Click to add"
                  renderDisplay={(v) => (
                    <Anchor
                      href={`https://tiktok.com/${v}`}
                      target="_blank"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {v}
                    </Anchor>
                  )}
                />
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Instagram Username</Table.Td>
              <Table.Td>
                <EditableField
                  value={record.instagramUsername}
                  onSave={(v) => saveField("instagramUsername", v)}
                  placeholder="Instagram username"
                  emptyText="Click to add"
                  renderDisplay={(v) => (
                    <Anchor
                      href={`https://instagram.com/${v}`}
                      target="_blank"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {v}
                    </Anchor>
                  )}
                />
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
                  onClick={() => showNav("my-music/songs", song.id)}
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
