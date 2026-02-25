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

export const ArtistEdit = () => {
  const { list, show } = useNavigation();
  const { onFinish, mutation, query, id, formLoading } = useForm({
    resource: "my-music/artists",
    action: "edit",
    redirect: "show",
  });

  const record = query?.data?.data;

  const [name, setName] = useState("");
  const [isni, setIsni] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [spotifyId, setSpotifyId] = useState("");
  const [youtubeUsername, setYoutubeUsername] = useState("");
  const [tiktokUsername, setTiktokUsername] = useState("");
  const [instagramUsername, setInstagramUsername] = useState("");
  const [archived, setArchived] = useState(false);

  useEffect(() => {
    if (record) {
      setName(record.name ?? "");
      setIsni(record.isni ?? "");
      setImagePath(record.imagePath ?? "");
      setRating(record.rating ?? 0);
      setSpotifyId(record.spotifyId ?? "");
      setYoutubeUsername(record.youtubeUsername ?? "");
      setTiktokUsername(record.tiktokUsername ?? "");
      setInstagramUsername(record.instagramUsername ?? "");
      setArchived(record.archived ?? false);
    }
  }, [record]);

  const handleSubmit = () => {
    onFinish({
      name,
      isni: isni || null,
      imagePath: imagePath || null,
      rating,
      spotifyId: spotifyId || null,
      youtubeUsername: youtubeUsername || null,
      tiktokUsername: tiktokUsername || null,
      instagramUsername: instagramUsername || null,
    });
  };

  return (
    <Stack>
      <Group>
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => list("my-music/artists")}
        >
          Back
        </Button>
        <Title order={3}>Edit Artist</Title>
      </Group>

      <Card withBorder p="lg" maw={600} pos="relative">
        <LoadingOverlay visible={formLoading} />
        <Stack>
          <TextInput
            label="Name"
            placeholder="Artist name"
            required
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />
          <TextInput
            label="ISNI"
            placeholder="16 digits"
            description="International Standard Name Identifier (16 digits)"
            value={isni}
            onChange={(e) => setIsni(e.currentTarget.value)}
          />
          <FileUpload
            label="Image"
            value={imagePath}
            onChange={setImagePath}
            accept="image/*"
            directory="artists"
          />
          {imagePath && <ImagePreview path={imagePath} alt={name} size={80} />}
          <div>
            <Text size="sm" fw={500} mb={4}>
              Rating
            </Text>
            <RatingField value={rating} onChange={(val) => setRating(val)} />
          </div>
          <TextInput
            label="Spotify ID"
            placeholder="Spotify artist ID"
            value={spotifyId}
            onChange={(e) => setSpotifyId(e.currentTarget.value)}
          />
          <TextInput
            label="YouTube Username"
            placeholder="@username"
            description="Starts with @"
            value={youtubeUsername}
            onChange={(e) => setYoutubeUsername(e.currentTarget.value)}
          />
          <TextInput
            label="TikTok Username"
            placeholder="@username"
            description="Starts with @"
            value={tiktokUsername}
            onChange={(e) => setTiktokUsername(e.currentTarget.value)}
          />
          <TextInput
            label="Instagram Username"
            placeholder="username"
            value={instagramUsername}
            onChange={(e) => setInstagramUsername(e.currentTarget.value)}
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
                  id ? show("my-music/artists", id) : list("my-music/artists")
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
