import { useState, useEffect } from "react";
import { useForm, useNavigation } from "@refinedev/core";
import {
  Card,
  Group,
  Stack,
  Title,
  TextInput,
  NumberInput,
  Button,
  Loader,
  Center,
  Text,
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { ArchiveToggle } from "../../../components/shared/archive-toggle.js";
import { RatingField } from "../../../components/shared/rating-field.js";
import { FileUpload } from "../../../components/shared/file-upload.js";

interface AnatomySong {
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
}

export const AnatomySongEdit = () => {
  const { onFinish, mutation, query } = useForm<AnatomySong>({
    resource: "anatomy/songs",
    action: "edit",
    redirect: "show",
  });
  const { list } = useNavigation();

  const record = query?.data?.data;
  const isLoading = query?.isPending;
  const isSaving = mutation?.isPending;

  const [name, setName] = useState("");
  const [isrc, setIsrc] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [rating, setRating] = useState(0);
  const [imagePath, setImagePath] = useState("");
  const [spotifyId, setSpotifyId] = useState("");
  const [appleMusicId, setAppleMusicId] = useState("");
  const [youtubeId, setYoutubeId] = useState("");
  const [archived, setArchived] = useState(false);

  useEffect(() => {
    if (record) {
      setName(record.name ?? "");
      setIsrc(record.isrc ?? "");
      setReleaseDate(record.releaseDate ?? "");
      setRating(record.rating ?? 0);
      setImagePath(record.imagePath ?? "");
      setSpotifyId(record.spotifyId ?? "");
      setAppleMusicId(record.appleMusicId ?? "");
      setYoutubeId(record.youtubeId ?? "");
      setArchived(record.archived ?? false);
    }
  }, [record]);

  if (isLoading) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }

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
      archived,
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
        <Title order={2}>Edit Anatomy Song</Title>
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

          <FileUpload
            label="Image"
            value={imagePath}
            onChange={setImagePath}
            accept="image/*"
            directory="songs"
            placeholder="Upload song image"
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

          <ArchiveToggle value={archived} onChange={setArchived} />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={() => list("anatomy/songs")}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={isSaving}
              disabled={!name || !isrc || !isrcValid || !releaseDate}
            >
              Save
            </Button>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
};
