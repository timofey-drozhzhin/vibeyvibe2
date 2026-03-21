import { useState } from "react";
import {
  Table,
  Text,
  Anchor,
  Select,
  Group,
  ActionIcon,
  Box,
  Textarea,
  Tooltip,
  Stack,
} from "@mantine/core";
import { useList, useNavigation } from "@refinedev/core";
import { notifications } from "@mantine/notifications";
import { IconEdit, IconCopy } from "@tabler/icons-react";
import { EditableField } from "../shared/editable-field.js";
import { SaveCancelActions } from "../shared/save-cancel-actions.js";
import { RatingField } from "../shared/rating-field.js";
import { ImageUpload } from "../shared/image-upload.js";
import { AudioUpload } from "../shared/audio-upload.js";
import type { FieldDef, EntityDef } from "../../config/entity-registry.js";
import { resolveRelationshipTarget, getResourceName } from "../../config/entity-registry.js";
import { formatDate } from "../../utils/format-date.js";
import { resolveFkDisplayName } from "../../utils/resolve-fk-display.js";

interface FieldRowProps {
  field: FieldDef;
  value: any;
  onSave: (value: any) => Promise<void>;
  entity: EntityDef;
  record: any;
}

export const FieldRow = ({ field, value, onSave, entity, record }: FieldRowProps) => {
  // uid fields are rendered in the aside panel, not as table rows
  if (field.type === "uid") {
    return null;
  }

  const content = renderFieldContent(field, value, onSave, entity, record);
  if (content === null) return null;

  return (
    <Table.Tr>
      <Table.Td fw={500} c="dimmed">{field.label}</Table.Td>
      <Table.Td>{content}</Table.Td>
    </Table.Tr>
  );
};

function renderFieldContent(
  field: FieldDef,
  value: any,
  onSave: (value: any) => Promise<void>,
  entity: EntityDef,
  record: any,
): React.ReactNode {
  switch (field.type) {
    case "text":
      return (
        <EditableField
          value={value ?? null}
          onSave={(v) => onSave(v)}
          placeholder={field.placeholder}
          validate={field.validate}
        />
      );

    case "textarea":
      return (
        <TextareaField
          field={field}
          value={value ?? null}
          onSave={onSave}
        />
      );

    case "date":
      return (
        <EditableField
          value={value ?? null}
          onSave={(v) => onSave(v)}
          placeholder={field.placeholder || "Select date"}
          type="date"
          renderDisplay={(v) => <Text size="sm">{formatDate(v)}</Text>}
        />
      );

    case "rating":
      return (
        <RatingField
          value={value ?? 0}
          onChange={(v) => onSave(v)}
        />
      );

    case "url":
      return (
        <EditableField
          value={value ?? null}
          onSave={(v) => onSave(v)}
          placeholder={field.placeholder || "https://..."}
          editOnIconOnly
          renderDisplay={(v) => (
            <Anchor href={v} target="_blank" rel="noopener noreferrer" size="sm">
              {v}
            </Anchor>
          )}
        />
      );

    case "image":
      return (
        <ImageUpload
          path={value ?? null}
          onUpload={(path) => onSave(path)}
          alt={record?.name || field.label}
          size={120}
          directory={field.directory}
        />
      );

    case "audio":
      return (
        <AudioUpload
          path={value ?? null}
          onUpload={(path) => onSave(path)}
          accept={field.accept || "audio/*"}
          directory={field.directory}
        />
      );

    case "fk":
      return (
        <ForeignKeyField
          field={field}
          value={value}
          onSave={onSave}
          entity={entity}
          record={record}
        />
      );

    case "select":
      return <Text size="sm" c="dimmed">--</Text>;

    case "readonly":
      return <Text size="sm">{value != null ? String(value) : ""}</Text>;

    default:
      return <Text size="sm">{value != null ? String(value) : ""}</Text>;
  }
}

// ---------------------------------------------------------------------------
// Textarea Field — read-only display with Copy and inline Edit
// ---------------------------------------------------------------------------

interface TextareaFieldProps {
  field: FieldDef;
  value: string | null;
  onSave: (value: any) => Promise<void>;
}

