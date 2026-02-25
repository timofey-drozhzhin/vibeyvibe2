import { useState, useEffect } from "react";
import { useShow, useNavigation, useUpdate } from "@refinedev/core";
import {
  ActionIcon,
  Group,
  Stack,
  Text,
  Button,
  Table,
  Code,
  Loader,
  Center,
  Modal,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useSearchParams } from "react-router";
import { IconEye } from "@tabler/icons-react";
import { RatingField } from "../../../components/shared/rating-field.js";
import { RatingDisplay } from "../../../components/shared/rating-field.js";
import { ArchiveBadge, ArchiveButton } from "../../../components/shared/archive-toggle.js";
import { ImagePreview } from "../../../components/shared/image-preview.js";
import { EditableField } from "../../../components/shared/editable-field.js";
import { ShowPageHeader, SectionCard } from "../../../components/shared/show-page.js";
import { FileUpload } from "../../../components/shared/file-upload.js";

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
  isni: string;
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

  // Edit modal
  const [searchParams, setSearchParams] = useSearchParams();
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] =
    useDisclosure(false);

  useEffect(() => {
    if (searchParams.get("edit") === "true" && record) {
      openEditModal();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, record]);

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
    <Stack gap="md">
      <ShowPageHeader
        title={record.name}
        onBack={() => list("anatomy/artists")}
        onEdit={openEditModal}
        badges={<ArchiveBadge archived={record.archived} />}
      />

      {/* Two column layout */}
      <Group align="flex-start" gap="lg" wrap="nowrap">
        {/* Left column - main content */}
        <Stack style={{ flex: 1, minWidth: 0 }} gap="md">
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
                  <Table.Th w={60}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(!record.songs || record.songs.length === 0) && (
                  <Table.Tr>
                    <Table.Td colSpan={5}>
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
                    <Table.Td>
                      <ActionIcon
                        variant="subtle"
                        onClick={(e) => { e.stopPropagation(); show("anatomy/songs", song.id); }}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </SectionCard>
        </Stack>

        {/* Right column - image */}
        {record.imagePath && (
          <Stack w={300} style={{ flexShrink: 0 }}>
            <ImagePreview path={record.imagePath} alt={record.name} size={300} />
          </Stack>
        )}
      </Group>

      {/* Edit Modal */}
      <EditModal
        opened={editModalOpened}
        onClose={closeEditModal}
        record={record}
        onSaved={() => { closeEditModal(); showQuery.refetch(); }}
      />
    </Stack>
  );
};

// Edit Modal - name, image, archive
const EditModal = ({
  opened,
  onClose,
  record,
  onSaved,
}: {
  opened: boolean;
  onClose: () => void;
  record: AnatomyArtistDetail;
  onSaved: () => void;
}) => {
  const [name, setName] = useState(record.name);
  const [imagePath, setImagePath] = useState(record.imagePath ?? "");
  const { mutateAsync: updateRecord, mutation } = useUpdate();

  useEffect(() => {
    if (opened) {
      setName(record.name);
      setImagePath(record.imagePath ?? "");
    }
  }, [opened, record]);

  const handleSubmit = async () => {
    await updateRecord({
      resource: "anatomy/artists",
      id: record.id,
      values: { name, imagePath: imagePath || null },
    });
    onSaved();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Artist">
      <Stack gap="md">
        <TextInput
          label="Name"
          required
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Artist name"
        />
        <FileUpload
          label="Image"
          value={imagePath}
          onChange={setImagePath}
          accept="image/*"
          directory="artists"
          placeholder="Upload artist image"
        />
        {imagePath && <ImagePreview path={imagePath} alt={name} size={80} />}
        <Group justify="space-between" mt="md">
          <ArchiveButton
            archived={record.archived}
            onToggle={async (val) => {
              await updateRecord({
                resource: "anatomy/artists",
                id: record.id,
                values: { archived: val },
              });
              onSaved();
            }}
          />
          <Group>
            <Button onClick={handleSubmit} loading={mutation.isPending} disabled={!name.trim()}>
              Save
            </Button>
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
};
