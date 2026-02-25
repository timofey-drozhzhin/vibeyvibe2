import { useState, useEffect } from "react";
import { useForm, useNavigation } from "@refinedev/core";
import {
  Card,
  TextInput,
  NumberInput,
  Button,
  Group,
  Stack,
  Title,
  LoadingOverlay,
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { ArchiveToggle } from "../../../components/shared/archive-toggle.js";

export const SongEdit = () => {
  const { list, show } = useNavigation();
  const { onFinish, mutation, query, id, formLoading } = useForm({
    resource: "my-music/songs",
    action: "edit",
    redirect: "show",
  });

  const record = query?.data?.data;

  const [name, setName] = useState("");
  const [isrc, setIsrc] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [spotifyId, setSpotifyId] = useState("");
  const [appleMusicId, setAppleMusicId] = useState("");
  const [youtubeId, setYoutubeId] = useState("");
  const [archived, setArchived] = useState(false);

  useEffect(() => {
    if (record) {
      setName(record.name ?? "");
      setIsrc(record.isrc ?? "");
      setImagePath(record.imagePath ?? "");
      setReleaseDate(record.releaseDate ?? "");
      setRating(record.rating ?? 0);
      setSpotifyId(record.spotifyId ?? "");
      setAppleMusicId(record.appleMusicId ?? "");
      setYoutubeId(record.youtubeId ?? "");
      setArchived(record.archived ?? false);
    }
  }, [record]);

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
      archived,
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
        <Title order={3}>Edit Song</Title>
      </Group>

      <Card withBorder p="lg" maw={600} pos="relative">
        <LoadingOverlay visible={formLoading} />
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
          <TextInput
            label="Image Path"
            placeholder="/path/to/image"
            value={imagePath}
            onChange={(e) => setImagePath(e.currentTarget.value)}
          />
          <TextInput
            label="Release Date"
            placeholder="YYYY-MM-DD"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.currentTarget.value)}
          />
          <NumberInput
            label="Rating"
            placeholder="0-10"
            min={0}
            max={10}
            step={0.5}
            value={rating}
            onChange={(val) => setRating(typeof val === "number" ? val : 0)}
          />
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

          <ArchiveToggle value={archived} onChange={setArchived} />

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={() =>
                id ? show("my-music/songs", id) : list("my-music/songs")
              }
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={mutation.isPending}
              disabled={!name.trim()}
            >
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
};
