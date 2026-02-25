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
import { useState, useEffect } from "react";
import { ArchiveToggle } from "../../../components/shared/archive-toggle.js";

interface BinSource {
  id: number;
  name: string;
  url: string | null;
  archived: boolean;
}

export const BinSourceEdit = () => {
  const { list } = useNavigation();

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [archived, setArchived] = useState(false);
  const [nameError, setNameError] = useState("");
  const [initialized, setInitialized] = useState(false);

  const { onFinish, mutation, query } = useForm<BinSource>({
    resource: "bin/sources",
    action: "edit",
    redirect: "show",
  });

  const record = query?.data?.data;

  useEffect(() => {
    if (record && !initialized) {
      setName(record.name ?? "");
      setUrl(record.url ?? "");
      setArchived(record.archived ?? false);
      setInitialized(true);
    }
  }, [record, initialized]);

  const handleSubmit = () => {
    if (!name.trim()) {
      setNameError("Name is required");
      return;
    }
    setNameError("");

    const values: Record<string, unknown> = {
      name: name.trim(),
      archived,
    };
    if (url.trim()) {
      values.url = url.trim();
    } else {
      values.url = null;
    }

    onFinish(values);
  };

  if (query?.isLoading) {
    return <Title order={3}>Loading...</Title>;
  }

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
        Edit Bin Source
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

          <ArchiveToggle value={archived} onChange={setArchived} />

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
