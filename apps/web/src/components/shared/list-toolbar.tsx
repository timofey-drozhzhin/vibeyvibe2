import type { ReactNode } from "react";
import { Group, TextInput, SegmentedControl } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

interface ListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  archiveFilter: string;
  onArchiveFilterChange: (value: string) => void;
  children?: ReactNode;
}

/** Shared toolbar for list pages: search + optional filter controls + archive filter. */
export const ListToolbar = ({
  search,
  onSearchChange,
  archiveFilter,
  onArchiveFilterChange,
  children,
}: ListToolbarProps) => (
  <Group justify="space-between" mb="md">
    <Group gap="sm" style={{ flex: 1 }}>
      <TextInput
        placeholder="Search..."
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => onSearchChange(e.currentTarget.value)}
        style={{ flex: 1, maxWidth: 400 }}
      />
      {children}
    </Group>
    <SegmentedControl
      value={archiveFilter}
      onChange={onArchiveFilterChange}
      data={[
        { label: "Active", value: "active" },
        { label: "All", value: "all" },
        { label: "Archived", value: "archived" },
      ]}
      size="xs"
    />
  </Group>
);
