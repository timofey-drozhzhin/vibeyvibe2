import { useState } from "react";
import { useShow, useUpdate, useNavigation, useCustomMutation } from "@refinedev/core";
import { Table, Button, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPlayerPlay, IconSparkles, IconRefresh } from "@tabler/icons-react";
import { EntityPage, SectionCard } from "../../components/shared/entity-page.js";
import { FieldRow } from "../../components/generic/field-row.js";
import { AsidePanel } from "../../components/generic/aside-panel.js";
import { RelationshipSection } from "../../components/generic/relationship-section.js";
import type { EntityDef, ShowActionDef } from "../../config/entity-registry.js";
import { getResourceName } from "../../config/entity-registry.js";

interface GenericEntityDetailProps {
  entity: EntityDef;
}

export const GenericEntityDetail = ({ entity }: GenericEntityDetailProps) => {
  const resource = getResourceName(entity);
  const { query: showQuery } = useShow({ resource });
  const { list } = useNavigation();
  const { mutateAsync: updateRecord } = useUpdate();
  const { mutateAsync: customMutate } = useCustomMutation();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  // Show action handler
  const handleShowAction = async (action: ShowActionDef) => {
    if (!record) return;
    setActionLoading(action.endpoint);
    try {
      await customMutate({
        url: `${action.endpoint}/${record.id}`,
        method: "post",
        values: {},
        successNotification: false,
        errorNotification: false,
      });
      notifications.show({
        title: "Started",
        message: `${action.label} triggered successfully.`,
        color: "green",
      });
      showQuery.refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Action failed.";
      notifications.show({ title: "Error", message, color: "red" });
    } finally {
      setActionLoading(null);
    }
  };

  const showActionIcon = (icon?: string) => {
    switch (icon) {
      case "play": return <IconPlayerPlay size={14} />;
      case "sparkles": return <IconSparkles size={14} />;
      case "refresh": return <IconRefresh size={14} />;
      default: return <IconPlayerPlay size={14} />;
    }
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
        <SectionCard
          title={`${entity.name} Details`}
          {...(entity.showActions && entity.showActions.length > 0
            ? {
                actions: (
                  <Group gap="xs">
                    {entity.showActions
                      .filter((action) => {
                        if (!action.conditionField || !action.conditionValues) return true;
                        return action.conditionValues.includes(record[action.conditionField]);
                      })
                      .map((action) => (
                        <Button
                          key={action.endpoint}
                          size="xs"
                          variant="light"
                          color={action.color ?? "violet"}
                          leftSection={showActionIcon(action.icon)}
                          loading={actionLoading === action.endpoint}
                          onClick={() => handleShowAction(action)}
                        >
                          {action.label}
                        </Button>
                      ))}
                  </Group>
                ),
              }
            : {})}
        >
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
