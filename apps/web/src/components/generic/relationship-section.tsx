import { useState } from "react";
import {
  Table,
  Text,
  ActionIcon,
  Tooltip,
  Badge,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useNavigation, useCustomMutation } from "@refinedev/core";
import { notifications } from "@mantine/notifications";
import { IconUnlink } from "@tabler/icons-react";
import { SectionCard } from "../shared/entity-page.js";
import { AssignModal } from "../shared/assign-modal.js";
import { RatingDisplay } from "../shared/rating-field.js";
import type { RelationshipDef, EntityDef } from "../../config/entity-registry.js";
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
  const { mutateAsync } = useCustomMutation();

  const sourceResource = getResourceName(sourceEntity);
  const targetEntity = resolveRelationshipTarget(
    sourceEntity,
    relationship.target,
  );
  const targetResource = targetEntity ? getResourceName(targetEntity) : "";
  const labelField = relationship.targetLabelField || "name";

  // Get related items from the record
  const items: any[] = record[relationship.subResource] ?? [];

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
        title: "Removed",
        message: `${relationship.label} assignment removed.`,
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

  return (
    <>
      <SectionCard
        title={relationship.label}
        action={{
          label: `Assign ${relationship.label.replace(/s$/, "")}`,
          onClick: openAssign,
        }}
      >
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              {relationship.columns.map((col) => (
                <Table.Th key={col.key}>{col.label}</Table.Th>
              ))}
              <Table.Th w={60}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={relationship.columns.length + 1}>
                  <Text c="dimmed" ta="center" py="md">
                    No {relationship.label.toLowerCase()} assigned.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
            {items.map((item) => (
              <Table.Tr
                key={item.id}
                className="clickable-name"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  if (targetResource) {
                    show(targetResource, item.id);
                  }
                }}
              >
                {relationship.columns.map((col) => (
                  <Table.Td key={col.key}>
                    {renderColumnValue(col, item[col.key])}
                  </Table.Td>
                ))}
                <Table.Td>
                  <Tooltip
                    label={`Remove from ${sourceEntity.name.toLowerCase()}`}
                  >
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      loading={removingId === item.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(item.id);
                      }}
                    >
                      <IconUnlink size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </SectionCard>

      {record.id && (
        <AssignModal
          opened={assignOpened}
          onClose={closeAssign}
          title={`Assign ${relationship.label.replace(/s$/, "")}`}
          resource={targetResource}
          assignUrl={`/api/${sourceResource}/${record.id}/${relationship.subResource}`}
          fieldName={relationship.assignFieldName}
          labelField={labelField}
          onSuccess={onRefresh}
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
      return value ? <Badge size="sm">{String(value)}</Badge> : null;
    case "date":
      return <Text size="sm">{value || ""}</Text>;
    case "text":
    default:
      return <Text size="sm" fw={col.key === "name" ? 500 : undefined}>{value != null ? String(value) : ""}</Text>;
  }
}
