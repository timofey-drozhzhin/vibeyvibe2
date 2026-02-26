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
  const fieldDef = entity.fields.find((f) => f.key === fieldKey);

  // --- Resolve by field type from the registry first ---

  if (fieldDef) {
    switch (fieldDef.type) {
      case "image":
        return (
          <Avatar
            size={32}
            radius="sm"
            src={value ? `${API_URL}/api/storage/${value}` : null}
          />
        );

      case "audio":
        if (!value) return null;
        return (
          <audio
            controls
            preload="none"
            src={`${API_URL}/api/storage/${value}`}
            onClick={(e) => e.stopPropagation()}
          />
        );

      case "rating":
        return <RatingDisplay value={value ?? 0} />;

      case "url":
        if (!value) return null;
        return (
          <Anchor href={value} target="_blank" rel="noopener noreferrer" size="sm">
            {value}
          </Anchor>
        );

      case "fk": {
        const baseKey = fieldKey.replace(/_id$/, "");
        const displayName =
          record[baseKey]?.name ?? record[`${baseKey}Name`] ?? null;

        if (displayName && fieldDef.target) {
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
    }
  }

  // --- Built-in columns (not in field registry) ---

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

  // Enriched arrays (e.g. artists on songs)
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

  // Default -> text display
  return <Text size="sm">{value != null ? String(value) : ""}</Text>;
};
