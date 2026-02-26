import { useShow, useUpdate, useNavigation } from "@refinedev/core";
import { Table } from "@mantine/core";
import { EntityPage, SectionCard } from "../../components/shared/entity-page.js";
import { FieldRow } from "../../components/generic/field-row.js";
import { AsidePanel } from "../../components/generic/aside-panel.js";
import { RelationshipSection } from "../../components/generic/relationship-section.js";
import type { EntityDef } from "../../config/entity-registry.js";
import { getResourceName } from "../../config/entity-registry.js";

interface GenericEntityDetailProps {
  entity: EntityDef;
}

export const GenericEntityDetail = ({ entity }: GenericEntityDetailProps) => {
  const resource = getResourceName(entity);
  const { query: showQuery } = useShow({ resource });
  const { list } = useNavigation();
  const { mutateAsync: updateRecord } = useUpdate();

  const record = showQuery?.data?.data;
  const isLoading = showQuery?.isPending;

  // Inline save helper
  const saveField = async (field: string, value: any) => {
    await updateRecord({
      resource,
      id: record!.id,
      values: { [field]: value ?? null },
    });
    showQuery.refetch();
  };

  // Determine which fields belong in the aside vs main body
  const asideFieldKeys = new Set(entity.asideFields);

  // Fields for the main details table (exclude aside fields and uid fields)
  const mainFields = entity.fields.filter(
    (f) => !asideFieldKeys.has(f.key) && f.type !== "uid",
  );

  // Fields for the aside panel
  const asideFields = entity.fields.filter((f) => asideFieldKeys.has(f.key));

  const titleField = entity.titleField || "name";

  if (isLoading) {
    return (
      <EntityPage
        title=""
        onBack={() => list(resource)}
        isLoading
      >
        <div />
      </EntityPage>
    );
  }

  if (!record) {
    return (
      <EntityPage
        title=""
        onBack={() => list(resource)}
        notFound
        notFoundMessage={`${entity.name} not found.`}
      >
        <div />
      </EntityPage>
    );
  }

  return (
    <EntityPage
      title={record[titleField] || ""}
      onBack={() => list(resource)}
      onTitleSave={async (newName) => {
        await updateRecord({
          resource,
          id: record.id,
          values: { [titleField]: newName },
        });
        showQuery.refetch();
      }}
      archived={record.archived}
      onArchiveToggle={async (val) => {
        await updateRecord({
          resource,
          id: record.id,
          values: { archived: val },
        });
        showQuery.refetch();
      }}
      rightPanel={
        asideFields.length > 0 ? (
          <AsidePanel
            fields={asideFields}
            record={record}
            onSave={saveField}
            entity={entity}
          />
        ) : undefined
      }
    >
      {/* Main details */}
      {mainFields.length > 0 && (
        <SectionCard title={`${entity.name} Details`}>
          <Table>
            <Table.Tbody>
              {mainFields.map((field) => (
                <FieldRow
                  key={field.key}
                  field={field}
                  value={record[field.key]}
                  onSave={(v) => saveField(field.key, v)}
                  entity={entity}
                  record={record}
                />
              ))}
              <Table.Tr>
                <Table.Td fw={600} w={180}>Created</Table.Td>
                <Table.Td>{record.created_at || "--"}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={600}>Updated</Table.Td>
                <Table.Td>{record.updated_at || "--"}</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </SectionCard>
      )}

      {/* Relationships */}
      {entity.relationships.map((rel) => (
        <RelationshipSection
          key={rel.subResource}
          relationship={rel}
          record={record}
          sourceEntity={entity}
          onRefresh={() => showQuery.refetch()}
        />
      ))}
    </EntityPage>
  );
};
