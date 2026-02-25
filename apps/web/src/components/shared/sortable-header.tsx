import { Table, Group, Text } from "@mantine/core";
import { IconArrowUp, IconArrowDown } from "@tabler/icons-react";

interface SortableHeaderProps {
  field: string;
  label: string;
  currentSort: string;
  currentOrder: "asc" | "desc";
  onSort: (field: string) => void;
}

/** Reusable sortable table header cell. Shows sort direction arrow when active. */
export const SortableHeader = ({
  field,
  label,
  currentSort,
  currentOrder,
  onSort,
}: SortableHeaderProps) => {
  const isActive = currentSort === field;

  return (
    <Table.Th
      style={{ cursor: "pointer", userSelect: "none" }}
      onClick={() => onSort(field)}
    >
      <Group gap={4} wrap="nowrap">
        <Text size="sm" fw={500} inherit>
          {label}
        </Text>
        {isActive &&
          (currentOrder === "asc" ? (
            <IconArrowUp size={14} />
          ) : (
            <IconArrowDown size={14} />
          ))}
      </Group>
    </Table.Th>
  );
};
