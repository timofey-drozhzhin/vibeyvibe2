import { useState, useMemo, useEffect, useCallback } from "react";
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
  Textarea,
  Select,
  Checkbox,
  Title,
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
  IconPencil,
  IconGitCompare,
} from "@tabler/icons-react";
import { SectionCard } from "../shared/entity-page.js";
import { formatDate } from "../../utils/format-date.js";
import { AssignModal } from "../shared/assign-modal.js";
import { ArtistCardList } from "./artist-card-list.js";
import { AlbumCardList } from "./album-card-list.js";
import { RatingDisplay } from "../shared/rating-field.js";
import { EditableField } from "../shared/editable-field.js";
import { CompareModal } from "../shared/compare-modal.js";
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
import { useVibesMetadata, type VibesMetadata } from "../../hooks/use-vibes-metadata.js";

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
  const [viewModalItem, setViewModalItem] = useState<any | null>(null);
  const [editModalData, setEditModalData] = useState<{ entries: any[]; itemId: string | number; endpoint: string } | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [compareOpened, { open: openCompare, close: closeCompare }] = useDisclosure(false);
  const { mutateAsync } = useCustomMutation();
  const vibesMeta = useVibesMetadata();

  // Normalize generateAction to always be an array
  const generateActions: GenerateActionDef[] = useMemo(() => {
    if (!relationship.generateAction) return [];
    return Array.isArray(relationship.generateAction)
      ? relationship.generateAction
      : [relationship.generateAction];
  }, [relationship.generateAction]);

  // Model selection state — keyed by generate action index
  const [modelSelections, setModelSelections] = useState<Record<number, string>>({});
  const [availableModels, setAvailableModels] = useState<Record<number, string[]>>({});

  // Fetch models for generate actions that have modelsEndpoint
  useEffect(() => {
    generateActions.forEach((action, idx) => {
      if (!action.modelsEndpoint) return;
      fetch(action.modelsEndpoint)
        .then((res) => res.json())
        .then((json) => {
          const models: string[] = json.data ?? [];
          setAvailableModels((prev) => ({ ...prev, [idx]: models }));
          if (models.length > 0) {
            setModelSelections((prev) => prev[idx] ? prev : { ...prev, [idx]: models[0] });
          }
        })
        .catch(() => {});
    });
  }, [generateActions.map((a) => a.modelsEndpoint).join(",")]);

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

  // Auto-poll while any items have the configured processing status
  const stableRefresh = useCallback(() => onRefresh(), [onRefresh]);
  const hasProcessingItems = useMemo(() => {
    if (!relationship.pollWhileStatus) return false;
    return allItems.some((item: any) => item.status === relationship.pollWhileStatus);
  }, [allItems, relationship.pollWhileStatus]);

  useEffect(() => {
    if (!hasProcessingItems) return;
    const interval = setInterval(stableRefresh, relationship.pollInterval ?? 4000);
    return () => clearInterval(interval);
  }, [hasProcessingItems, stableRefresh, relationship.pollInterval]);

  const isReadOnly = relationship.readOnly === true;

  // Check if this relationship has row actions or archivable
  const hasRowActions = (relationship.rowActions?.length ?? 0) > 0;
  const actionsColWidth = relationship.archivable || relationship.removeAction
    ? 60 + (hasRowActions ? (relationship.rowActions!.length * 36) : 0)
    : hasRowActions ? (relationship.rowActions!.length * 36) : 60;

  // Compare action
  const hasCompareAction = !!relationship.compareAction;
  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds],
  );

  const toggleSelect = useCallback((id: string | number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((item) => item.id)));
    }
  }, [items, selectedIds.size]);

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
      const values: Record<string, any> = { [action.bodyField]: record.id };
      if (action.modelsEndpoint && modelSelections[idx]) {
        values.model = modelSelections[idx];
      }
      const result = await mutateAsync({
        url: action.endpoint,
        method: "post",
        values,
        successNotification: false,
        errorNotification: false,
      });
      if (action.successNavigate && result?.data?.data?.id) {
        const targetPath = `/${action.successNavigate}/show/${result.data.data.id}`;
        notifications.show({
          title: "Generated",
          message: (
            <Anchor size="sm" href={targetPath} onClick={(e: React.MouseEvent) => { e.preventDefault(); show(action.successNavigate!, result.data.data.id); }}>
              {action.label} created — view it here
            </Anchor>
          ),
          color: "green",
          autoClose: 8000,
        });
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
    if (hasCompareAction) {
      setViewModalItem(item);
      return;
    }
    try {
      const parsed = typeof item[viewField] === "string"
        ? JSON.parse(item[viewField])
        : item[viewField];
      setViewModalData(Array.isArray(parsed) ? parsed : [parsed]);
    } catch {
      setViewModalData([{ value: item[viewField] }]);
    }
  };

  const handleEditJson = (action: RowActionDef, item: any) => {
    if (!action.viewField || !action.editEndpoint) return;
    try {
      const parsed = typeof item[action.viewField] === "string"
        ? JSON.parse(item[action.viewField])
        : item[action.viewField];
      const entries = Array.isArray(parsed) ? parsed : [parsed];
      setEditModalData({ entries: entries.map((e: any) => ({ ...e })), itemId: item.id, endpoint: action.editEndpoint! });
    } catch {
      notifications.show({ title: "Error", message: "Could not parse data for editing.", color: "red" });
    }
  };

  const handleEditSave = async () => {
    if (!editModalData) return;
    setEditSaving(true);
    try {
      await mutateAsync({
        url: `${editModalData.endpoint}/${editModalData.itemId}`,
        method: "put",
        values: { value: JSON.stringify(editModalData.entries) },
        successNotification: false,
        errorNotification: false,
      });
      notifications.show({ title: "Updated", message: "Profile updated successfully.", color: "green" });
      setEditModalData(null);
      onRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save.";
      notifications.show({ title: "Error", message, color: "red" });
    } finally {
      setEditSaving(false);
    }
  };

  const handleRowAction = async (action: RowActionDef, item: any) => {
    if (action.type === "view-json" && action.viewField) {
      handleViewJson(item, action.viewField);
      return;
    }

    if (action.type === "edit-json") {
      handleEditJson(action, item);
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
          const targetPath = `/${action.successNavigate}/show/${result.data.data.id}`;
          notifications.show({
            title: "Generated",
            message: (
              <Anchor size="sm" href={targetPath} onClick={(e: React.MouseEvent) => { e.preventDefault(); show(action.successNavigate!, result.data.data.id); }}>
                {action.label} created — view it here
              </Anchor>
            ),
            color: "green",
            autoClose: 8000,
          });
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
      case "pencil": return <IconPencil size={16} />;
      default: return <IconEye size={16} />;
    }
  };

  // Resolve target entity image column for cards mode
  const targetImageCol = targetEntity
    ? targetEntity.fields.find(
        (f) => targetEntity.listColumns.includes(f.key) && f.type === "image",
      )?.key
    : undefined;

  // Shared header actions for both cards and table modes
  const headerActions = (
    <Group gap="xs">
      {hasCompareAction && selectedIds.size >= 2 && (
        <Button
          size="xs"
          variant="light"
          color="blue"
          leftSection={<IconGitCompare size={14} />}
          onClick={openCompare}
        >
          Compare ({selectedIds.size})
        </Button>
      )}
      {generateActions.map((action, idx) => {
        const ActionIcon_ =
          action.icon === "music" ? IconMusic : IconSparkles;
        const models = action.modelsEndpoint ? (availableModels[idx] ?? []) : [];
        return (
          <Group key={idx} gap={4} wrap="nowrap">
            {models.length > 0 && (
              <Select
                size="xs"
                w={200}
                data={models}
                value={modelSelections[idx] ?? null}
                onChange={(val) => val && setModelSelections((prev) => ({ ...prev, [idx]: val }))}
                allowDeselect={false}
              />
            )}
            <Button
              size="xs"
              variant="light"
              color={action.color ?? "violet"}
              leftSection={<ActionIcon_ size={14} />}
              loading={generatingIdx === idx}
              disabled={(generatingIdx !== null && generatingIdx !== idx) || (models.length > 0 && !modelSelections[idx])}
              onClick={() => handleGenerate(action, idx)}
            >
              {action.label}
            </Button>
          </Group>
        );
      })}
      {!relationship.hideAssign && !isReadOnly && (
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
  );

  // Check if any header actions exist
  const hasHeaderActions = generateActions.length > 0 || hasCompareAction || (!relationship.hideAssign && !isReadOnly) || hasMore;

  // Cards mode: use ArtistCardList / AlbumCardList (same components as list pages)
  const isCardsMode = relationship.displayMode === "cards";

  const renderCardsContent = () => {
    if (items.length === 0) {
      return (
        <Text c="dimmed" ta="center" py="md">
          No {relationship.label.toLowerCase()} yet.
        </Text>
      );
    }
    const cardLayout = targetEntity?.listLayout;
    if (cardLayout === "artist-card") {
      return (
        <ArtistCardList
          records={items}
          resource={targetResource}
          imageCol={targetImageCol}
          showPlatformLinks={false}
          platformType="artist"
          onNavigate={(res, id) => show(res, id)}
        />
      );
    }
    if (cardLayout === "album-card") {
      return (
        <AlbumCardList
          records={items}
          resource={targetResource}
          imageCol={targetImageCol}
          showPlatformLinks={false}
          platformType="album"
          onNavigate={(res, id) => show(res, id)}
        />
      );
    }
    // Fallback: render as table
    return null;
  };

  return (
    <>
      {isCardsMode ? (
        <Stack gap="sm">
          <Group justify="space-between">
            <Title order={5} fw={600} c="dark.1">{relationship.label}</Title>
            {hasHeaderActions && headerActions}
          </Group>
          {renderCardsContent()}
        </Stack>
      ) : (
      <SectionCard
        title={relationship.label}
        {...(hasHeaderActions
          ? { actions: headerActions }
          : {})}
      >
        <Table>
          <Table.Thead>
            <Table.Tr>
              {hasCompareAction && (
                <Table.Th w={40}>
                  <Checkbox
                    checked={items.length > 0 && selectedIds.size === items.length}
                    indeterminate={selectedIds.size > 0 && selectedIds.size < items.length}
                    onChange={toggleSelectAll}
                    aria-label="Select all"
                    size="xs"
                  />
                </Table.Th>
              )}
              {relationship.columns.map((col) => (
                <Table.Th key={col.key} fw={500} c="dimmed">{col.label}</Table.Th>
              ))}
              {!isReadOnly && <Table.Th w={actionsColWidth} fw={500} c="dimmed">Actions</Table.Th>}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={relationship.columns.length + (isReadOnly ? 0 : 1) + (hasCompareAction ? 1 : 0)}>
                  <Text c="dimmed" ta="center" py="md">
                    No {relationship.label.toLowerCase()} yet.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {items.map((item) => (
              <Table.Tr key={item.id}>
                {hasCompareAction && (
                  <Table.Td>
                    <Checkbox
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      aria-label="Select for comparison"
                      size="xs"
                    />
                  </Table.Td>
                )}
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
                      item[col.action.viewField] != null ? (
                        <Anchor
                          size="sm"
                          onClick={() => handleViewJson(item, col.action!.viewField!)}
                        >
                          {renderColumnText(col, item[col.key])}
                        </Anchor>
                      ) : (
                        <Text size="sm">{renderColumnText(col, item[col.key])}</Text>
                      )
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
                {!isReadOnly && <Table.Td>
                  <Group gap={4} wrap="nowrap">
                    {/* Row actions */}
                    {relationship.rowActions?.map((action, idx) => {
                      const isDisabled =
                        (action.viewField && item[action.viewField] == null) ||
                        (action.type === "generate" && action.bodyField && item.status === "processing");
                      return (
                        <Tooltip key={idx} label={action.label}>
                          <ActionIcon
                            variant="subtle"
                            color={action.color ?? "gray"}
                            loading={action.type === "generate" && rowGeneratingId === item.id}
                            disabled={!!isDisabled}
                            onClick={() => handleRowAction(action, item)}
                          >
                            {rowActionIcon(action.icon)}
                          </ActionIcon>
                        </Tooltip>
                      );
                    })}
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
                </Table.Td>}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </SectionCard>
      )}

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
      <ViewJsonModal
        data={viewModalData}
        onClose={() => setViewModalData(null)}
        title={relationship.label}
        vibesMeta={vibesMeta}
      />

      {/* Edit JSON Modal */}
      <EditJsonModal
        data={editModalData}
        onClose={() => setEditModalData(null)}
        title={`Edit ${relationship.label}`}
        vibesMeta={vibesMeta}
        saving={editSaving}
        onSave={handleEditSave}
        onChange={setEditModalData}
      />

      {/* Compare Modal (multi-select) */}
      {hasCompareAction && (
        <CompareModal
          opened={compareOpened}
          onClose={() => {
            closeCompare();
            setSelectedIds(new Set());
          }}
          items={selectedItems}
          compareAction={relationship.compareAction!}
          title={`Compare ${relationship.label}`}
          vibesMeta={vibesMeta}
        />
      )}

      {/* View single item modal (reuses compare layout when compareAction exists) */}
      {hasCompareAction && viewModalItem && (
        <CompareModal
          opened={viewModalItem !== null}
          onClose={() => setViewModalItem(null)}
          items={[viewModalItem]}
          compareAction={relationship.compareAction!}
          title={relationship.label}
          vibesMeta={vibesMeta}
        />
      )}
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
      if (value === "processing") {
        return (
          <Badge
            size="sm"
            color="violet"
            variant="light"
            style={{ animation: "vv-pulse 1.5s ease-in-out infinite" }}
          >
            Processing
          </Badge>
        );
      }
      if (value === "failed") {
        return <Badge size="sm" color="red">Failed</Badge>;
      }
      if (value === "completed") {
        return <Badge size="sm" color="green">Completed</Badge>;
      }
      return value ? <Badge size="sm">{String(value)}</Badge> : null;
    case "date":
      return <Text size="sm">{formatDate(value)}</Text>;
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

// ---------------------------------------------------------------------------
// View JSON Modal
// ---------------------------------------------------------------------------

interface ViewJsonModalProps {
  data: any[] | null;
  onClose: () => void;
  title: string;
  vibesMeta: VibesMetadata;
}

function ViewJsonModal({ data, onClose, title, vibesMeta }: ViewJsonModalProps) {
  // Build display entries: all active vibes + archived vibes that have values
  const displayEntries = useMemo(() => {
    if (!data) return [];

    const valueByName = new Map<string, string>();
    const categoryByName = new Map<string, string>();
    for (const entry of data) {
      if (entry.value?.trim()) valueByName.set(entry.name, entry.value);
      if (entry.category) categoryByName.set(entry.name, entry.category);
    }

    if (vibesMeta.orderedVibes.length > 0) {
      const result: Array<{ name: string; category: string; value: string; archived: boolean }> = [];
      for (const v of vibesMeta.orderedVibes) {
        if (v.archived && !valueByName.has(v.name)) continue;
        result.push({ name: v.name, category: v.category, value: valueByName.get(v.name) ?? "", archived: v.archived });
      }
      // Include any entries not in config
      for (const entry of data) {
        if (!result.some((r) => r.name === entry.name)) {
          result.push({ name: entry.name, category: entry.category ?? "", value: entry.value ?? "", archived: false });
        }
      }
      return result;
    }

    // Fallback: no metadata, show profile entries as-is
    return data.map((entry: any) => ({
      name: entry.name ?? "",
      category: entry.category ?? "",
      value: entry.value ?? "",
      archived: false,
    }));
  }, [data, vibesMeta]);

  return (
    <Modal opened={data !== null} onClose={onClose} title={title} size="lg">
      {data && (
        <ScrollArea h={400}>
          <Stack gap="xs">
            {displayEntries.map((entry, idx) => (
              <div
                key={idx}
                style={{
                  borderBottom: idx < displayEntries.length - 1 ? '1px solid var(--mantine-color-dark-7)' : undefined,
                  paddingBottom: 8,
                  opacity: entry.archived ? 0.6 : undefined,
                }}
              >
                <Group gap="xs" mb={4}>
                  <Tooltip label={vibesMeta.vibeDescription.get(entry.name)} disabled={!vibesMeta.vibeDescription.has(entry.name)}>
                    <Text size="sm" fw={600} td={entry.archived ? "line-through" : undefined}>
                      {entry.name || `Entry ${idx + 1}`}
                    </Text>
                  </Tooltip>
                  {entry.category && (
                    <Tooltip label={vibesMeta.categoryDescription.get(entry.category)} disabled={!vibesMeta.categoryDescription.has(entry.category)}>
                      <Badge size="xs">{vibesMeta.categoryName.get(entry.category) ?? entry.category}</Badge>
                    </Tooltip>
                  )}
                  {entry.archived && <Badge size="xs" color="yellow" variant="light">Archived</Badge>}
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
  );
}

// ---------------------------------------------------------------------------
// Edit JSON Modal
// ---------------------------------------------------------------------------

interface EditJsonModalProps {
  data: { entries: any[]; itemId: string | number; endpoint: string } | null;
  onClose: () => void;
  title: string;
  vibesMeta: VibesMetadata;
  saving: boolean;
  onSave: () => void;
  onChange: React.Dispatch<React.SetStateAction<{ entries: any[]; itemId: string | number; endpoint: string } | null>>;
}

function EditJsonModal({ data, onClose, title, vibesMeta, saving, onSave, onChange }: EditJsonModalProps) {
  return (
    <Modal opened={data !== null} onClose={onClose} title={title} size="lg">
      {data && (
        <>
          <ScrollArea h={400}>
            <Stack gap="sm">
              {data.entries.map((entry: any, idx: number) => {
                const isArchived = vibesMeta.vibeArchived.get(entry.name) === true;
                return (
                  <div
                    key={idx}
                    style={{
                      borderBottom: idx < data.entries.length - 1 ? '1px solid var(--mantine-color-dark-7)' : undefined,
                      paddingBottom: 8,
                      opacity: isArchived ? 0.6 : undefined,
                    }}
                  >
                    <Group gap="xs" mb={4}>
                      <Tooltip label={vibesMeta.vibeDescription.get(entry.name)} disabled={!vibesMeta.vibeDescription.has(entry.name)}>
                        <Text size="sm" fw={600} td={isArchived ? "line-through" : undefined}>
                          {entry.name || `Entry ${idx + 1}`}
                        </Text>
                      </Tooltip>
                      {entry.category && (
                        <Tooltip label={vibesMeta.categoryDescription.get(entry.category)} disabled={!vibesMeta.categoryDescription.has(entry.category)}>
                          <Badge size="xs">{vibesMeta.categoryName.get(entry.category) ?? entry.category}</Badge>
                        </Tooltip>
                      )}
                      {isArchived && <Badge size="xs" color="red" variant="light">Archived</Badge>}
                    </Group>
                    <Textarea
                      size="sm"
                      autosize
                      minRows={1}
                      maxRows={6}
                      value={entry.value ?? ""}
                      onChange={(e) => {
                        onChange((prev) => {
                          if (!prev) return prev;
                          const updated = [...prev.entries];
                          updated[idx] = { ...updated[idx], value: e.currentTarget.value };
                          return { ...prev, entries: updated };
                        });
                      }}
                    />
                  </div>
                );
              })}
            </Stack>
          </ScrollArea>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>Cancel</Button>
            <Button loading={saving} onClick={onSave}>Save</Button>
          </Group>
        </>
      )}
    </Modal>
  );
}
