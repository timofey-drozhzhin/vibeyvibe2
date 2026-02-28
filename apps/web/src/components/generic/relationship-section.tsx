import { useState, useMemo } from "react";
import {
  Table,
  Text,
  Anchor,
  ActionIcon,
  Tooltip,
  Badge,
  Button,
  Group,
  Modal,
  ScrollArea,
  Stack,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useNavigation, useCustomMutation } from "@refinedev/core";
import { notifications } from "@mantine/notifications";
import {
  IconUnlink,
  IconPlus,
  IconSparkles,
  IconMusic,
  IconTrash,
  IconEye,
  IconArchive,
} from "@tabler/icons-react";
import { SectionCard } from "../shared/entity-page.js";
import { AssignModal } from "../shared/assign-modal.js";
import { RatingDisplay } from "../shared/rating-field.js";
import { EditableField } from "../shared/editable-field.js";
import type {
  RelationshipDef,
  EntityDef,
  GenerateActionDef,
  RowActionDef,
} from "../../config/entity-registry.js";
import {
  resolveRelationshipTarget,
  getResourceName,
} from "../../config/entity-registry.js";

interface RelationshipSectionProps {
  relationship: RelationshipDef;
  record: any;
  sourceEntity: EntityDef;
  onRefresh: () => void;
}

