import { Anchor, Text, Avatar, Group } from "@mantine/core";
import { useNavigation } from "@refinedev/core";
import { RatingDisplay } from "../shared/rating-field.js";
import { ArchiveBadge } from "../shared/archive-toggle.js";
import type { EntityDef } from "../../config/entity-registry.js";
import {
  resolveRelationshipTarget,
  getResourceName,
  findEntity,
} from "../../config/entity-registry.js";

const API_URL = import.meta.env.VITE_API_URL || "";

interface ListCellProps {
  fieldKey: string;
  value: any;
  entity: EntityDef;
  record: any;
}

function formatDate(value: any): string {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return String(value);
  }
}

export const ListCell = ({ fieldKey, value, entity, record }: ListCellProps) => {
  const { show } = useNavigation();

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
    return <Text size="sm">{value || ""}</Text>;
  }

  // UID fields (spotify_uid, suno_uid, etc.)
  if (fieldKey.endsWith("_uid")) {
    return (
      <Text size="sm" c="dimmed">
        {value || ""}
      </Text>
    );
  }

  // Foreign key fields -> clickable enriched display name
  if (fieldKey.endsWith("_id")) {
    const fieldDef = entity.fields.find((f) => f.key === fieldKey);
    const baseKey = fieldKey.replace(/_id$/, "");
    const displayName =
      record[baseKey]?.name ?? record[`${baseKey}Name`] ?? null;

    if (displayName && fieldDef?.target) {
      const targetEntity = resolveRelationshipTarget(entity, fieldDef.target);
      if (targetEntity) {
        const targetResource = getResourceName(targetEntity);
        return (
          <Anchor
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              show(targetResource, record[fieldKey]);
            }}
          >
            {displayName}
          </Anchor>
        );
      }
    }

    return (
      <Text size="sm" c="dimmed">
        {displayName ?? (value != null ? String(value) : "")}
      </Text>
    );
  }

  // Enriched arrays (e.g. artists on songs, artists on albums)
  if (Array.isArray(record[fieldKey]) && record[fieldKey].length > 0 && record[fieldKey][0]?.name) {
    const items: any[] = record[fieldKey];
    const targetEntity = findEntity(entity.context, fieldKey);
    const targetResource = targetEntity ? getResourceName(targetEntity) : null;

    return (
      <Group gap={4} wrap="wrap">
        {items.map((item: any, i: number) => (
          <span key={item.id}>
            {targetResource ? (
              <Anchor
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  show(targetResource, item.id);
                }}
              >
                {item.name}
              </Anchor>
            ) : (
              <Text size="sm" component="span">{item.name}</Text>
            )}
            {i < items.length - 1 && (
              <Text size="sm" component="span" c="dimmed">, </Text>
            )}
          </span>
        ))}
      </Group>
    );
  }

  // Name column -> clickable link to show page
  if (fieldKey === "name") {
    const resource = getResourceName(entity);
    return (
      <Anchor
        fw={500}
        onClick={(e) => {
          e.stopPropagation();
          show(resource, record.id);
        }}
      >
        {value || ""}
      </Anchor>
    );
  }

  // Default -> text display
  return <Text size="sm">{value != null ? String(value) : ""}</Text>;
};
