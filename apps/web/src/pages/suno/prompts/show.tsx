import { useShow, useNavigation, useUpdate } from "@refinedev/core";
import {
  Badge,
  Code,
  Text,
  Table,
} from "@mantine/core";
import { RatingField } from "../../../components/shared/rating-field.js";
import { EditableField } from "../../../components/shared/editable-field.js";
import { EntityPage, SectionCard } from "../../../components/shared/entity-page.js";

interface SunoPromptDetail {
  id: string;
  lyrics: string | null;
  style: string | null;
  voiceGender: string | null;
  notes: string | null;
  profileId: string | null;
  rating: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  profile: {
    id: string;
    songId: string;
    value: string;
    archived: boolean;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export const SunoPromptShow = () => {
  const { query: showQuery } = useShow<SunoPromptDetail>({
    resource: "suno/prompts",
  });
  const { list } = useNavigation();
  const { mutateAsync: updateRecord } = useUpdate();

  const record = showQuery?.data?.data;
  const isLoading = showQuery?.isPending;

  // Inline save helper
  const saveField = async (field: string, value: string) => {
    await updateRecord({
      resource: "suno/prompts",
      id: record!.id,
      values: { [field]: value || null },
    });
    showQuery.refetch();
  };

  const handleRatingChange = async (newRating: number) => {
    await updateRecord({
      resource: "suno/prompts",
      id: record!.id,
      values: { rating: newRating },
    });
    showQuery.refetch();
  };

  return (
    <EntityPage
      title={record?.style || "Untitled Prompt"}
      onBack={() => list("suno/prompts")}
      onTitleSave={async (newStyle) => {
        await updateRecord({
          resource: "suno/prompts",
          id: record!.id,
          values: { style: newStyle },
        });
        showQuery.refetch();
      }}
      archived={record?.archived}
      onArchiveToggle={async (val) => {
        await updateRecord({
          resource: "suno/prompts",
          id: record!.id,
          values: { archived: val },
        });
        showQuery.refetch();
      }}
      isLoading={isLoading}
      notFound={!isLoading && !record}
      notFoundMessage="Prompt not found."
    >
      <SectionCard title="Prompt Details">
        <Table>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td fw={600} w={180}>Style</Table.Td>
              <Table.Td>
                <EditableField
                  value={record?.style ?? null}
                  onSave={(v) => saveField("style", v)}
                  placeholder="e.g. pop, rock, jazz..."
                />
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Voice Gender</Table.Td>
              <Table.Td>
                <EditableField
                  value={record?.voiceGender ?? null}
                  onSave={(v) => saveField("voiceGender", v)}
                  placeholder="male, female, or neutral"
                  renderDisplay={(v) => (
                    <Badge variant="light">{v}</Badge>
                  )}
                />
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Rating</Table.Td>
              <Table.Td>
                <RatingField value={record?.rating ?? 0} onChange={handleRatingChange} />
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Notes</Table.Td>
              <Table.Td>
                <EditableField
                  value={record?.notes ?? null}
                  onSave={(v) => saveField("notes", v)}
                  placeholder="Additional notes..."
                />
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Profile ID</Table.Td>
              <Table.Td>
                <Text size="sm">{record?.profileId || "-"}</Text>
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Lyrics</Table.Td>
              <Table.Td>
                <EditableField
                  value={record?.lyrics ?? null}
                  onSave={(v) => saveField("lyrics", v)}
                  placeholder="Enter lyrics..."
                  emptyText="Click to add lyrics"
                  renderDisplay={(v) => (
                    <Code block style={{ whiteSpace: "pre-wrap" }}>{v}</Code>
                  )}
                />
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Created</Table.Td>
              <Table.Td>
                {record?.createdAt
                  ? new Date(record.createdAt).toLocaleString()
                  : "-"}
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Updated</Table.Td>
              <Table.Td>
                {record?.updatedAt
                  ? new Date(record.updatedAt).toLocaleString()
                  : "-"}
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </SectionCard>
    </EntityPage>
  );
};
