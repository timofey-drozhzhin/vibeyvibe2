import { useState } from "react";
import { useForm, useNavigation } from "@refinedev/core";
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

export const SunoPromptCreate = () => {
  const { list } = useNavigation();

  const [lyrics, setLyrics] = useState("");
  const [style, setStyle] = useState("");
  const [voiceGender, setVoiceGender] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [profileId, setProfileId] = useState("");
  const [rating, setRating] = useState<number>(0);

  const { onFinish, formLoading } = useForm({
    resource: "suno/prompts",
    action: "create",
    redirect: "show",
  });

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

          <TextInput
            label="Profile ID"
            placeholder="Anatomy profile ID (optional)"
            value={profileId}
            onChange={(e) => setProfileId(e.currentTarget.value)}
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
