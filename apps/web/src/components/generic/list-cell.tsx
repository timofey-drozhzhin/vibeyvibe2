import { Text, Avatar } from "@mantine/core";
import { RatingDisplay } from "../shared/rating-field.js";
import { ArchiveBadge } from "../shared/archive-toggle.js";
import type { EntityDef } from "../../config/entity-registry.js";

const API_URL = import.meta.env.VITE_API_URL || "";

interface ListCellProps {
  fieldKey: string;
  value: any;
  entity: EntityDef;
  record: any;
}

function formatDate(value: any): string {
  if (!value) return "\u2014";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return String(value);
  }
}

export const ListCell = ({ fieldKey, value, entity, record }: ListCellProps) => {
  // Image path -> small avatar preview
  if (fieldKey === "image_path") {
    return (
      <Avatar
        size={32}
        radius="sm"
        src={value ? `${API_URL}/api/storage/${value}` : null}
      />
    );
  }

  // Rating -> read-only stars
  if (fieldKey === "rating") {
    return <RatingDisplay value={value ?? 0} />;
  }

  // Archived -> badge
  if (fieldKey === "archived") {
    return <ArchiveBadge archived={!!value} />;
  }

  // Timestamp columns -> formatted date
  if (fieldKey === "created_at" || fieldKey === "updated_at") {
    return (
      <Text size="sm" c="dimmed">
        {formatDate(value)}
      </Text>
    );
  }

  // Date fields (e.g. release_date)
  if (fieldKey.endsWith("_date")) {
    return <Text size="sm">{value || "\u2014"}</Text>;
  }

  // UID fields (spotify_uid, suno_uid, etc.)
  if (fieldKey.endsWith("_uid")) {
    return (
      <Text size="sm" c="dimmed">
        {value || "\u2014"}
      </Text>
    );
  }

  // Foreign key fields -> show enriched display name if available
  if (fieldKey.endsWith("_id")) {
    // Look for enriched data on the record. Common patterns:
    // - bin_source_id -> record.source?.name
    // - song_id -> record.songName
    // - suno_prompt_id -> record.prompt?.name
    const fieldDef = entity.fields.find((f) => f.key === fieldKey);
    const label = fieldDef?.label ?? fieldKey;

    // Try common enrichment patterns
    if (fieldKey === "song_id" && record.songName) {
      return <Text size="sm">{record.songName}</Text>;
    }
    if (fieldKey === "bin_source_id" && record.source) {
      return <Text size="sm">{record.source.name}</Text>;
    }
    if (record[fieldKey.replace(/_id$/, "")]?.name) {
      return <Text size="sm">{record[fieldKey.replace(/_id$/, "")].name}</Text>;
    }

    // Fallback to raw value
    return (
      <Text size="sm" c="dimmed">
        {value ?? "\u2014"}
      </Text>
    );
  }

  // Name column -> plain text (clickable behavior handled by parent)
  if (fieldKey === "name") {
    return <Text fw={500}>{value || "\u2014"}</Text>;
  }

  // Default -> text display
  return <Text size="sm">{value != null ? String(value) : "\u2014"}</Text>;
};
