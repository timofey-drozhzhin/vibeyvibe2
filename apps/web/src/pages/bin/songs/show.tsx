import { useShow, useNavigation, useUpdate, useList } from "@refinedev/core";
import {
  Anchor,
  Text,
  Table,
  Select,
} from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";
import { AudioPlayer } from "../../../components/shared/audio-player.js";
import { EditableField } from "../../../components/shared/editable-field.js";
import { EntityPage, SectionCard } from "../../../components/shared/entity-page.js";
import { FileUpload } from "../../../components/shared/file-upload.js";

interface BinSource {
  id: string;
  name: string;
}

interface BinSong {
  id: string;
  name: string;
  sourceId: string | null;
  assetPath: string | null;
  sourceUrl: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  source?: { id: string; name: string } | null;
}

export const BinSongShow = () => {
  const { query: showQuery } = useShow<BinSong>({
    resource: "bin/songs",
  });
  const { list } = useNavigation();
  const { mutateAsync: updateRecord } = useUpdate();

  const record = showQuery?.data?.data;
  const isLoading = showQuery?.isPending;

  // Fetch sources for the inline dropdown
  const { result: sourcesResult } = useList<BinSource>({
    resource: "bin/sources",
    pagination: { pageSize: 100 },
    filters: [{ field: "archived", operator: "eq", value: false }],
  });

  const sourceOptions = (sourcesResult.data ?? []).map((s: BinSource) => ({
    value: s.id,
    label: s.name,
  }));

  // Inline save helper
  const saveField = async (field: string, value: string) => {
    await updateRecord({
      resource: "bin/songs",
      id: record!.id,
      values: { [field]: value || null },
    });
    showQuery.refetch();
  };

  return (
    <EntityPage
      title={record?.name ?? ""}
      onBack={() => list("bin/songs")}
      onTitleSave={async (newTitle) => {
        await updateRecord({
          resource: "bin/songs",
          id: record!.id,
          values: { name: newTitle },
        });
        showQuery.refetch();
      }}
      archived={record?.archived}
      onArchiveToggle={async (val) => {
        await updateRecord({
          resource: "bin/songs",
          id: record!.id,
          values: { archived: val },
        });
        showQuery.refetch();
      }}
      isLoading={isLoading}
      notFound={!isLoading && !record}
      notFoundMessage="Song not found."
    >
      {/* Song Details */}
      <SectionCard title="Song Details">
        <Table>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td fw={600} w={180}>Source</Table.Td>
              <Table.Td>
                <Select
                  placeholder="Select a source"
                  data={sourceOptions}
                  value={record?.sourceId || null}
                  onChange={async (sourceId) => {
                    await updateRecord({
                      resource: "bin/songs",
                      id: record!.id,
                      values: { sourceId: sourceId || null },
                    });
                    showQuery.refetch();
                  }}
                  clearable
                  searchable
                />
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Source URL</Table.Td>
              <Table.Td>
                <EditableField
                  value={record?.sourceUrl ?? null}
                  onSave={(v) => saveField("sourceUrl", v)}
                  placeholder="https://..."
                  emptyText="Click to add"
                  renderDisplay={(v) => (
                    <Anchor
                      href={v}
                      target="_blank"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {v} <IconExternalLink size={14} style={{ verticalAlign: "middle" }} />
                    </Anchor>
                  )}
                />
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Created</Table.Td>
              <Table.Td>{record?.createdAt}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={600}>Updated</Table.Td>
              <Table.Td>{record?.updatedAt}</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </SectionCard>

      {/* Audio Player */}
      <SectionCard title="Audio">
        <AudioPlayer path={record?.assetPath ?? null} />
        <FileUpload
          value={record?.assetPath ?? ""}
          onChange={(path) => saveField("assetPath", path)}
          accept="audio/*"
          directory="bin"
          placeholder="Upload audio file"
        />
      </SectionCard>
    </EntityPage>
  );
};
