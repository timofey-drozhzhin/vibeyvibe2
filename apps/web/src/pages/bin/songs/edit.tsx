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
import { useState, useEffect } from "react";
import { ArchiveToggle } from "../../../components/shared/archive-toggle.js";

interface BinSource {
  id: number;
  name: string;
}

interface BinSong {
  id: number;
  name: string;
  sourceId: number | null;
  assetPath: string | null;
  sourceUrl: string | null;
  archived: boolean;
}

export const BinSongEdit = () => {
  const { list } = useNavigation();

  const [name, setName] = useState("");
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [assetPath, setAssetPath] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [archived, setArchived] = useState(false);
  const [nameError, setNameError] = useState("");
  const [initialized, setInitialized] = useState(false);

  const { onFinish, mutation, query } = useForm<BinSong>({
    resource: "bin/songs",
    action: "edit",
    redirect: "show",
  });

  const record = query?.data?.data;

  useEffect(() => {
    if (record && !initialized) {
      setName(record.name ?? "");
      setSourceId(record.sourceId ? String(record.sourceId) : null);
      setAssetPath(record.assetPath ?? "");
      setSourceUrl(record.sourceUrl ?? "");
      setArchived(record.archived ?? false);
      setInitialized(true);
    }
  }, [record, initialized]);

  const { result: sourcesResult } = useList<BinSource>({
    resource: "bin/sources",
    pagination: { currentPage: 1, pageSize: 100 },
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

    const values: Record<string, unknown> = {
      name: name.trim(),
      archived,
    };
    if (sourceId) {
      values.sourceId = Number(sourceId);
    } else {
      values.sourceId = null;
    }
    if (assetPath.trim()) {
      values.assetPath = assetPath.trim();
    } else {
      values.assetPath = null;
    }
    if (sourceUrl.trim()) {
      values.sourceUrl = sourceUrl.trim();
    } else {
      values.sourceUrl = null;
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
          onClick={() => list("bin/songs")}
        >
          Back to list
        </Button>
      </Group>

      <Title order={3} mb="md">
        Edit Bin Song
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

          <TextInput
            label="Asset Path"
            placeholder="/path/to/audio.mp3"
            value={assetPath}
            onChange={(e) => setAssetPath(e.currentTarget.value)}
          />

          <TextInput
            label="Source URL"
            placeholder="https://example.com"
            description="Must be a valid URL"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.currentTarget.value)}
          />

          <ArchiveToggle value={archived} onChange={setArchived} />

          <Group justify="flex-end" mt="sm">
            <Button
              variant="default"
              onClick={() => list("bin/songs")}
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
