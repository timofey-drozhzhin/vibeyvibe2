import { useState, useEffect } from "react";
import { useList, useCreate, useUpdate } from "@refinedev/core";
import {
  Stack,
  Textarea,
  Text,
  Button,
  Group,
  Loader,
  Center,
  Tooltip,
} from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";

interface AnatomyAttribute {
  id: string;
  name: string;
  description: string | null;
  instruction: string | null;
  examples: string | null;
  archived: boolean;
}

interface ProfileEditorProps {
  songId: string;
  profileId?: string;
  initialValues?: Record<string, string>;
  onSaved?: () => void;
  onCancel?: () => void;
}

export const ProfileEditor = ({
  songId,
  profileId,
  initialValues,
  onSaved,
  onCancel,
}: ProfileEditorProps) => {
  const [values, setValues] = useState<Record<string, string>>({});

  const { query: attributesQuery, result: attributesResult } = useList<AnatomyAttribute>({
    resource: "anatomy/attributes",
    pagination: { pageSize: 100 },
    filters: [{ field: "archived", operator: "eq", value: false }],
  });

  const { mutate: createProfile, mutation: createMutation } = useCreate();
  const { mutate: updateProfile, mutation: updateMutation } = useUpdate();

  const attributes = attributesResult.data ?? [];
  const attributesLoading = attributesQuery.isLoading;

  useEffect(() => {
    if (initialValues) {
      setValues(initialValues);
    }
  }, [initialValues]);

  const handleValueChange = (attributeName: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      [attributeName]: value,
    }));
  };

  const handleSave = () => {
    // Filter out empty values
    const filteredValues: Record<string, string> = {};
    for (const [key, val] of Object.entries(values)) {
      if (val.trim()) {
        filteredValues[key] = val.trim();
      }
    }

    const jsonValue = JSON.stringify(filteredValues);

    if (profileId) {
      updateProfile(
        {
          resource: "anatomy/profiles",
          id: profileId,
          values: { value: jsonValue },
        },
        {
          onSuccess: () => {
            onSaved?.();
          },
        }
      );
    } else {
      createProfile(
        {
          resource: "anatomy/profiles",
          values: { songId, value: jsonValue },
        },
        {
          onSuccess: () => {
            onSaved?.();
          },
        }
      );
    }
  };

  if (attributesLoading) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }

  if (attributes.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="md">
        No attributes defined. Create attributes first in the Anatomy Attributes section.
      </Text>
    );
  }

  return (
    <Stack gap="md">
      {attributes.map((attr: AnatomyAttribute) => (
        <div key={attr.id}>
          <Group gap="xs" mb={4}>
            <Text size="sm" fw={500}>
              {attr.name}
            </Text>
            {attr.instruction && (
              <Tooltip
                label={attr.instruction}
                multiline
                w={300}
                withArrow
                position="right"
              >
                <IconInfoCircle size={16} style={{ opacity: 0.6, cursor: "help" }} />
              </Tooltip>
            )}
          </Group>
          {attr.description && (
            <Text size="xs" c="dimmed" mb={4}>
              {attr.description}
            </Text>
          )}
          <Textarea
            placeholder={
              attr.examples
                ? `e.g. ${attr.examples}`
                : `Enter ${attr.name.toLowerCase()} value...`
            }
            value={values[attr.name] || ""}
            onChange={(e) =>
              handleValueChange(attr.name, e.currentTarget.value)
            }
            minRows={2}
            autosize
          />
        </div>
      ))}

      <Group justify="flex-end" mt="md">
        {onCancel && (
          <Button variant="default" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSave}
          loading={createMutation.isPending || updateMutation.isPending}
        >
          {profileId ? "Update Profile" : "Create Profile"}
        </Button>
      </Group>
    </Stack>
  );
};
