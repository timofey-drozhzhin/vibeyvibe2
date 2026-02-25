import { useState, useEffect } from "react";
import { useShow, useNavigation, useUpdate, useList } from "@refinedev/core";
import {
  Anchor,
  Group,
  Stack,
  Text,
  Button,
  Table,
  Loader,
  Center,
  Modal,
  TextInput,
  Select,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useSearchParams } from "react-router";
import { IconExternalLink } from "@tabler/icons-react";
import { ArchiveBadge, ArchiveButton } from "../../../components/shared/archive-toggle.js";
import { AudioPlayer } from "../../../components/shared/audio-player.js";
import { EditableField } from "../../../components/shared/editable-field.js";
import { ShowPageHeader, SectionCard } from "../../../components/shared/show-page.js";
import { FileUpload } from "../../../components/shared/file-upload.js";

interface BinSource {
  id: string;
  name: string;
}

interface BinSong {
  id: string;
  name: string;
  sourceId: string | null;
  assetPath: string | null;
  sourceUrl: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  source?: { id: string; name: string } | null;
}

export const BinSongShow = () => {
  const { query: showQuery } = useShow<BinSong>({
    resource: "bin/songs",
  });
  const { list } = useNavigation();
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
      resource: "bin/songs",
      id: record!.id,
      values: { [field]: value || null },
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
        Song not found.
      </Text>
    );
  }

  return (
    <Stack gap="md">
      <ShowPageHeader
        title={record.name}
        onBack={() => list("bin/songs")}
        onEdit={openEditModal}
        badges={<ArchiveBadge archived={record.archived} />}
      />

      {/* Song Details */}
      <SectionCard title="Song Details">
        <Table>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td fw={600} w={180}>Source</Table.Td>
              <Table.Td>
                <Text size="sm">
                  {record.source?.name ?? <Text span c="dimmed" fs="italic">None</Text>}
                </Text>
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Source URL</Table.Td>
              <Table.Td>
                <EditableField
                  value={record.sourceUrl}
                  onSave={(v) => saveField("sourceUrl", v)}
                  placeholder="https://..."
                  emptyText="Click to add"
                  renderDisplay={(v) => (
                    <Anchor
                      href={v}
                      target="_blank"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {v} <IconExternalLink size={14} style={{ verticalAlign: "middle" }} />
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

      {/* Audio Player */}
      <SectionCard title="Audio">
        <AudioPlayer path={record.assetPath} />
      </SectionCard>

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

// Edit Modal - name, source, asset file, archive
const EditModal = ({
  opened,
  onClose,
  record,
  onSaved,
}: {
  opened: boolean;
  onClose: () => void;
  record: BinSong;
  onSaved: () => void;
}) => {
  const [name, setName] = useState(record.name);
  const [sourceId, setSourceId] = useState(record.sourceId ?? "");
  const [assetPath, setAssetPath] = useState(record.assetPath ?? "");
  const { mutateAsync: updateRecord, mutation } = useUpdate();

  // Fetch sources for the dropdown
  const { result: sourcesResult } = useList<BinSource>({
    resource: "bin/sources",
    pagination: { pageSize: 100 },
    filters: [{ field: "archived", operator: "eq", value: false }],
  });

  const sourceOptions = (sourcesResult.data ?? []).map((s: BinSource) => ({
    value: s.id,
    label: s.name,
  }));

  useEffect(() => {
    if (opened) {
      setName(record.name);
      setSourceId(record.sourceId ?? "");
      setAssetPath(record.assetPath ?? "");
    }
  }, [opened, record]);

  const handleSubmit = async () => {
    await updateRecord({
      resource: "bin/songs",
      id: record.id,
      values: {
        name,
        sourceId: sourceId || null,
        assetPath: assetPath || null,
      },
    });
    onSaved();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Song">
      <Stack gap="md">
        <TextInput
          label="Name"
          required
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Song name"
        />
        <Select
          label="Source"
          placeholder="Select a source"
          data={sourceOptions}
          value={sourceId || null}
          onChange={(v) => setSourceId(v ?? "")}
          clearable
          searchable
        />
        <FileUpload
          label="Asset File"
          value={assetPath}
          onChange={setAssetPath}
          accept="audio/*"
          directory="bin"
          placeholder="Upload audio file"
        />
        <Group justify="space-between" mt="md">
          <ArchiveButton
            archived={record.archived}
            onToggle={async (val) => {
              await updateRecord({
                resource: "bin/songs",
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
