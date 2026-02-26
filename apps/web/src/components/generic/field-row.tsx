import { useState } from "react";
import { Table, Text, Anchor, Select, Group, ActionIcon, Box } from "@mantine/core";
import { useList, useNavigation } from "@refinedev/core";
import { IconEdit } from "@tabler/icons-react";
import { EditableField } from "../shared/editable-field.js";
import { RatingField } from "../shared/rating-field.js";
import { ImageUpload } from "../shared/image-upload.js";
import { AudioUpload } from "../shared/audio-upload.js";
import type { FieldDef, EntityDef } from "../../config/entity-registry.js";
import { resolveRelationshipTarget, getResourceName } from "../../config/entity-registry.js";

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
      <Table.Td fw={600} w={180}>{field.label}</Table.Td>
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
        <EditableField
          value={value ?? null}
          onSave={(v) => onSave(v)}
          placeholder={field.placeholder}
          renderDisplay={(v) => (
            <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>{v}</Text>
          )}
        />
      );

    case "date":
      return (
        <EditableField
          value={value ?? null}
          onSave={(v) => onSave(v)}
          placeholder={field.placeholder || "Select date"}
          type="date"
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
  const displayName = resolveDisplayName(field, value, record);

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

/**
 * Try to resolve a display name for an FK value.
 * The API enricher may have added related objects to the record
 * (e.g., record.source for bin_source_id, record.songName for song_id).
 */
function resolveDisplayName(field: FieldDef, value: any, record: any): string | null {
  if (value == null) return null;

  // Check for common enrichment patterns
  // e.g., "bin_source_id" might have "source" object with "name"
  const baseKey = field.key.replace(/_id$/, "");
  if (record[baseKey] && typeof record[baseKey] === "object" && record[baseKey].name) {
    return record[baseKey].name;
  }

  // Check for "songName" style enrichment (e.g., song_id -> songName)
  const parts = baseKey.split("_");
  const camelName = parts.map((p, i) => i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)).join("");
  const nameKey = `${camelName}Name`;
  if (record[nameKey]) {
    return record[nameKey];
  }

  // Check snake_case variant
  const snakeNameKey = `${baseKey}_name`;
  if (record[snakeNameKey]) {
    return record[snakeNameKey];
  }

  return `#${value}`;
}