const TextareaField = ({ field, value, onSave }: TextareaFieldProps) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value ?? "");
  const [saving, setSaving] = useState(false);

  const handleStartEdit = () => {
    setEditValue(value ?? "");
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setEditValue(value ?? "");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(editValue);
      setEditing(false);
    } catch {
      // error handled by parent
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      notifications.show({
        title: "Copied",
        message: `${field.label} copied to clipboard.`,
        color: "green",
        autoClose: 2000,
      });
    } catch {
      // fallback ignored
    }
  };

  if (editing) {
    return (
      <Stack gap="xs">
        <Textarea
          value={editValue}
          onChange={(e) => setEditValue(e.currentTarget.value)}
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
          autosize
          minRows={4}
          maxRows={20}
          autoFocus
          disabled={saving}
        />
        <SaveCancelActions saving={saving} onSave={handleSave} onCancel={handleCancel} />
      </Stack>
    );
  }

  const hasValue = !!value;

  return (
    <Box className="editable-field" style={{ cursor: "default" }}>
      <Group gap="xs" wrap="nowrap" align="flex-start">
        {hasValue ? (
          <Text size="sm" style={{ whiteSpace: "pre-wrap", flex: 1 }}>
            {value}
          </Text>
        ) : (
          <Text size="sm" c="dimmed" fs="italic">
            No {field.label.toLowerCase()}
          </Text>
        )}
        <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
          {hasValue && (
            <Tooltip label="Copy">
              <ActionIcon
                className="edit-icon"
                size="xs"
                variant="subtle"
                color="gray"
                onClick={handleCopy}
              >
                <IconCopy size={14} />
              </ActionIcon>
            </Tooltip>
          )}
          <Tooltip label="Edit">
            <ActionIcon
              className="edit-icon"
              size="xs"
              variant="subtle"
              color="gray"
              onClick={handleStartEdit}
            >
              <IconEdit size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// FK Field with Select dropdown
// ---------------------------------------------------------------------------

interface ForeignKeyFieldProps {
  field: FieldDef;
  value: any;
  onSave: (value: any) => Promise<void>;
  entity: EntityDef;
  record: any;
}

const ForeignKeyField = ({ field, value, onSave, entity, record }: ForeignKeyFieldProps) => {
  const [editing, setEditing] = useState(false);
  const { show } = useNavigation();

  const targetEntity = field.target
    ? resolveRelationshipTarget(entity, field.target)
    : undefined;

  const targetResource = targetEntity ? getResourceName(targetEntity) : "";
  const labelField = field.targetLabelField || "name";

  const { result, query: listQuery } = useList({
    resource: targetResource,
    pagination: { pageSize: 100 },
    filters: [{ field: "archived", operator: "eq", value: "false" }],
    queryOptions: { enabled: editing && !!targetResource },
  });

  const isLoading = listQuery.isLoading;

  const options = result?.data?.map((item: any) => ({
    value: String(item.id),
    label: item[labelField] || String(item.id),
  })) ?? [];

  // Try to resolve display name from record enrichment
  const displayName = resolveFkDisplayName(field.key, value, record);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
  };

  if (editing) {
    return (
      <Select
        data={options}
        value={value != null ? String(value) : null}
        onChange={(v) => {
          const numVal = v ? Number(v) : null;
          onSave(numVal);
          setEditing(false);
        }}
        placeholder={`Select ${field.label}...`}
        searchable
        clearable
        nothingFoundMessage="No items found"
        disabled={isLoading}
        size="xs"
        onBlur={() => setEditing(false)}
        autoFocus
      />
    );
  }

  return (
    <Box className="editable-field">
      <Group gap="xs" wrap="nowrap" align="center">
        {displayName && value != null ? (
          <Anchor
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (targetResource) show(targetResource, value);
            }}
          >
            {displayName}
          </Anchor>
        ) : (
          <Text
            size="sm"
            c="dimmed"
            fs="italic"
            style={{ cursor: "pointer" }}
            onClick={handleStartEdit}
          >
            Click to select
          </Text>
        )}
        <ActionIcon
          className="edit-icon"
          size="xs"
          variant="subtle"
          color="gray"
          onClick={handleStartEdit}
        >
          <IconEdit size={14} />
        </ActionIcon>
      </Group>
    </Box>
  );
};

