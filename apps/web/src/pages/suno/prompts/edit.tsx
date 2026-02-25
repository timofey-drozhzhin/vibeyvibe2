import { useEffect, useState } from "react";
import { useForm, useNavigation, useList } from "@refinedev/core";
import {
  Card,
  TextInput,
  Textarea,
  Select,
  NumberInput,
  Button,
  Group,
  Stack,
  Title,
  LoadingOverlay,
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { ArchiveButton } from "../../../components/shared/archive-toggle.js";

interface ProfileOption {
  id: string;
  songId: string;
  songName?: string;
  value: string;
  archived: boolean;
  createdAt: string;
}

export const SunoPromptEdit = () => {
  const { list, show } = useNavigation();

  const [lyrics, setLyrics] = useState("");
  const [style, setStyle] = useState("");
  const [voiceGender, setVoiceGender] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [archived, setArchived] = useState(false);

  const { onFinish, mutation, query } = useForm({
    resource: "suno/prompts",
    action: "edit",
    redirect: "show",
  });

  const record = query?.data?.data;

  const { result: profilesResult } = useList<ProfileOption>({
    resource: "anatomy/profiles",
    pagination: { pageSize: 100 },
    filters: [{ field: "archived", operator: "eq", value: false }],
  });

  const profiles = profilesResult.data ?? [];
  const profileSelectData = buildProfileOptions(profiles);

  useEffect(() => {
    if (record) {
      setLyrics(record.lyrics ?? "");
      setStyle(record.style ?? "");
      setVoiceGender(record.voiceGender ?? null);
      setNotes(record.notes ?? "");
      setProfileId(record.profileId ?? null);
      setRating(record.rating ?? 0);
      setArchived(record.archived ?? false);
    }
  }, [record]);

  const handleSubmit = () => {
    onFinish({
      lyrics: lyrics || undefined,
      style: style || undefined,
      voiceGender: voiceGender || undefined,
      notes: notes || undefined,
      profileId: profileId || undefined,
      rating,
    });
  };

  return (
    <Stack>
      <Group>
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => list("suno/prompts")}
        >
          Back
        </Button>
        <Title order={3}>Edit Prompt</Title>
      </Group>

      <Card withBorder padding="lg" style={{ maxWidth: 600, position: "relative" }}>
        <LoadingOverlay visible={query?.isLoading ?? false} />
        <Stack gap="md">
          <Textarea
            label="Lyrics"
            placeholder="Enter lyrics..."
            minRows={6}
            autosize
            value={lyrics}
            onChange={(e) => setLyrics(e.currentTarget.value)}
          />

          <TextInput
            label="Style"
            placeholder="e.g. pop, rock, jazz..."
            value={style}
            onChange={(e) => setStyle(e.currentTarget.value)}
          />

          <Select
            label="Voice Gender"
            placeholder="Select voice gender"
            data={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
              { value: "neutral", label: "Neutral" },
            ]}
            value={voiceGender}
            onChange={setVoiceGender}
            clearable
          />

          <Textarea
            label="Notes"
            placeholder="Additional notes..."
            minRows={3}
            autosize
            value={notes}
            onChange={(e) => setNotes(e.currentTarget.value)}
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

          <NumberInput
            label="Rating"
            description="0 to 10"
            min={0}
            max={10}
            step={0.5}
            value={rating}
            onChange={(val) => setRating(typeof val === "number" ? val : 0)}
          />

          <Group justify="space-between" mt="md">
            <ArchiveButton
              archived={archived}
              onToggle={(val) => {
                onFinish({ archived: val });
              }}
            />
            <Group>
              <Button
                onClick={handleSubmit}
                loading={mutation.isPending}
              >
                Save
              </Button>
              <Button
                variant="subtle"
                onClick={() => record?.id ? show("suno/prompts", record.id) : list("suno/prompts")}
              >
                Cancel
              </Button>
            </Group>
          </Group>
        </Stack>
      </Card>
    </Stack>
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
