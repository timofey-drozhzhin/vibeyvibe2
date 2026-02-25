import { useShow, useNavigation } from "@refinedev/core";
import {
  Card,
  Button,
  Group,
  Stack,
  Title,
  Text,
  Badge,
  Code,
  LoadingOverlay,
} from "@mantine/core";
import { IconArrowLeft, IconEdit } from "@tabler/icons-react";
import { RatingDisplay } from "../../../components/shared/rating-field.js";
import { ArchiveBadge } from "../../../components/shared/archive-toggle.js";

export const SunoPromptShow = () => {
  const { list, edit } = useNavigation();
  const { query } = useShow({ resource: "suno/prompts" });
  const record = query?.data?.data;
  const isLoading = query?.isLoading ?? false;

  return (
    <Stack>
      <Group justify="space-between">
        <Group>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => list("suno/prompts")}
          >
            Back
          </Button>
          <Title order={3}>Prompt Detail</Title>
        </Group>
        {record && (
          <Button
            leftSection={<IconEdit size={16} />}
            variant="default"
            onClick={() => record.id && edit("suno/prompts", record.id)}
          >
            Edit
          </Button>
        )}
      </Group>

      <Card withBorder padding="lg" style={{ position: "relative" }}>
        <LoadingOverlay visible={isLoading} />
        {record && (
          <Stack gap="md">
            <Group gap="sm">
              <ArchiveBadge archived={record.archived} />
              {!record.archived && (
                <Badge color="green" variant="light">
                  Active
                </Badge>
              )}
            </Group>

            <div>
              <Text size="sm" fw={500} c="dimmed">
                Style
              </Text>
              <Text>{record.style || "-"}</Text>
            </div>

            <div>
              <Text size="sm" fw={500} c="dimmed">
                Voice Gender
              </Text>
              {record.voiceGender ? (
                <Badge variant="light">{record.voiceGender}</Badge>
              ) : (
                <Text c="dimmed">-</Text>
              )}
            </div>

            <div>
              <Text size="sm" fw={500} c="dimmed">
                Rating
              </Text>
              <RatingDisplay value={record.rating ?? 0} />
            </div>

            <div>
              <Text size="sm" fw={500} c="dimmed">
                Lyrics
              </Text>
              {record.lyrics ? (
                <Code block style={{ whiteSpace: "pre-wrap" }}>
                  {record.lyrics}
                </Code>
              ) : (
                <Text c="dimmed">-</Text>
              )}
            </div>

            <div>
              <Text size="sm" fw={500} c="dimmed">
                Notes
              </Text>
              <Text>{record.notes || "-"}</Text>
            </div>

            <div>
              <Text size="sm" fw={500} c="dimmed">
                Profile ID
              </Text>
              <Text>{record.profileId || "-"}</Text>
            </div>

            <div>
              <Text size="sm" fw={500} c="dimmed">
                Created
              </Text>
              <Text size="sm">
                {record.createdAt
                  ? new Date(record.createdAt).toLocaleString()
                  : "-"}
              </Text>
            </div>

            <div>
              <Text size="sm" fw={500} c="dimmed">
                Updated
              </Text>
              <Text size="sm">
                {record.updatedAt
                  ? new Date(record.updatedAt).toLocaleString()
                  : "-"}
              </Text>
            </div>
          </Stack>
        )}
      </Card>
    </Stack>
  );
};
