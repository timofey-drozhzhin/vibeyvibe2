import { useState } from "react";
import { useShow, useNavigation, useList } from "@refinedev/core";
import {
  ActionIcon,
  Anchor,
  Card,
  Group,
  Stack,
  Title,
  Text,
  Badge,
  Button,
  Table,
  Loader,
  Center,
  Code,
  Modal,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconArrowLeft, IconEdit, IconPlus, IconUnlink } from "@tabler/icons-react";
import { RatingField } from "../../../components/shared/rating-field.js";
import { ArchiveBadge } from "../../../components/shared/archive-toggle.js";
import { AssignModal } from "../../../components/shared/assign-modal.js";
import { ImagePreview } from "../../../components/shared/image-preview.js";
import { MediaEmbeds } from "../../../components/shared/media-embeds.js";
import { ProfileEditor } from "../../../components/anatomy/profile-editor.js";

interface AnatomyArtist {
  id: string;
  name: string;
  isni: string;
  rating: number;
  archived: boolean;
}

interface AnatomyProfile {
  id: string;
  songId: string;
  value: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AnatomySongDetail {
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
  activeProfile: AnatomyProfile | null;
  artists: AnatomyArtist[];
}

const API_URL = import.meta.env.VITE_API_URL || "";

export const AnatomySongShow = () => {
  const { query: showQuery } = useShow<AnatomySongDetail>({
    resource: "anatomy/songs",
  });
  const { edit, list, show } = useNavigation();

  const record = showQuery?.data?.data;
  const isLoading = showQuery?.isPending;

  // Artist assign modal
  const [artistModalOpened, { open: openArtistModal, close: closeArtistModal }] =
    useDisclosure(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemoveArtist = async (artistId: string) => {
    setRemovingId(artistId);
    try {
      const res = await fetch(
        `${API_URL}/api/anatomy/songs/${record?.id}/artists/${artistId}`,
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

  // Profile management state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<AnatomyProfile | null>(null);

  // Fetch all profiles for this song
  const {
    query: profilesQuery,
    result: profilesResult,
  } = useList<AnatomyProfile>({
    resource: "anatomy/profiles",
    filters: [{ field: "songId", operator: "eq", value: record?.id || "" }],
    pagination: { pageSize: 100 },
    queryOptions: {
      enabled: !!record?.id,
    },
  });

  const profiles = profilesResult.data ?? [];
  const profilesLoading = profilesQuery.isLoading;

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

  // Parse active profile value
  let profileData: Record<string, string> | null = null;
  if (record.activeProfile?.value) {
    try {
      profileData = JSON.parse(record.activeProfile.value);
    } catch {
      // Invalid JSON, will show raw value
    }
  }

  const handleCreateProfile = () => {
    setEditingProfile(null);
    setProfileModalOpen(true);
  };

  const handleEditProfile = (profile: AnatomyProfile) => {
    setEditingProfile(profile);
    setProfileModalOpen(true);
  };

  const handleProfileSaved = () => {
    setProfileModalOpen(false);
    setEditingProfile(null);
    profilesQuery.refetch();
    showQuery.refetch();
  };

  const parseProfileValue = (value: string): Record<string, string> | null => {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Group>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => list("anatomy/songs")}
          >
            Back
          </Button>
          <Title order={2}>{record.name}</Title>
          <ArchiveBadge archived={record.archived} />
        </Group>
        <Group>
          <Button
            variant="light"
            leftSection={<IconEdit size={16} />}
            onClick={() => edit("anatomy/songs", record.id)}
          >
            Edit
          </Button>
        </Group>
      </Group>

      {/* Two column layout */}
      <Group align="flex-start" gap="lg" wrap="nowrap">
        {/* Left column - main content */}
        <Stack style={{ flex: 1, minWidth: 0 }} gap="md">
          {/* Song details */}
          <Card withBorder>
            <Title order={4} mb="md">
              Song Details
            </Title>
            <Table>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td fw={600} w={180}>
                    ISRC
                  </Table.Td>
                  <Table.Td>
                    <Code>{record.isrc}</Code>
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={600}>Release Date</Table.Td>
                  <Table.Td>{record.releaseDate}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td fw={600}>Rating</Table.Td>
                  <Table.Td>
                    <RatingField value={record.rating} readOnly />
                  </Table.Td>
                </Table.Tr>
                {record.spotifyId && (
                  <Table.Tr>
                    <Table.Td fw={600}>Spotify ID</Table.Td>
                    <Table.Td>
                      <Anchor
                        href={`https://open.spotify.com/track/${record.spotifyId}`}
                        target="_blank"
                        size="sm"
                      >
                        <Code>{record.spotifyId}</Code>
                      </Anchor>
                    </Table.Td>
                  </Table.Tr>
                )}
                {record.appleMusicId && (
                  <Table.Tr>
                    <Table.Td fw={600}>Apple Music ID</Table.Td>
                    <Table.Td>
                      <Anchor
                        href={`https://music.apple.com/song/${record.appleMusicId}`}
                        target="_blank"
                        size="sm"
                      >
                        <Code>{record.appleMusicId}</Code>
                      </Anchor>
                    </Table.Td>
                  </Table.Tr>
                )}
                {record.youtubeId && (
                  <Table.Tr>
                    <Table.Td fw={600}>YouTube ID</Table.Td>
                    <Table.Td>
                      <Anchor
                        href={`https://www.youtube.com/watch?v=${record.youtubeId}`}
                        target="_blank"
                        size="sm"
                      >
                        <Code>{record.youtubeId}</Code>
                      </Anchor>
                    </Table.Td>
                  </Table.Tr>
                )}
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
          </Card>

          {/* Artists */}
          <Card withBorder>
            <Group justify="space-between" mb="md">
              <Title order={4}>Artists</Title>
              <Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={openArtistModal}>
                Assign Artist
              </Button>
            </Group>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>ISNI</Table.Th>
                  <Table.Th>Rating</Table.Th>
                  <Table.Th w={60}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(!record.artists || record.artists.length === 0) && (
                  <Table.Tr>
                    <Table.Td colSpan={4}>
                      <Text c="dimmed" ta="center" py="md">No artists assigned.</Text>
                    </Table.Td>
                  </Table.Tr>
                )}
                {record.artists?.map((artist) => (
                  <Table.Tr
                    key={artist.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => show("anatomy/artists", artist.id)}
                  >
                    <Table.Td><Text fw={500}>{artist.name}</Text></Table.Td>
                    <Table.Td><Code>{artist.isni}</Code></Table.Td>
                    <Table.Td><RatingField value={artist.rating} readOnly size={16} /></Table.Td>
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
          </Card>

          {/* Profiles */}
          <Card withBorder>
            <Group justify="space-between" mb="md">
              <Title order={4}>Profiles</Title>
              <Button
                variant="light"
                leftSection={<IconPlus size={16} />}
                size="sm"
                onClick={handleCreateProfile}
              >
                Create Profile
              </Button>
            </Group>

            {profilesLoading ? (
              <Center py="md">
                <Loader size="sm" />
              </Center>
            ) : profiles.length === 0 ? (
              <Text c="dimmed">
                No profiles yet. Create one to define song attributes.
              </Text>
            ) : (
              <Stack gap="md">
                {profiles.map((profile: AnatomyProfile, index: number) => {
                  const parsed = parseProfileValue(profile.value);
                  const isActive =
                    record.activeProfile?.id === profile.id;

                  return (
                    <Card key={profile.id} withBorder padding="sm">
                      <Group justify="space-between" mb="xs">
                        <Group gap="xs">
                          <Text fw={600} size="sm">
                            Profile #{profiles.length - index}
                          </Text>
                          {isActive && (
                            <Badge color="green" variant="light" size="sm">
                              Active
                            </Badge>
                          )}
                          {profile.archived && (
                            <Badge color="red" variant="light" size="sm">
                              Archived
                            </Badge>
                          )}
                        </Group>
                        <Group gap="xs">
                          <Text size="xs" c="dimmed">
                            {new Date(profile.createdAt).toLocaleDateString()}
                          </Text>
                          <Button
                            variant="subtle"
                            size="xs"
                            leftSection={<IconEdit size={14} />}
                            onClick={() => handleEditProfile(profile)}
                          >
                            Edit
                          </Button>
                        </Group>
                      </Group>

                      {parsed ? (
                        <Table>
                          <Table.Tbody>
                            {Object.entries(parsed).map(([key, value]) => (
                              <Table.Tr key={key}>
                                <Table.Td fw={500} w={150} style={{ verticalAlign: "top" }}>
                                  {key}
                                </Table.Td>
                                <Table.Td>
                                  <Text size="sm">{String(value)}</Text>
                                </Table.Td>
                              </Table.Tr>
                            ))}
                          </Table.Tbody>
                        </Table>
                      ) : (
                        <Code block>{profile.value}</Code>
                      )}
                    </Card>
                  );
                })}
              </Stack>
            )}
          </Card>
        </Stack>

        {/* Right column - media panel */}
        {(record.imagePath || record.spotifyId || record.appleMusicId || record.youtubeId) && (
          <Stack w={300} style={{ flexShrink: 0 }}>
            {record.imagePath && (
              <ImagePreview path={record.imagePath} alt={record.name} size={300} />
            )}
            <MediaEmbeds
              spotifyId={record.spotifyId}
              appleMusicId={record.appleMusicId}
              youtubeId={record.youtubeId}
            />
          </Stack>
        )}
      </Group>

      {/* Profile Editor Modal */}
      <Modal
        opened={profileModalOpen}
        onClose={() => {
          setProfileModalOpen(false);
          setEditingProfile(null);
        }}
        title={editingProfile ? "Edit Profile" : "Create Profile"}
        size="lg"
      >
        <ProfileEditor
          songId={record.id}
          profileId={editingProfile?.id}
          initialValues={
            editingProfile
              ? parseProfileValue(editingProfile.value) ?? undefined
              : undefined
          }
          onSaved={handleProfileSaved}
          onCancel={() => {
            setProfileModalOpen(false);
            setEditingProfile(null);
          }}
        />
      </Modal>

      {/* Assign Artist Modal */}
      {record.id && (
        <AssignModal
          opened={artistModalOpened}
          onClose={closeArtistModal}
          title="Assign Artist"
          resource="anatomy/artists"
          assignUrl={`/api/anatomy/songs/${record.id}/artists`}
          fieldName="artistId"
          labelField="name"
          onSuccess={() => showQuery.refetch()}
        />
      )}
    </Stack>
  );
};
