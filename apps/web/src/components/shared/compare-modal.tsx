import { useMemo } from "react";
import {
  Modal,
  ScrollArea,
  Table,
  Text,
  Title,
  Stack,
} from "@mantine/core";
import { formatDate } from "../../utils/format-date.js";
import type { CompareActionDef } from "../../config/entity-registry.js";

interface CompareModalProps {
  opened: boolean;
  onClose: () => void;
  items: any[];
  compareAction: CompareActionDef;
  title: string;
}

interface ParsedEntry {
  name: string;
  category: string;
  value: string;
}

export const CompareModal = ({
  opened,
  onClose,
  items,
  compareAction,
  title,
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

  // Build ordered list of all unique entries across all profiles
  const allEntries = useMemo(() => {
    const seen = new Set<string>();
    const result: { name: string; category: string }[] = [];
    for (const col of columns) {
      for (const entry of col.entries) {
        if (!seen.has(entry.name)) {
          seen.add(entry.name);
          result.push({ name: entry.name, category: entry.category });
        }
      }
    }
    return result;
  }, [columns]);

  // Group entries by category
  const groupedEntries = useMemo(() => {
    const groups: { category: string; entries: { name: string; category: string }[] }[] = [];
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
              <Title order={5} fw={600} c="dark.1" tt="capitalize" mb="xs">
                {group.category}
              </Title>
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
                    <Table.Tr key={entry.name}>
                      <Table.Td style={{ verticalAlign: "top" }}>
                        <Text size="sm" fw={500} c="dimmed">
                          {entry.name}
                        </Text>
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
