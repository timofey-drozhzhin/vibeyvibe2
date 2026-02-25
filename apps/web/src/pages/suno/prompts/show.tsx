import { useState, useEffect } from "react";
import { useShow, useNavigation, useUpdate, useList } from "@refinedev/core";
import {
  Badge,
  Button,
  Code,
  Center,
  Group,
  Loader,
  Modal,
  Select,
  Stack,
  Table,
  Text,
  Textarea,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useSearchParams } from "react-router";
import { RatingField } from "../../../components/shared/rating-field.js";
import { ArchiveBadge, ArchiveButton } from "../../../components/shared/archive-toggle.js";
import { EditableField } from "../../../components/shared/editable-field.js";
import { ShowPageHeader, SectionCard } from "../../../components/shared/show-page.js";

interface ProfileOption {
  id: string;
  songId: string;
  songName?: string;
  value: string;
  archived: boolean;
  createdAt: string;
}

interface SunoPromptDetail {
  id: string;
  lyrics: string | null;
  style: string | null;
  voiceGender: string | null;
  notes: string | null;
  profileId: string | null;
  rating: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  profile: {
    id: string;
    songId: string;
    value: string;
    archived: boolean;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export const SunoPromptShow = () => {
  const { query: showQuery } = useShow<SunoPromptDetail>({
    resource: "suno/prompts",
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
      resource: "suno/prompts",
      id: record!.id,
      values: { [field]: value || null },
    });
    showQuery.refetch();
  };

  const handleRatingChange = async (newRating: number) => {
    await updateRecord({
      resource: "suno/prompts",
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
        Prompt not found.
      </Text>
    );
  }

  return (
    <Stack gap="md">
      <ShowPageHeader
        title={record.style || "Untitled Prompt"}
        onBack={() => list("suno/prompts")}
        onEdit={openEditModal}
        badges={<ArchiveBadge archived={record.archived} />}
      />

      <SectionCard title="Prompt Details">
        <Table>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td fw={600} w={180}>Style</Table.Td>
              <Table.Td>
                <EditableField
                  value={record.style}
                  onSave={(v) => saveField("style", v)}
                  placeholder="e.g. pop, rock, jazz..."
                />
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Voice Gender</Table.Td>
              <Table.Td>
                <EditableField
                  value={record.voiceGender}
                  onSave={(v) => saveField("voiceGender", v)}
                  placeholder="male, female, or neutral"
                  renderDisplay={(v) => (
                    <Badge variant="light">{v}</Badge>
                  )}
                />
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Rating</Table.Td>
              <Table.Td>
                <RatingField value={record.rating ?? 0} onChange={handleRatingChange} />
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Notes</Table.Td>
              <Table.Td>
                <EditableField
                  value={record.notes}
                  onSave={(v) => saveField("notes", v)}
                  placeholder="Additional notes..."
                />
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Profile ID</Table.Td>
              <Table.Td>
                <Text size="sm">{record.profileId || "-"}</Text>
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Lyrics</Table.Td>
              <Table.Td>
                {record.lyrics ? (
                  <Code block style={{ whiteSpace: "pre-wrap" }}>
                    {record.lyrics}
                  </Code>
                ) : (
                  <Text size="sm" c="dimmed">-</Text>
                )}
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Created</Table.Td>
              <Table.Td>
                {record.createdAt
                  ? new Date(record.createdAt).toLocaleString()
                  : "-"}
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Updated</Table.Td>
              <Table.Td>
                {record.updatedAt
                  ? new Date(record.updatedAt).toLocaleString()
                  : "-"}
              </Table.Td>
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

// Edit Modal - lyrics, profile, archive
const EditModal = ({
  opened,
  onClose,
  record,
  onSaved,
}: {
  opened: boolean;
  onClose: () => void;
  record: SunoPromptDetail;
  onSaved: () => void;
}) => {
  const [lyrics, setLyrics] = useState(record.lyrics ?? "");
  const [profileId, setProfileId] = useState<string | null>(record.profileId ?? null);
  const { mutateAsync: updateRecord, mutation } = useUpdate();

  const { result: profilesResult } = useList<ProfileOption>({
    resource: "anatomy/profiles",
    pagination: { pageSize: 100 },
    filters: [{ field: "archived", operator: "eq", value: false }],
  });

  const profiles = profilesResult.data ?? [];
  const profileSelectData = buildProfileOptions(profiles);

  useEffect(() => {
    if (opened) {
      setLyrics(record.lyrics ?? "");
      setProfileId(record.profileId ?? null);
    }
  }, [opened, record]);

  const handleSubmit = async () => {
    await updateRecord({
      resource: "suno/prompts",
      id: record.id,
      values: {
        lyrics: lyrics || null,
        profileId: profileId || null,
      },
    });
    onSaved();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Prompt" size="lg">
      <Stack gap="md">
        <Textarea
          label="Lyrics"
          placeholder="Enter lyrics..."
          minRows={6}
          autosize
          value={lyrics}
          onChange={(e) => setLyrics(e.currentTarget.value)}
        />

        <Select
          label="Anatomy Profile"
          placeholder="Select an anatomy profile (optional)"
          data={profileSelectData}
          value={profileId}
          onChange={setProfileId}
          clearable
          searchable
        />

        <Group justify="space-between" mt="md">
          <ArchiveButton
            archived={record.archived}
            onToggle={async (val) => {
              await updateRecord({
                resource: "suno/prompts",
                id: record.id,
                values: { archived: val },
              });
              onSaved();
            }}
          />
          <Group>
            <Button onClick={handleSubmit} loading={mutation.isPending}>
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

function buildProfileOptions(profiles: ProfileOption[]) {
  const songGroups: Record<string, ProfileOption[]> = {};
  for (const profile of profiles) {
    const songName = profile.songName || "Unknown Song";
    if (!songGroups[songName]) {
      songGroups[songName] = [];
    }
    songGroups[songName].push(profile);
  }

  const options: { value: string; label: string; group: string }[] = [];
  for (const [songName, songProfiles] of Object.entries(songGroups)) {
    const sorted = [...songProfiles].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    sorted.forEach((profile, index) => {
      options.push({
        value: profile.id,
        label: `${songName} - Profile #${index + 1}`,
        group: songName,
      });
    });
  }

  return options;
}