export const RelationshipSection = ({
  relationship,
  record,
  sourceEntity,
  onRefresh,
}: RelationshipSectionProps) => {
  const { show } = useNavigation();
  const [assignOpened, { open: openAssign, close: closeAssign }] =
    useDisclosure(false);
  const [removingId, setRemovingId] = useState<string | number | null>(null);
  const [generatingIdx, setGeneratingIdx] = useState<number | null>(null);
  const [rowGeneratingId, setRowGeneratingId] = useState<string | number | null>(null);
  const [archivingId, setArchivingId] = useState<string | number | null>(null);
  const [viewModalData, setViewModalData] = useState<any[] | null>(null);
  const [showAll, setShowAll] = useState(false);
  const { mutateAsync } = useCustomMutation();

  // Normalize generateAction to always be an array
  const generateActions: GenerateActionDef[] = useMemo(() => {
    if (!relationship.generateAction) return [];
    return Array.isArray(relationship.generateAction)
      ? relationship.generateAction
      : [relationship.generateAction];
  }, [relationship.generateAction]);

  const sourceResource = getResourceName(sourceEntity);
  const targetEntity = resolveRelationshipTarget(
    sourceEntity,
    relationship.target,
  );
  const targetResource = targetEntity ? getResourceName(targetEntity) : "";
  const labelField = relationship.targetLabelField || "name";

  // Determine which columns are payload (editable pivot data)
  const payloadKeys = useMemo(
    () => new Set(relationship.payloadFields?.map((pf) => pf.key) ?? []),
    [relationship.payloadFields],
  );

  // Get related items from the record, apply maxItems limit
  const allItems: any[] = record[relationship.subResource] ?? [];
  const hasMore = relationship.maxItems != null && allItems.length > relationship.maxItems;
  const items = hasMore && !showAll ? allItems.slice(0, relationship.maxItems!) : allItems;

  // Check if this relationship has row actions or archivable
  const hasRowActions = (relationship.rowActions?.length ?? 0) > 0;
  const actionsColWidth = relationship.archivable || relationship.removeAction
    ? 60 + (hasRowActions ? (relationship.rowActions!.length * 36) : 0)
    : hasRowActions ? (relationship.rowActions!.length * 36) : 60;

  const handleRemove = async (relatedId: string | number) => {
    setRemovingId(relatedId);
    try {
      await mutateAsync({
        url: `/api/${sourceResource}/${record.id}/${relationship.subResource}/${relatedId}`,
        method: "put",
        values: {},
        successNotification: false,
        errorNotification: false,
      });
      notifications.show({
        title: relationship.removeAction?.type === "delete" ? "Deleted" : "Removed",
        message: relationship.removeAction?.type === "delete"
          ? `${relationship.label.replace(/s$/, "")} deleted.`
          : `${relationship.label} assignment removed.`,
        color: "green",
      });
      onRefresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to remove assignment.";
      notifications.show({ title: "Error", message, color: "red" });
    } finally {
      setRemovingId(null);
    }
  };

  const handleGenerate = async (action: GenerateActionDef, idx: number) => {
    setGeneratingIdx(idx);
    try {
      const result = await mutateAsync({
        url: action.endpoint,
        method: "post",
        values: { [action.bodyField]: record.id },
        successNotification: false,
        errorNotification: false,
      });
      if (action.successNavigate && result?.data?.data?.id) {
        notifications.show({
          title: "Generated",
          message: `${action.label} created successfully. Navigating...`,
          color: "green",
        });
        show(action.successNavigate, result.data.data.id);
      } else {
        notifications.show({
          title: "Generated",
          message: `${relationship.label.replace(/s$/, "")} generated successfully.`,
          color: "green",
        });
        onRefresh();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Generation failed. Please try again.";
      notifications.show({
        title: "Error",
        message,
        color: "red",
      });
    } finally {
      setGeneratingIdx(null);
    }
  };

  const handleViewJson = (item: any, viewField: string) => {
    try {
      const parsed = typeof item[viewField] === "string"
        ? JSON.parse(item[viewField])
        : item[viewField];
      setViewModalData(Array.isArray(parsed) ? parsed : [parsed]);
    } catch {
      setViewModalData([{ value: item[viewField] }]);
    }
  };

  const handleRowAction = async (action: RowActionDef, item: any) => {
    if (action.type === "view-json" && action.viewField) {
      handleViewJson(item, action.viewField);
      return;
    }

    if (action.type === "generate" && action.endpoint && action.bodyField) {
      setRowGeneratingId(item.id);
      try {
        const result = await mutateAsync({
          url: action.endpoint,
          method: "post",
          values: { [action.bodyField]: item.id },
          successNotification: false,
          errorNotification: false,
        });
        if (action.successNavigate && result?.data?.data?.id) {
          notifications.show({
            title: "Generated",
            message: `${action.label} created successfully. Navigating...`,
            color: "green",
          });
          show(action.successNavigate, result.data.data.id);
        } else {
          notifications.show({
            title: "Generated",
            message: `${action.label} generated successfully.`,
            color: "green",
          });
          onRefresh();
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Generation failed. Please try again.";
        notifications.show({ title: "Error", message, color: "red" });
      } finally {
        setRowGeneratingId(null);
      }
    }
  };

  const handleArchive = async (itemId: string | number) => {
    if (!relationship.archiveEndpoint) return;
    setArchivingId(itemId);
    try {
      await mutateAsync({
        url: `${relationship.archiveEndpoint}/${itemId}`,
        method: "put",
        values: { archived: true },
        successNotification: false,
        errorNotification: false,
      });
      notifications.show({
        title: "Archived",
        message: `${relationship.label.replace(/s$/, "")} archived.`,
        color: "green",
      });
      onRefresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to archive.";
      notifications.show({ title: "Error", message, color: "red" });
    } finally {
      setArchivingId(null);
    }
  };

  const handlePayloadUpdate = async (
    relatedId: string | number,
    fieldKey: string,
    newValue: string,
  ) => {
    try {
      await mutateAsync({
        url: `/api/${sourceResource}/${record.id}/${relationship.subResource}/${relatedId}`,
        method: "put",
        values: { [fieldKey]: newValue },
        successNotification: false,
        errorNotification: false,
      });
      notifications.show({
        title: "Updated",
        message: "Value updated successfully.",
        color: "green",
      });
      onRefresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update.";
      notifications.show({ title: "Error", message, color: "red" });
      throw err;
    }
  };

  const rowActionIcon = (icon: string) => {
    switch (icon) {
      case "eye": return <IconEye size={16} />;
      case "music": return <IconMusic size={16} />;
      case "sparkles": return <IconSparkles size={16} />;
      default: return <IconEye size={16} />;
    }
  };

  return (
    <>
      <SectionCard
        title={relationship.label}
        {...(generateActions.length > 0
          ? {
              actions: (
                <Group gap="xs">
                  {generateActions.map((action, idx) => {
                    const ActionIcon_ =
                      action.icon === "music" ? IconMusic : IconSparkles;
                    return (
                      <Button
                        key={idx}
                        size="xs"
                        variant="light"
                        color={action.color ?? "violet"}
                        leftSection={<ActionIcon_ size={14} />}
                        loading={generatingIdx === idx}
                        disabled={generatingIdx !== null && generatingIdx !== idx}
                        onClick={() => handleGenerate(action, idx)}
                      >
                        {action.label}
                      </Button>
                    );
                  })}
                  {!relationship.hideAssign && (
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconPlus size={14} />}
                      onClick={openAssign}
                    >
                      {`Assign ${relationship.label.replace(/s$/, "")}`}
                    </Button>
                  )}
                  {hasMore && (
                    <Button
                      size="xs"
                      variant="subtle"
                      onClick={() => setShowAll((v) => !v)}
                    >
                      {showAll ? "See less" : `See all (${allItems.length})`}
                    </Button>
                  )}
                </Group>
              ),
            }
          : relationship.hideAssign
            ? {}
            : {
                action: {
                  label: `Assign ${relationship.label.replace(/s$/, "")}`,
                  onClick: openAssign,
                },
              })}
      >
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              {relationship.columns.map((col) => (
                <Table.Th key={col.key}>{col.label}</Table.Th>
              ))}
              <Table.Th w={actionsColWidth}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={relationship.columns.length + 1}>
                  <Text c="dimmed" ta="center" py="md">
                    No {relationship.label.toLowerCase()} yet.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {items.map((item) => (
              <Table.Tr key={item.id}>
                {relationship.columns.map((col) => (
                  <Table.Td key={col.key}>
                    {payloadKeys.has(col.key) ? (
                      <EditableField
                        value={item[col.key] ?? ""}
                        onSave={(newValue) =>
                          handlePayloadUpdate(item.id, col.key, newValue)
                        }
                      />
                    ) : col.action?.type === "view-json" && col.action.viewField ? (
                      <Anchor
                        size="sm"
                        onClick={() => handleViewJson(item, col.action!.viewField!)}
                      >
                        {renderColumnText(col, item[col.key])}
                      </Anchor>
                    ) : col.key === "name" && targetResource ? (
                      <Anchor
                        size="sm"
                        fw={500}
                        onClick={() => show(targetResource, item.id)}
                      >
                        {item[col.key] != null ? String(item[col.key]) : ""}
                      </Anchor>
                    ) : (
                      renderColumnValue(col, item[col.key])
                    )}
                  </Table.Td>
                ))}
                <Table.Td>
                  <Group gap={4} wrap="nowrap">
                    {/* Row actions */}
                    {relationship.rowActions?.map((action, idx) => (
                      <Tooltip key={idx} label={action.label}>
                        <ActionIcon
                          variant="subtle"
                          color={action.color ?? "gray"}
                          loading={action.type === "generate" && rowGeneratingId === item.id}
                          onClick={() => handleRowAction(action, item)}
                        >
                          {rowActionIcon(action.icon)}
                        </ActionIcon>
                      </Tooltip>
                    ))}
                    {/* Archive action */}
                    {relationship.archivable && relationship.archiveEndpoint && (
                      <Tooltip label="Archive">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          loading={archivingId === item.id}
                          onClick={() => handleArchive(item.id)}
                        >
                          <IconArchive size={16} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                    {/* Remove/unlink action (for M:N relationships) */}
                    {relationship.removeAction && (
                      <Tooltip
                        label={relationship.removeAction.label ?? `Remove from ${sourceEntity.name.toLowerCase()}`}
                      >
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          loading={removingId === item.id}
                          onClick={() => handleRemove(item.id)}
                        >
                          {relationship.removeAction.type === "delete" ? (
                            <IconTrash size={16} />
                          ) : (
                            <IconUnlink size={16} />
                          )}
                        </ActionIcon>
                      </Tooltip>
                    )}
                    {/* Default remove for relationships without explicit removeAction or archivable */}
                    {!relationship.removeAction && !relationship.archivable && !hasRowActions && (
                      <Tooltip label={`Remove from ${sourceEntity.name.toLowerCase()}`}>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          loading={removingId === item.id}
                          onClick={() => handleRemove(item.id)}
                        >
                          <IconUnlink size={16} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </SectionCard>

      {record.id && !relationship.hideAssign && (
        <AssignModal
          opened={assignOpened}
          onClose={closeAssign}
          title={`Assign ${relationship.label.replace(/s$/, "")}`}
          resource={targetResource}
          assignUrl={`/api/${sourceResource}/${record.id}/${relationship.subResource}`}
          fieldName={relationship.assignFieldName}
          labelField={labelField}
          onSuccess={onRefresh}
          payloadFields={relationship.payloadFields}
        />
      )}

      {/* View JSON Modal */}
      <Modal
        opened={viewModalData !== null}
        onClose={() => setViewModalData(null)}
        title="Profile Details"
        size="lg"
      >
        {viewModalData && (
          <ScrollArea h={400}>
            <Stack gap="xs">
              {viewModalData.map((entry: any, idx: number) => (
                <div key={idx} style={{ borderBottom: idx < viewModalData.length - 1 ? '1px solid var(--mantine-color-dark-4)' : undefined, paddingBottom: 8 }}>
                  <Group gap="xs" mb={4}>
                    <Text size="sm" fw={600}>{entry.name || `Entry ${idx + 1}`}</Text>
                    {entry.category && <Badge size="xs">{entry.category}</Badge>}
                  </Group>
                  <Text size="sm" c="dimmed" style={{ whiteSpace: "pre-wrap" }}>
                    {entry.value || "—"}
                  </Text>
                </div>
              ))}
            </Stack>
          </ScrollArea>
        )}
      </Modal>
    </>
  );
};

// ---------------------------------------------------------------------------
// Column Value Renderer
// ---------------------------------------------------------------------------

function renderColumnValue(
  col: { key: string; label: string; type?: string },
  value: any,
): React.ReactNode {
  switch (col.type) {
    case "rating":
      return <RatingDisplay value={value ?? 0} />;
    case "badge":
      return value ? <Badge size="sm">{String(value)}</Badge> : null;
    case "date":
      return <Text size="sm">{value || ""}</Text>;
    case "text":
    default:
      return <Text size="sm" fw={col.key === "name" ? 500 : undefined}>{value != null ? String(value) : ""}</Text>;
  }
}

/** Returns a plain string for use inside an <Anchor> — no wrapping element. */
function renderColumnText(
  col: { key: string; label: string; type?: string },
  value: any,
): string {
  return value != null ? String(value) : "";
}
