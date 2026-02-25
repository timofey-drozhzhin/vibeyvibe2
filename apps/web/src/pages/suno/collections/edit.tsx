import { useEffect, useState } from "react";
import { useForm, useNavigation } from "@refinedev/core";
import {
  Card,
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  Title,
  LoadingOverlay,
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { ArchiveButton } from "../../../components/shared/archive-toggle.js";

export const SunoCollectionEdit = () => {
  const { list, show } = useNavigation();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [archived, setArchived] = useState(false);

  const { onFinish, mutation, query } = useForm({
    resource: "suno/collections",
    action: "edit",
    redirect: "show",
  });

  const record = query?.data?.data;

  useEffect(() => {
    if (record) {
      setName(record.name ?? "");
      setDescription(record.description ?? "");
      setArchived(record.archived ?? false);
    }
  }, [record]);

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
        <Title order={3}>Edit Collection</Title>
      </Group>

      <Card withBorder padding="lg" style={{ maxWidth: 600, position: "relative" }}>
        <LoadingOverlay visible={query?.isLoading ?? false} />
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
                onClick={() => record?.id ? show("suno/collections", record.id) : list("suno/collections")}
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
