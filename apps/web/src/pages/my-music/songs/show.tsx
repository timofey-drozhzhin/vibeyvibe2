import { useState } from "react";
import { useShow, useNavigation, useUpdate } from "@refinedev/core";
import {
  ActionIcon,
  Code,
  Text,
  Table,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconUnlink } from "@tabler/icons-react";
import { RatingField, RatingDisplay } from "../../../components/shared/rating-field.js";
import { AssignModal } from "../../../components/shared/assign-modal.js";
import { ImageUpload } from "../../../components/shared/image-upload.js";
import { MediaEmbeds } from "../../../components/shared/media-embeds.js";
import { EditableField } from "../../../components/shared/editable-field.js";
import { EntityPage, SectionCard } from "../../../components/shared/entity-page.js";

interface MySongArtist {
  id: string;
  name: string;
  isni: string;
  rating: number;
  archived: boolean;
}

interface MySongAlbum {
  id: string;
  name: string;
  ean: string;
  releaseDate: string;
  rating: number;
  archived: boolean;
}

interface MySongDetail {
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
  artists: MySongArtist[];
  albums: MySongAlbum[];
}

const API_URL = import.meta.env.VITE_API_URL || "";
const isrcRegex = /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/;

export const SongShow = () => {
  const { query: showQuery } = useShow<MySongDetail>({
    resource: "my-music/songs",
  });
  const { list, show } = useNavigation();
  const { mutateAsync: updateRecord } = useUpdate();

  const record = showQuery?.data?.data;
  const isLoading = showQuery?.isPending;

  // Artist assign modal
  const [artistModalOpened, { open: openArtistModal, close: closeArtistModal }] =
    useDisclosure(false);
  // Album assign modal
  const [albumModalOpened, { open: openAlbumModal, close: closeAlbumModal }] =
    useDisclosure(false);

  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemoveArtist = async (artistId: string) => {
    setRemovingId(artistId);
    try {
      const res = await fetch(
        `${API_URL}/api/my-music/songs/${record?.id}/artists/${artistId}`,
        { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" } },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      notifications.show({ title: "Removed", message: "Artist removed from song.", color: "green" });
      showQuery.refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to remove artist.";
      notifications.show({ title: "Error", message, color: "red" });
    } finally {
      setRemovingId(null);
    }
  };

  const handleRemoveAlbum = async (albumId: string) => {
    setRemovingId(albumId);
    try {
      const res = await fetch(
        `${API_URL}/api/my-music/songs/${record?.id}/albums/${albumId}`,
        { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" } },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      notifications.show({ title: "Removed", message: "Album removed from song.", color: "green" });
      showQuery.refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to remove album.";
      notifications.show({ title: "Error", message, color: "red" });
    } finally {
      setRemovingId(null);
    }
  };

  // Inline save helper
  const saveField = async (field: string, value: string) => {
    await updateRecord({
      resource: "my-music/songs",
      id: record!.id,
      values: { [field]: value || null },
    });
    showQuery.refetch();
  };

  const handleRatingChange = async (newRating: number) => {
    await updateRecord({
      resource: "my-music/songs",
      id: record!.id,
      values: { rating: newRating },
    });
    showQuery.refetch();
  };

  if (isLoading) {
    return (
      <EntityPage
        title=""
        onBack={() => list("my-music/songs")}
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
        onBack={() => list("my-music/songs")}
        notFound
        notFoundMessage="Song not found."
      >
        <div />
      </EntityPage>
    );
  }

  return (
    <EntityPage
      title={record.name}
      onBack={() => list("my-music/songs")}
      onTitleSave={async (newName) => {
        await updateRecord({
          resource: "my-music/songs",
          id: record.id,
          values: { name: newName },
        });
        showQuery.refetch();
      }}
      archived={record.archived}
      onArchiveToggle={async (val) => {
        await updateRecord({
          resource: "my-music/songs",
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
            directory="songs"
          />
          <MediaEmbeds
            spotifyId={record.spotifyId}
            appleMusicId={record.appleMusicId}
            youtubeId={record.youtubeId}
            onSave={saveField}
          />
        </>
      }
      modals={
        <>
          {record.id && (
            <AssignModal
              opened={artistModalOpened}
              onClose={closeArtistModal}
              title="Assign Artist"
              resource="my-music/artists"
              assignUrl={`/api/my-music/songs/${record.id}/artists`}
              fieldName="artistId"
              labelField="name"
              onSuccess={() => showQuery.refetch()}
            />
          )}
          {record.id && (
            <AssignModal
              opened={albumModalOpened}
              onClose={closeAlbumModal}
              title="Assign Album"
              resource="my-music/albums"
              assignUrl={`/api/my-music/songs/${record.id}/albums`}
              fieldName="albumId"
              labelField="name"
              onSuccess={() => showQuery.refetch()}
            />
          )}
        </>
      }
    >
      {/* Song details */}
      <SectionCard title="Song Details">
        <Table>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td fw={600} w={180}>ISRC</Table.Td>
              <Table.Td>
                <EditableField
                  value={record.isrc}
                  onSave={(v) => saveField("isrc", v)}
                  placeholder="e.g. USRC11234567"
                  renderDisplay={(v) => <Code>{v}</Code>}
                  validate={(v) =>
                    v && !isrcRegex.test(v) ? "Invalid ISRC format" : null
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

      {/* Artists */}
      <SectionCard title="Artists" action={{ label: "Assign Artist", onClick: openArtistModal }}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Rating</Table.Th>
              <Table.Th w={60}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(!record.artists || record.artists.length === 0) && (
              <Table.Tr>
                <Table.Td colSpan={3}>
                  <Text c="dimmed" ta="center" py="md">No artists assigned.</Text>
                </Table.Td>
              </Table.Tr>
            )}
            {record.artists?.map((artist) => (
              <Table.Tr
                key={artist.id}
                className="clickable-name"
                onClick={() => show("my-music/artists", artist.id)}
              >
                <Table.Td><Text fw={500}>{artist.name}</Text></Table.Td>
                <Table.Td><RatingDisplay value={artist.rating ?? 0} /></Table.Td>
                <Table.Td>
                  <Tooltip label="Remove artist from song">
                    <ActionIcon variant="subtle" color="red" loading={removingId === artist.id} onClick={(e) => { e.stopPropagation(); handleRemoveArtist(artist.id); }}>
                      <IconUnlink size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </SectionCard>

      {/* Albums */}
      <SectionCard title="Albums" action={{ label: "Assign Album", onClick: openAlbumModal }}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Release Date</Table.Th>
              <Table.Th>Rating</Table.Th>
              <Table.Th w={60}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(!record.albums || record.albums.length === 0) && (
              <Table.Tr>
                <Table.Td colSpan={4}>
                  <Text c="dimmed" ta="center" py="md">No albums assigned.</Text>
                </Table.Td>
              </Table.Tr>
            )}
            {record.albums?.map((album) => (
              <Table.Tr
                key={album.id}
                className="clickable-name"
                onClick={() => show("my-music/albums", album.id)}
              >
                <Table.Td><Text fw={500}>{album.name}</Text></Table.Td>
                <Table.Td>{album.releaseDate || "-"}</Table.Td>
                <Table.Td><RatingDisplay value={album.rating ?? 0} /></Table.Td>
                <Table.Td>
                  <Tooltip label="Remove album from song">
                    <ActionIcon variant="subtle" color="red" loading={removingId === album.id} onClick={(e) => { e.stopPropagation(); handleRemoveAlbum(album.id); }}>
                      <IconUnlink size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </SectionCard>
    </EntityPage>
  );
};
