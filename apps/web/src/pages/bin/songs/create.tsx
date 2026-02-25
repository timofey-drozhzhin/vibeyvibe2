import { useForm, useList, useNavigation } from "@refinedev/core";
import {
  Card,
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  Title,
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { useState } from "react";
import { FileUpload } from "../../../components/shared/file-upload.js";

interface BinSource {
  id: number;
  name: string;
}

export const BinSongCreate = () => {
  const { list } = useNavigation();

  const [name, setName] = useState("");
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [assetPath, setAssetPath] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [nameError, setNameError] = useState("");

  const { onFinish, mutation } = useForm({
    resource: "bin/songs",
    action: "create",
    redirect: "show",
  });

  const { result: sourcesResult } = useList<BinSource>({
    resource: "bin/sources",
    pagination: { currentPage: 1, pageSize: 100 },
    filters: [{ field: "archived", operator: "eq", value: false }],
  });

  const sourceOptions = (sourcesResult.data ?? []).map((s: BinSource) => ({
    value: String(s.id),
    label: s.name,
  }));

  const handleSubmit = () => {
    if (!name.trim()) {
      setNameError("Name is required");
      return;
    }
    setNameError("");

    const values: Record<string, unknown> = { name: name.trim() };
    if (sourceId) values.sourceId = Number(sourceId);
    if (assetPath.trim()) values.assetPath = assetPath.trim();
    if (sourceUrl.trim()) values.sourceUrl = sourceUrl.trim();

    onFinish(values);
  };

  return (
    <>
      <Group mb="md">
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => list("bin/songs")}
        >
          Back to list
        </Button>
      </Group>

      <Title order={3} mb="md">
        Add Bin Song
      </Title>

      <Card withBorder maw={600}>
        <Stack gap="md">
          <TextInput
            label="Name"
            placeholder="Song name"
            required
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            error={nameError || undefined}
          />

          <Select
            label="Source"
            placeholder="Select a source (optional)"
            data={sourceOptions}
            value={sourceId}
            onChange={setSourceId}
            clearable
            searchable
          />

          <FileUpload
            label="Asset File"
            value={assetPath}
            onChange={setAssetPath}
            accept="audio/*"
            directory="bin"
            placeholder="Upload audio file"
          />

          <TextInput
            label="Source URL"
            placeholder="https://example.com"
            description="Must be a valid URL"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.currentTarget.value)}
          />

          <Group justify="flex-end" mt="sm">
            <Button
              variant="default"
              onClick={() => list("bin/songs")}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={mutation.status === "pending"}
            >
              Save
            </Button>
          </Group>
        </Stack>
      </Card>
    </>
  );
};
