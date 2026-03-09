import { useState, useEffect, type ReactNode } from "react";
import { useShow, useUpdate, useDelete, useNavigation, useCustomMutation, useGetIdentity } from "@refinedev/core";
import { useLikeToggle } from "../../hooks/use-like-toggle.js";
import { Table, Button, Group, SimpleGrid, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPlayerPlay, IconSparkles, IconRefresh } from "@tabler/icons-react";
import { EntityPage, SectionCard } from "../../components/shared/entity-page.js";
import { FieldRow } from "../../components/generic/field-row.js";
import { AsidePanel } from "../../components/generic/aside-panel.js";
import { RelationshipSection } from "../../components/generic/relationship-section.js";
import type { EntityDef, ShowActionDef } from "../../config/entity-registry.js";
import { getResourceName } from "../../config/entity-registry.js";
import { formatDate } from "../../utils/format-date.js";

interface GenericEntityDetailProps {
  entity: EntityDef;
}

export const GenericEntityDetail = ({ entity }: GenericEntityDetailProps) => {
  const resource = getResourceName(entity);
  const { query: showQuery } = useShow({ resource });
  const { list } = useNavigation();
  const { mutateAsync: updateRecord } = useUpdate();
  const { mutateAsync: deleteRecord } = useDelete();
  const { mutateAsync: customMutate } = useCustomMutation();
  const { data: identity } = useGetIdentity<{ role?: string }>();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toggle: toggleLike } = useLikeToggle(() => showQuery.refetch());

  const record = showQuery?.data?.data;
  const isLoading = showQuery?.isPending;

  // Auto-poll when record has a matching status
  const shouldPoll = !!(
    entity.pollWhileStatus?.length &&
    record?.status &&
    entity.pollWhileStatus.includes(record.status)
  );

  useEffect(() => {
    if (!shouldPoll) return;
    const interval = setInterval(() => showQuery.refetch(), entity.pollInterval ?? 4000);
    return () => clearInterval(interval);
  }, [shouldPoll, showQuery.refetch, entity.pollInterval]);

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

  // -------------------------------------------------------------------------
  // Build section renderers keyed by ID
  // -------------------------------------------------------------------------
  const sectionRenderers: Record<string, () => ReactNode> = {};

  // "details" section
  if (mainFields.length > 0) {
    sectionRenderers["details"] = () => (
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
              <Table.Td fw={500} c="dimmed">Created</Table.Td>
              <Table.Td>{formatDate(record.created_at) || "--"}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td fw={500} c="dimmed">Updated</Table.Td>
              <Table.Td>{formatDate(record.updated_at) || "--"}</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </SectionCard>
    );
  }

  // Relationship sections
  entity.relationships.forEach((rel) => {
    sectionRenderers[rel.subResource] = () => (
      <RelationshipSection
        key={rel.subResource}
        relationship={rel}
        record={record}
        sourceEntity={entity}
        onRefresh={() => showQuery.refetch()}
      />
    );
  });

  // -------------------------------------------------------------------------
  // Determine compact grid vs full-width sections
  // -------------------------------------------------------------------------
  const compactGrid = entity.showLayout?.compactGrid;
  const gridSectionKeys = new Set(compactGrid?.flat() ?? []);
  const allSectionKeys = Object.keys(sectionRenderers);
  const fullWidthKeys = allSectionKeys.filter((k) => !gridSectionKeys.has(k));

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
      liked={entity.enableLikes ? record.liked : undefined}
      onLikeToggle={entity.enableLikes ? () => toggleLike(resource, record.id as number) : undefined}
      onArchiveToggle={async (val) => {
        await updateRecord({
          resource,
          id: record.id,
          values: { archived: val },
        });
        showQuery.refetch();
      }}
      onDelete={
        entity.allowDelete && identity?.role === "admin" && record.archived
          ? async () => {
              await deleteRecord({
                resource,
                id: record.id as number,
                successNotification: false,
              });
              list(resource);
            }
          : undefined
      }
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
      {/* Compact grid sections */}
      {compactGrid && compactGrid.length > 0 && (
        <SimpleGrid cols={{ base: 1, md: compactGrid.length }} spacing="md">
          {compactGrid.map((column, colIdx) => (
            <Stack key={colIdx} gap="md" style={{ minWidth: 0 }}>
              {column.map((sectionKey) => {
                const renderer = sectionRenderers[sectionKey];
                return renderer ? <div key={sectionKey}>{renderer()}</div> : null;
              })}
            </Stack>
          ))}
        </SimpleGrid>
      )}

      {/* Full-width sections (or all sections if no compactGrid) */}
      {fullWidthKeys.map((key) => {
        const renderer = sectionRenderers[key];
        return renderer ? <div key={key}>{renderer()}</div> : null;
      })}
    </EntityPage>
  );
};
