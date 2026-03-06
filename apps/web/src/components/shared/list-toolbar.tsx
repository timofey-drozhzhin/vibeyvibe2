import type { ReactNode, CSSProperties } from "react";
import { Group, TextInput, Button, Menu } from "@mantine/core";
import {
  IconSearch,
  IconArrowsSort,
  IconChevronDown,
  IconFilter,
  IconCheck,
} from "@tabler/icons-react";

/** Suno-measured pill button style: 40px height, solid dark bg, no border */
const pillStyle: CSSProperties = {
  height: 40,
  fontSize: 12,
  fontWeight: 500,
  backgroundColor: "rgb(37, 37, 41)",
  border: "none",
  padding: "8px 16px",
};

/** Suno-measured toggle pill: transparent bg, subtle border via outline */
const togglePillStyle: CSSProperties = {
  height: 40,
  fontSize: 12,
  fontWeight: 500,
  backgroundColor: "transparent",
  border: "1px solid rgba(255,255,255,0.12)",
  padding: "8px 16px",
};

/** Active toggle pill: filled state */
const togglePillActiveStyle: CSSProperties = {
  height: 40,
  fontSize: 12,
  fontWeight: 500,
  padding: "8px 16px",
};

export { pillStyle, togglePillStyle, togglePillActiveStyle };

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

const archiveOptions = [
  { label: "Active", value: "active" },
  { label: "Archived", value: "archived" },
];

/** Suno-inspired toolbar: search + pill-style filter/sort dropdowns. */
export const ListToolbar = ({
  search,
  onSearchChange,
  archiveFilter,
  onArchiveFilterChange,
  children,
  sortPresets,
  activeSortPreset,
  onSortPresetChange,
}: ListToolbarProps) => {
  const activeSortLabel =
    sortPresets?.find((p) => p.value === activeSortPreset)?.label ?? "Sort";
  const archiveLabel =
    archiveOptions.find((o) => o.value === archiveFilter)?.label ?? "Active";

  return (
    <Group gap="sm" wrap="wrap">
      {/* Search — Suno-measured: 40px, rgba(255,255,255,0.04), no border, pill */}
      <TextInput
        placeholder="Search"
        leftSection={<IconSearch size={20} stroke={2} color="rgb(247, 244, 239)" />}
        leftSectionWidth={44}
        value={search}
        onChange={(e) => onSearchChange(e.currentTarget.value)}
        radius={50}
        size="md"
        styles={{
          input: {
            height: 40,
            fontSize: 14,
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "none",
            color: "rgba(255,255,255,0.9)",
            "--input-placeholder-color": "rgba(247, 244, 239, 0.5)",
          } as any,
        }}
        style={{ flex: 1, minWidth: 200 }}
      />

      {/* Sort dropdown pill */}
      {sortPresets && sortPresets.length > 0 && onSortPresetChange && (
        <Menu position="bottom-start" withArrow={false}>
          <Menu.Target>
            <Button
              variant="default"
              size="sm"
              leftSection={<IconArrowsSort size={14} />}
              rightSection={<IconChevronDown size={12} />}
              style={pillStyle}
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
            size="sm"
            leftSection={<IconFilter size={14} />}
            rightSection={<IconChevronDown size={12} />}
            style={pillStyle}
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
    </Group>
  );
};
