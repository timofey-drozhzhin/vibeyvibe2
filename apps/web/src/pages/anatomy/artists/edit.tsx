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

export const AnatomyArtistEdit = () => {
  const { list, show } = useNavigation();
  const { onFinish, mutation, query, id, formLoading } = useForm({
    resource: "anatomy/artists",
    action: "edit",
    redirect: "show",
  });

  const record = query?.data?.data;

  const [name, setName] = useState("");
  const [isni, setIsni] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [archived, setArchived] = useState(false);

  useEffect(() => {
    if (record) {
      setName(record.name ?? "");
      setIsni(record.isni ?? "");
      setImagePath(record.imagePath ?? "");
      setRating(record.rating ?? 0);
      setArchived(record.archived ?? false);
    }
  }, [record]);

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
        <Title order={3}>Edit Anatomy Artist</Title>
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
                disabled={!name.trim() || !isni.trim()}
              >
                Save
              </Button>
              <Button
                variant="subtle"
                onClick={() =>
                  id ? show("anatomy/artists", id) : list("anatomy/artists")
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
