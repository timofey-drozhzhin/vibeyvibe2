import type { ReactNode } from "react";
import { Group, TextInput, SegmentedControl, Select } from "@mantine/core";
import { IconSearch, IconArrowsSort } from "@tabler/icons-react";

interface SortPresetOption {
  label: string;
  value: string;
}

interface ListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  archiveFilter: string;
  onArchiveFilterChange: (value: string) => void;
  children?: ReactNode;
  sortPresets?: SortPresetOption[];
  activeSortPreset?: string | null;
  onSortPresetChange?: (value: string | null) => void;
}

/** Shared toolbar for list pages: search + optional sort preset + archive filter. */
export const ListToolbar = ({
  search,
  onSearchChange,
  archiveFilter,
  onArchiveFilterChange,
  children,
  sortPresets,
  activeSortPreset,
  onSortPresetChange,
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
      {sortPresets && sortPresets.length > 0 && onSortPresetChange && (
        <Select
          placeholder="Sort by..."
          leftSection={<IconArrowsSort size={16} />}
          data={sortPresets}
          value={activeSortPreset ?? null}
          onChange={onSortPresetChange}
          allowDeselect={false}
          size="sm"
          w={200}
        />
      )}
      {children}
    </Group>
    <SegmentedControl
      value={archiveFilter}
      onChange={onArchiveFilterChange}
      data={[
        { label: "Active", value: "active" },
        { label: "Archived", value: "archived" },
      ]}
      size="xs"
    />
  </Group>
);
