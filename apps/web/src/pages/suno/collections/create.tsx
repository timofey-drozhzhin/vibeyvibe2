import { useState } from "react";
import { useForm, useNavigation } from "@refinedev/core";
import {
  Card,
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  Title,
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";

export const SunoCollectionCreate = () => {
  const { list } = useNavigation();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { onFinish, mutation } = useForm({
    resource: "suno/collections",
    action: "create",
    redirect: "show",
  });

  const handleSubmit = () => {
    if (!name.trim()) return;
    onFinish({
      name: name.trim(),
      description: description || undefined,
    });
  };

  return (
    <Stack>
      <Group>
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => list("suno/collections")}
        >
          Back
        </Button>
        <Title order={3}>Create Collection</Title>
      </Group>

      <Card withBorder padding="lg" style={{ maxWidth: 600 }}>
        <Stack gap="md">
          <TextInput
            label="Name"
            placeholder="Collection name"
            required
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />

          <Textarea
            label="Description"
            placeholder="Optional description..."
            minRows={3}
            autosize
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
          />

          <Group justify="flex-end" mt="md">
            <Button
              variant="default"
              onClick={() => list("suno/collections")}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={mutation.isPending}
              disabled={!name.trim()}
            >
              Save
            </Button>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
};
