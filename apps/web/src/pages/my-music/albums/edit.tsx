import { useState, useEffect } from "react";
import { useForm, useNavigation } from "@refinedev/core";
import {
  Card,
  TextInput,
  Button,
  Group,
  Stack,
  Title,
  Text,
  LoadingOverlay,
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { ArchiveButton } from "../../../components/shared/archive-toggle.js";
import { RatingField } from "../../../components/shared/rating-field.js";
import { FileUpload } from "../../../components/shared/file-upload.js";
import { ImagePreview } from "../../../components/shared/image-preview.js";

export const AlbumEdit = () => {
  const { list, show } = useNavigation();
  const { onFinish, mutation, query, id, formLoading } = useForm({
    resource: "my-music/albums",
    action: "edit",
    redirect: "show",
  });

  const record = query?.data?.data;

  const [name, setName] = useState("");
  const [ean, setEan] = useState("");
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
      setEan(record.ean ?? "");
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
      ean: ean || null,
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
          onClick={() => list("my-music/albums")}
        >
          Back
        </Button>
        <Title order={3}>Edit Album</Title>
      </Group>

      <Card withBorder p="lg" maw={600} pos="relative">
        <LoadingOverlay visible={formLoading} />
        <Stack>
          <TextInput
            label="Name"
            placeholder="Album name"
            required
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />
          <TextInput
            label="EAN"
            placeholder="13 digits"
            description="European Article Number (13 digits)"
            value={ean}
            onChange={(e) => setEan(e.currentTarget.value)}
          />
          <FileUpload
            label="Image"
            value={imagePath}
            onChange={setImagePath}
            accept="image/*"
            directory="albums"
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
            placeholder="Spotify album ID"
            value={spotifyId}
            onChange={(e) => setSpotifyId(e.currentTarget.value)}
          />
          <TextInput
            label="Apple Music ID"
            placeholder="Apple Music album ID"
            value={appleMusicId}
            onChange={(e) => setAppleMusicId(e.currentTarget.value)}
          />
          <TextInput
            label="YouTube ID"
            placeholder="YouTube ID"
            value={youtubeId}
            onChange={(e) => setYoutubeId(e.currentTarget.value)}
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
                disabled={!name.trim()}
              >
                Save
              </Button>
              <Button
                variant="subtle"
                onClick={() =>
                  id ? show("my-music/albums", id) : list("my-music/albums")
                }
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
