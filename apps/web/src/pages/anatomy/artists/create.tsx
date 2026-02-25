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

export const AnatomyArtistCreate = () => {
  const { list } = useNavigation();
  const { onFinish, mutation } = useForm({
    resource: "anatomy/artists",
    action: "create",
    redirect: "show",
  });

  const [name, setName] = useState("");
  const [isni, setIsni] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [rating, setRating] = useState<number>(0);

  const handleSubmit = () => {
    onFinish({
      name,
      isni,
      imagePath: imagePath || null,
      rating,
    });
  };

  return (
    <Stack>
      <Group>
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => list("anatomy/artists")}
        >
          Back
        </Button>
        <Title order={3}>Add Anatomy Artist</Title>
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
            placeholder="16-digit ISNI"
            description="International Standard Name Identifier"
            required
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

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={() => list("anatomy/artists")}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={mutation.isPending}
              disabled={!name.trim() || !isni.trim()}
            >
              Create Artist
            </Button>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
};
