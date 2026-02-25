import { useState, useEffect } from "react";
import { useForm, useNavigation } from "@refinedev/core";
import {
  Card,
  Group,
  Stack,
  Title,
  TextInput,
  Textarea,
  Button,
  Loader,
  Center,
  Select,
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { ArchiveButton } from "../../../components/shared/archive-toggle.js";

interface AnatomyAttribute {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  instruction: string | null;
  examples: string | null;
  archived: boolean;
}

export const AnatomyAttributeEdit = () => {
  const { onFinish, mutation, query } = useForm<AnatomyAttribute>({
    resource: "anatomy/attributes",
    action: "edit",
    redirect: "list",
  });
  const { list } = useNavigation();

  const record = query?.data?.data;
  const isLoading = query?.isPending;
  const isSaving = mutation?.isPending;

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [instruction, setInstruction] = useState("");
  const [examples, setExamples] = useState("");
  const [archived, setArchived] = useState(false);

  useEffect(() => {
    if (record) {
      setName(record.name ?? "");
      setCategory(record.category ?? null);
      setDescription(record.description ?? "");
      setInstruction(record.instruction ?? "");
      setExamples(record.examples ?? "");
      setArchived(record.archived ?? false);
    }
  }, [record]);

  if (isLoading) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }

  const handleSubmit = () => {
    onFinish({
      name,
      category: category || null,
      description: description || null,
      instruction: instruction || null,
      examples: examples || null,
    });
  };

  return (
    <Stack gap="md">
      <Group>
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => list("anatomy/attributes")}
        >
          Back
        </Button>
        <Title order={2}>Edit Attribute</Title>
      </Group>

      <Card withBorder style={{ maxWidth: 600 }}>
        <Stack gap="md">
          <TextInput
            label="Name"
            required
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder="e.g. tempo, mood, vocal_style"
            description="Must be unique. Used as the attribute key in profiles."
          />

          <Select
            label="Category"
            value={category}
            onChange={setCategory}
            placeholder="Select category"
            clearable
            data={[
              { value: "genre", label: "Genre" },
              { value: "structure", label: "Structure" },
              { value: "composition", label: "Composition" },
              { value: "rhythm", label: "Rhythm" },
              { value: "instrumentation", label: "Instrumentation" },
              { value: "vocals", label: "Vocals" },
              { value: "lyrics", label: "Lyrics" },
              { value: "production", label: "Production" },
              { value: "mood", label: "Mood" },
              { value: "energy", label: "Energy" },
              { value: "signature", label: "Signature" },
            ]}
          />

          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            placeholder="Brief description of what this attribute represents"
            minRows={2}
            autosize
          />

          <Textarea
            label="Instruction"
            value={instruction}
            onChange={(e) => setInstruction(e.currentTarget.value)}
            placeholder="Detailed instruction for how to determine this attribute's value"
            minRows={4}
            autosize
          />

          <Textarea
            label="Examples"
            value={examples}
            onChange={(e) => setExamples(e.currentTarget.value)}
            placeholder="Example values for this attribute"
            minRows={4}
            autosize
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
                loading={isSaving}
                disabled={!name}
              >
                Save
              </Button>
              <Button variant="subtle" onClick={() => list("anatomy/attributes")}>
                Cancel
              </Button>
            </Group>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
};
