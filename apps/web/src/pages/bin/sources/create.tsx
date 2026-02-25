import { useForm, useNavigation } from "@refinedev/core";
import {
  Card,
  TextInput,
  Button,
  Group,
  Stack,
  Title,
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { useState } from "react";

export const BinSourceCreate = () => {
  const { list } = useNavigation();

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [nameError, setNameError] = useState("");

  const { onFinish, mutation } = useForm({
    resource: "bin/sources",
    action: "create",
    redirect: "show",
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      setNameError("Name is required");
      return;
    }
    setNameError("");

    const values: Record<string, unknown> = { name: name.trim() };
    if (url.trim()) values.url = url.trim();

    onFinish(values);
  };

  return (
    <>
      <Group mb="md">
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => list("bin/sources")}
        >
          Back to list
        </Button>
      </Group>

      <Title order={3} mb="md">
        Add Bin Source
      </Title>

      <Card withBorder maw={600}>
        <Stack gap="md">
          <TextInput
            label="Name"
            placeholder="Source name"
            required
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            error={nameError || undefined}
          />

          <TextInput
            label="URL"
            placeholder="https://example.com"
            description="Must be a valid URL"
            value={url}
            onChange={(e) => setUrl(e.currentTarget.value)}
          />

          <Group justify="flex-end" mt="sm">
            <Button
              variant="default"
              onClick={() => list("bin/sources")}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={mutation.isPending}
            >
              Save
            </Button>
          </Group>
        </Stack>
      </Card>
    </>
  );
};
