import { useMemo } from "react";
import {
  Badge,
  Group,
  Modal,
  ScrollArea,
  Table,
  Text,
  Title,
  Tooltip,
  Stack,
} from "@mantine/core";
import { formatDate } from "../../utils/format-date.js";
import type { CompareActionDef } from "../../config/entity-registry.js";
import type { VibesMetadata } from "../../hooks/use-vibes-metadata.js";

interface CompareModalProps {
  opened: boolean;
  onClose: () => void;
  items: any[];
  compareAction: CompareActionDef;
  title: string;
  vibesMeta?: VibesMetadata;
}

interface ParsedEntry {
  name: string;
  category: string;
  value: string;
}

interface DisplayEntry {
  name: string;
  category: string;
  archived: boolean;
}

export const CompareModal = ({
  opened,
  onClose,
  items,
  compareAction,
  title,
  vibesMeta,
}: CompareModalProps) => {
  // Parse each item's JSON data
  const columns = useMemo(() => {
    return items.map((item) => {
      let entries: ParsedEntry[] = [];
      try {
        const raw = item[compareAction.viewField];
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        entries = Array.isArray(parsed) ? parsed : [];
      } catch {
        entries = [];
      }

      const headerParts = compareAction.labelFields.map((key) => {
        const val = item[key];
        if (!val) return "";
        if (key.includes("date") || key === "created_at" || key === "updated_at") {
          return formatDate(val);
        }
        return String(val);
      });

      // Index entries by name for fast lookup
      const byName = new Map<string, ParsedEntry>();
      for (const entry of entries) {
        byName.set(entry.name, entry);
      }

      return {
        id: item.id,
        header: headerParts.filter(Boolean).join(" \u2014 "),
        entries,
        byName,
      };
    });
  }, [items, compareAction]);

  // Build the set of vibe names that have values in any column
  const vibesWithValues = useMemo(() => {
    const names = new Set<string>();
    for (const col of columns) {
      for (const entry of col.entries) {
        if (entry.value?.trim()) names.add(entry.name);
      }
    }
    return names;
  }, [columns]);

  // Build ordered list of display entries using vibes metadata order
  // Active vibes: always shown. Archived vibes: only if any profile has a value.
  const allEntries = useMemo(() => {
    if (vibesMeta && vibesMeta.orderedVibes.length > 0) {
      const result: DisplayEntry[] = [];
      for (const v of vibesMeta.orderedVibes) {
        if (v.archived && !vibesWithValues.has(v.name)) continue;
        result.push({ name: v.name, category: v.category, archived: v.archived });
      }
      // Include any profile entries not in the config (legacy/unknown vibes)
      for (const name of vibesWithValues) {
        if (!result.some((r) => r.name === name)) {
          const sample = columns.find((c) => c.byName.has(name))?.byName.get(name);
          result.push({ name, category: sample?.category ?? "", archived: false });
        }
      }
      return result;
    }
    // Fallback: no metadata available, show only entries from profiles
    const seen = new Set<string>();
    const result: DisplayEntry[] = [];
    for (const col of columns) {
      for (const entry of col.entries) {
        if (!seen.has(entry.name)) {
          seen.add(entry.name);
          result.push({ name: entry.name, category: entry.category, archived: false });
        }
      }
    }
    return result;
  }, [columns, vibesMeta, vibesWithValues]);

  // Group entries by category
  const groupedEntries = useMemo(() => {
    const groups: { category: string; entries: DisplayEntry[] }[] = [];
    let currentCategory = "";
    for (const entry of allEntries) {
      if (entry.category !== currentCategory) {
        currentCategory = entry.category;
        groups.push({ category: currentCategory, entries: [] });
      }
      groups[groups.length - 1].entries.push(entry);
    }
    return groups;
  }, [allEntries]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      size="100%"
      styles={{
        content: { maxWidth: "95vw" },
      }}
    >
      <ScrollArea h="70vh">
        <Stack gap="lg">
          {groupedEntries.map((group) => (
            <div key={group.category}>
              <Tooltip label={vibesMeta?.categoryDescription.get(group.category)} disabled={!vibesMeta?.categoryDescription.has(group.category)}>
                <Title order={5} fw={600} c="dark.1" mb="xs" style={{ cursor: "default", width: "fit-content" }}>
                  {vibesMeta?.categoryName.get(group.category) ?? group.category}
                </Title>
              </Tooltip>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th w={160} fw={500} c="dimmed">Vibe</Table.Th>
                    {columns.map((col) => (
                      <Table.Th key={col.id} fw={500} c="dark.1">{col.header}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {group.entries.map((entry) => (
                    <Table.Tr key={entry.name} style={entry.archived ? { opacity: 0.6 } : undefined}>
                      <Table.Td style={{ verticalAlign: "top" }}>
                        <Tooltip label={vibesMeta?.vibeDescription.get(entry.name)} disabled={!vibesMeta?.vibeDescription.has(entry.name)}>
                          <Group gap={6} wrap="nowrap">
                            <Text size="sm" fw={500} c="dimmed" td={entry.archived ? "line-through" : undefined}>
                              {entry.name}
                            </Text>
                            {entry.archived && <Badge size="xs" color="red" variant="light">Archived</Badge>}
                          </Group>
                        </Tooltip>
                      </Table.Td>
                      {columns.map((col) => {
                        const value = col.byName.get(entry.name)?.value;
                        return (
                          <Table.Td key={col.id} style={{ verticalAlign: "top" }}>
                            <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                              {value || "\u2014"}
                            </Text>
                          </Table.Td>
                        );
                      })}
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
          ))}
        </Stack>
      </ScrollArea>
    </Modal>
  );
};
