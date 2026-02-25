import { useState } from "react";
import { useForm, useNavigation } from "@refinedev/core";
import {
  Card,
  TextInput,
  NumberInput,
  Button,
  Group,
  Stack,
  Title,
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";

export const ArtistCreate = () => {
  const { list } = useNavigation();
  const { onFinish, mutation } = useForm({
    resource: "my-music/artists",
    action: "create",
    redirect: "show",
  });

  const [name, setName] = useState("");
  const [isni, setIsni] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [spotifyId, setSpotifyId] = useState("");
  const [youtubeUsername, setYoutubeUsername] = useState("");
  const [tiktokUsername, setTiktokUsername] = useState("");
  const [instagramUsername, setInstagramUsername] = useState("");

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
        <Title order={3}>Create Artist</Title>
      </Group>

      <Card withBorder p="lg" maw={600}>
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
          <TextInput
            label="Image Path"
            placeholder="/path/to/image"
            value={imagePath}
            onChange={(e) => setImagePath(e.currentTarget.value)}
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

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={() => list("my-music/artists")}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={mutation.isPending}
              disabled={!name.trim()}
            >
              Create Artist
            </Button>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
};
