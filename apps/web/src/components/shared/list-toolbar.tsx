import type { ReactNode } from "react";
import { Group, TextInput, Button, Menu } from "@mantine/core";
import {
  IconSearch,
  IconArrowsSort,
  IconChevronDown,
  IconFilter,
  IconCheck,
  IconX,
} from "@tabler/icons-react";

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
  trailing?: ReactNode;
  sortPresets?: SortPresetOption[];
  activeSortPreset?: string | null;
  onSortPresetChange?: (value: string | null) => void;
  /** When provided, shows a reset button to clear all filters */
  onReset?: () => void;
}

const archiveOptions = [
  { label: "Active", value: "active" },
  { label: "Archived", value: "archived" },
];

export const ListToolbar = ({
  search,
  onSearchChange,
  archiveFilter,
  onArchiveFilterChange,
  children,
  trailing,
  sortPresets,
  activeSortPreset,
  onSortPresetChange,
  onReset,
}: ListToolbarProps) => {
  const activeSortLabel =
    sortPresets?.find((p) => p.value === activeSortPreset)?.label ?? "Sort";
  const archiveLabel =
    archiveOptions.find((o) => o.value === archiveFilter)?.label ?? "Active";

  return (
    <Group gap="sm" wrap="wrap">
      {/* Search input */}
      <TextInput
        placeholder="Search"
        leftSection={<IconSearch size={20} stroke={2} />}
        leftSectionWidth={44}
        value={search}
        onChange={(e) => onSearchChange(e.currentTarget.value)}
        size="md"
        style={{ flex: 1, minWidth: 200 }}
      />

      {/* Sort dropdown pill */}
      {sortPresets && sortPresets.length > 0 && onSortPresetChange && (
        <Menu position="bottom-start" withArrow={false}>
          <Menu.Target>
            <Button
              variant="default"
              size="md"
              leftSection={<IconArrowsSort size={14} />}
              rightSection={<IconChevronDown size={12} />}
            >
              {activeSortLabel}
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            {sortPresets.map((preset) => (
              <Menu.Item
                key={preset.value}
                onClick={() => onSortPresetChange(preset.value)}
                rightSection={
                  activeSortPreset === preset.value ? (
                    <IconCheck size={14} />
                  ) : null
                }
              >
                {preset.label}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      )}

      {/* Extra filters (year, liked, etc.) */}
      {children}

      {/* Archive filter dropdown pill */}
      <Menu position="bottom-start" withArrow={false}>
        <Menu.Target>
          <Button
            variant="default"
            size="md"
            leftSection={<IconFilter size={14} />}
            rightSection={<IconChevronDown size={12} />}
          >
            {archiveLabel}
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          {archiveOptions.map((opt) => (
            <Menu.Item
              key={opt.value}
              onClick={() => onArchiveFilterChange(opt.value)}
              rightSection={
                archiveFilter === opt.value ? (
                  <IconCheck size={14} />
                ) : null
              }
            >
              {opt.label}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>

      {onReset && (
        <Button
          variant="filled"
          size="md"
          leftSection={<IconX size={14} />}
          onClick={onReset}
        >
          Reset
        </Button>
      )}

      {trailing}
    </Group>
  );
};
