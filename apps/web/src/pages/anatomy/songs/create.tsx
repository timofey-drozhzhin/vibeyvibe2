import { useState } from "react";
import { useForm, useNavigation } from "@refinedev/core";
import {
  Card,
  Group,
  Stack,
  Title,
  TextInput,
  Button,
  Text,
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { RatingField } from "../../../components/shared/rating-field.js";

export const AnatomySongCreate = () => {
  const { onFinish, mutation } = useForm({
    resource: "anatomy/songs",
    action: "create",
    redirect: "show",
  });
  const { list } = useNavigation();

  const isSaving = mutation?.isPending;

  const [name, setName] = useState("");
  const [isrc, setIsrc] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [rating, setRating] = useState(0);
  const [imagePath, setImagePath] = useState("");
  const [spotifyId, setSpotifyId] = useState("");
  const [appleMusicId, setAppleMusicId] = useState("");
  const [youtubeId, setYoutubeId] = useState("");

  const handleSubmit = () => {
    onFinish({
      name,
      isrc,
      releaseDate,
      rating,
      imagePath: imagePath || null,
      spotifyId: spotifyId || null,
      appleMusicId: appleMusicId || null,
      youtubeId: youtubeId || null,
    });
  };

  const isrcValid = /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(isrc);

  return (
    <Stack gap="md">
      <Group>
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => list("anatomy/songs")}
        >
          Back
        </Button>
        <Title order={2}>Add Anatomy Song</Title>
      </Group>

      <Card withBorder style={{ maxWidth: 600 }}>
        <Stack gap="md">
          <TextInput
            label="Name"
            required
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder="Song name"
          />

          <TextInput
            label="ISRC"
            required
            value={isrc}
            onChange={(e) => setIsrc(e.currentTarget.value.toUpperCase())}
            placeholder="e.g. USRC11234567"
            description="International Standard Recording Code (format: 2 letters, 3 alphanumeric, 7 digits)"
            error={isrc && !isrcValid ? "Invalid ISRC format" : undefined}
          />

          <TextInput
            label="Release Date"
            required
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.currentTarget.value)}
            placeholder="YYYY-MM-DD"
          />

          <div>
            <Text size="sm" fw={500} mb={4}>
              Rating
            </Text>
            <RatingField value={rating} onChange={setRating} />
          </div>

          <TextInput
            label="Image Path"
            value={imagePath}
            onChange={(e) => setImagePath(e.currentTarget.value)}
            placeholder="Path to image"
          />

          <TextInput
            label="Spotify ID"
            value={spotifyId}
            onChange={(e) => setSpotifyId(e.currentTarget.value)}
            placeholder="Spotify track ID"
          />

          <TextInput
            label="Apple Music ID"
            value={appleMusicId}
            onChange={(e) => setAppleMusicId(e.currentTarget.value)}
            placeholder="Apple Music track ID"
          />

          <TextInput
            label="YouTube ID"
            value={youtubeId}
            onChange={(e) => setYoutubeId(e.currentTarget.value)}
            placeholder="YouTube video ID"
          />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={() => list("anatomy/songs")}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={isSaving}
              disabled={!name || !isrc || !isrcValid || !releaseDate}
            >
              Create
            </Button>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
};
