import { useState, useEffect } from "react";
import { useShow, useNavigation, useUpdate } from "@refinedev/core";
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
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useSearchParams } from "react-router";
import { IconExternalLink } from "@tabler/icons-react";
import { ArchiveBadge, ArchiveButton } from "../../../components/shared/archive-toggle.js";
import { EditableField } from "../../../components/shared/editable-field.js";
import { ShowPageHeader, SectionCard } from "../../../components/shared/show-page.js";

interface BinSource {
  id: string;
  name: string;
  url: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export const BinSourceShow = () => {
  const { query: showQuery } = useShow<BinSource>({
    resource: "bin/sources",
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
      resource: "bin/sources",
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
        Source not found.
      </Text>
    );
  }

  return (
    <Stack gap="md">
      <ShowPageHeader
        title={record.name}
        onBack={() => list("bin/sources")}
        onEdit={openEditModal}
        badges={<ArchiveBadge archived={record.archived} />}
      />

      {/* Source Details */}
      <SectionCard title="Source Details">
        <Table>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td fw={600} w={180}>URL</Table.Td>
              <Table.Td>
                <EditableField
                  value={record.url}
                  onSave={(v) => saveField("url", v)}
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

// Edit Modal - name, archive
const EditModal = ({
  opened,
  onClose,
  record,
  onSaved,
}: {
  opened: boolean;
  onClose: () => void;
  record: BinSource;
  onSaved: () => void;
}) => {
  const [name, setName] = useState(record.name);
  const { mutateAsync: updateRecord, mutation } = useUpdate();

  useEffect(() => {
    if (opened) {
      setName(record.name);
    }
  }, [opened, record]);

  const handleSubmit = async () => {
    await updateRecord({
      resource: "bin/sources",
      id: record.id,
      values: { name },
    });
    onSaved();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Source">
      <Stack gap="md">
        <TextInput
          label="Name"
          required
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Source name"
        />
        <Group justify="space-between" mt="md">
          <ArchiveButton
            archived={record.archived}
            onToggle={async (val) => {
              await updateRecord({
                resource: "bin/sources",
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
