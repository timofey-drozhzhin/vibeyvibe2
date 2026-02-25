import { useState } from "react";
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
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";

interface ProfileOption {
  id: string;
  songId: string;
  songName?: string;
  value: string;
  archived: boolean;
  createdAt: string;
}

export const SunoPromptCreate = () => {
  const { list } = useNavigation();

  const [lyrics, setLyrics] = useState("");
  const [style, setStyle] = useState("");
  const [voiceGender, setVoiceGender] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);

  const { onFinish, formLoading } = useForm({
    resource: "suno/prompts",
    action: "create",
    redirect: "show",
  });

  const { result: profilesResult } = useList<ProfileOption>({
    resource: "anatomy/profiles",
    pagination: { pageSize: 100 },
    filters: [{ field: "archived", operator: "eq", value: false }],
  });

  const profiles = profilesResult.data ?? [];

  // Build profile select options with grouping by song name
  const profileSelectData = buildProfileOptions(profiles);

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
        <Title order={3}>Create Prompt</Title>
      </Group>

      <Card withBorder padding="lg" style={{ maxWidth: 600 }}>
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

          <Group justify="flex-end" mt="md">
            <Button
              variant="default"
              onClick={() => list("suno/prompts")}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={formLoading}
            >
              Save
            </Button>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
};

function buildProfileOptions(profiles: ProfileOption[]) {
  // Group profiles by songName and create numbered labels
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
    // Sort by createdAt ascending so Profile #1 is the oldest
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
