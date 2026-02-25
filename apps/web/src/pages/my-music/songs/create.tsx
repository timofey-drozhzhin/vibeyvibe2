import { useState } from "react";
import { useForm, useNavigation } from "@refinedev/core";
import {
  Card,
  TextInput,
  Button,
  Group,
  Stack,
  Title,
  Text,
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { RatingField } from "../../../components/shared/rating-field.js";
import { FileUpload } from "../../../components/shared/file-upload.js";
import { ImagePreview } from "../../../components/shared/image-preview.js";

export const SongCreate = () => {
  const { list } = useNavigation();
  const { onFinish, mutation } = useForm({
    resource: "my-music/songs",
    action: "create",
    redirect: "show",
  });

  const [name, setName] = useState("");
  const [isrc, setIsrc] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [spotifyId, setSpotifyId] = useState("");
  const [appleMusicId, setAppleMusicId] = useState("");
  const [youtubeId, setYoutubeId] = useState("");

  const handleSubmit = () => {
    onFinish({
      name,
      isrc: isrc || null,
      imagePath: imagePath || null,
      releaseDate: releaseDate || null,
      rating,
      spotifyId: spotifyId || null,
      appleMusicId: appleMusicId || null,
      youtubeId: youtubeId || null,
    });
  };

  return (
    <Stack>
      <Group>
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => list("my-music/songs")}
        >
          Back
        </Button>
        <Title order={3}>Create Song</Title>
      </Group>

      <Card withBorder p="lg" maw={600}>
        <Stack>
          <TextInput
            label="Name"
            placeholder="Song name"
            required
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />
          <TextInput
            label="ISRC"
            placeholder="e.g. USRC17607839"
            description="International Standard Recording Code"
            value={isrc}
            onChange={(e) => setIsrc(e.currentTarget.value)}
          />
          <FileUpload
            label="Image"
            value={imagePath}
            onChange={setImagePath}
            accept="image/*"
            directory="songs"
          />
          {imagePath && <ImagePreview path={imagePath} alt={name} size={80} />}
          <TextInput
            label="Release Date"
            placeholder="YYYY-MM-DD"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.currentTarget.value)}
          />
          <div>
            <Text size="sm" fw={500} mb={4}>
              Rating
            </Text>
            <RatingField value={rating} onChange={(val) => setRating(val)} />
          </div>
          <TextInput
            label="Spotify ID"
            placeholder="Spotify track ID"
            value={spotifyId}
            onChange={(e) => setSpotifyId(e.currentTarget.value)}
          />
          <TextInput
            label="Apple Music ID"
            placeholder="Apple Music track ID"
            value={appleMusicId}
            onChange={(e) => setAppleMusicId(e.currentTarget.value)}
          />
          <TextInput
            label="YouTube ID"
            placeholder="YouTube video ID"
            value={youtubeId}
            onChange={(e) => setYoutubeId(e.currentTarget.value)}
          />

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={() => list("my-music/songs")}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={mutation.isPending}
              disabled={!name.trim()}
            >
              Create Song
            </Button>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
};
