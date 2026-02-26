import { useShow, useNavigation, useUpdate } from "@refinedev/core";
import {
  Anchor,
  Text,
  Table,
} from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";
import { EditableField } from "../../../components/shared/editable-field.js";
import { EntityPage, SectionCard } from "../../../components/shared/entity-page.js";

interface BinSource {
  id: string;
  name: string;
  url: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export const BinSourceShow = () => {
  const { query: showQuery } = useShow<BinSource>({
    resource: "bin/sources",
  });
  const { list } = useNavigation();
  const { mutateAsync: updateRecord } = useUpdate();

  const record = showQuery?.data?.data;
  const isLoading = showQuery?.isPending;

  // Inline save helper
  const saveField = async (field: string, value: string) => {
    await updateRecord({
      resource: "bin/sources",
      id: record!.id,
      values: { [field]: value || null },
    });
    showQuery.refetch();
  };

  return (
    <EntityPage
      title={record?.name ?? ""}
      onBack={() => list("bin/sources")}
      onTitleSave={async (newTitle) => {
        await updateRecord({
          resource: "bin/sources",
          id: record!.id,
          values: { name: newTitle },
        });
        showQuery.refetch();
      }}
      archived={record?.archived}
      onArchiveToggle={async (val) => {
        await updateRecord({
          resource: "bin/sources",
          id: record!.id,
          values: { archived: val },
        });
        showQuery.refetch();
      }}
      isLoading={isLoading}
      notFound={!isLoading && !record}
      notFoundMessage="Source not found."
    >
      {/* Source Details */}
      <SectionCard title="Source Details">
        <Table>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td fw={600} w={180}>URL</Table.Td>
              <Table.Td>
                <EditableField
                  value={record?.url ?? null}
                  onSave={(v) => saveField("url", v)}
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
    </EntityPage>
  );
};
