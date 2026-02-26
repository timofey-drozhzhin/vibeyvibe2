import type { ReactNode } from "react";
import {
  Group,
  Stack,
  Button,
  Center,
  Loader,
  Text,
  Divider,
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { ArchiveBadge, ArchiveButton } from "./archive-toggle.js";

// Re-export SectionCard for convenience
export { SectionCard } from "./show-page.js";

interface EntityPageProps {
  /** Page title (entity name) */
  title: string;
  /** Navigate back to list */
  onBack: () => void;
  /** If provided, title becomes inline-editable */
  onTitleSave?: (newTitle: string) => Promise<void>;
  /** Archive status - shows badge in header */
  archived?: boolean;
  /** If provided, shows Archive/Restore button in footer */
  onArchiveToggle?: (val: boolean) => Promise<void>;
  /** Loading state */
  isLoading?: boolean;
  /** Record not found (show message) */
  notFound?: boolean;
  /** Not found message */
  notFoundMessage?: string;
  /** Right panel content (image, embeds, etc.) */
  rightPanel?: ReactNode;
  /** Right panel width in px (default 300) */
  rightPanelWidth?: number;
  /** Main body content (section cards, tables, etc.) */
  children: ReactNode;
  /** Extra content after the layout (modals, etc.) */
  modals?: ReactNode;
}

export const EntityPage = ({
  title,
  onBack,
  onTitleSave,
  archived,
  onArchiveToggle,
  isLoading,
  notFound,
  notFoundMessage = "Record not found.",
  rightPanel,
  rightPanelWidth = 300,
  children,
  modals,
}: EntityPageProps) => {
  if (isLoading) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }

  if (notFound) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        {notFoundMessage}
      </Text>
    );
  }

  // Import EditableTitle dynamically to avoid circular deps
  // We inline a simpler version using ShowPageHeader
  return (
    <Stack gap="md">
      {/* Header */}
      <HeaderSection
        title={title}
        onBack={onBack}
        onTitleSave={onTitleSave}
        archived={archived}
      />

      {/* Body */}
      {rightPanel ? (
        <Group align="flex-start" gap="lg" wrap="nowrap">
          <Stack style={{ flex: 1, minWidth: 0 }} gap="md">
            {children}
          </Stack>
          <Stack w={rightPanelWidth} style={{ flexShrink: 0 }}>
            {rightPanel}
          </Stack>
        </Group>
      ) : (
        <Stack gap="md">{children}</Stack>
      )}

      {/* Footer - Archive button */}
      {onArchiveToggle && archived !== undefined && (
        <>
          <Divider />
          <Group justify="flex-end">
            <ArchiveButton archived={archived} onToggle={onArchiveToggle} />
          </Group>
        </>
      )}

      {/* Modals */}
      {modals}
    </Stack>
  );
};

// ---------------------------------------------------------------------------
// Header Section (internal)
// ---------------------------------------------------------------------------

import { useState, useRef, useEffect } from "react";
import { Title, TextInput, ActionIcon } from "@mantine/core";
import { IconCheck, IconX, IconEdit } from "@tabler/icons-react";

const HeaderSection = ({
  title,
  onBack,
  onTitleSave,
  archived,
}: {
  title: string;
  onBack: () => void;
  onTitleSave?: (newTitle: string) => Promise<void>;
  archived?: boolean;
}) => (
  <Group justify="space-between">
    <Group>
      <Button
        variant="subtle"
        leftSection={<IconArrowLeft size={16} />}
        onClick={onBack}
      >
        Back
      </Button>
      {onTitleSave ? (
        <EditableTitle value={title} onSave={onTitleSave} />
      ) : (
        <Title order={2}>{title}</Title>
      )}
      {archived !== undefined && <ArchiveBadge archived={archived} />}
    </Group>
  </Group>
);

const EditableTitle = ({
  value,
  onSave,
}: {
  value: string;
  onSave: (v: string) => Promise<void>;
}) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleStartEdit = () => {
    setEditValue(value);
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setEditValue(value);
  };

  const handleSave = async () => {
    if (!editValue.trim()) return;
    setSaving(true);
    try {
      await onSave(editValue.trim());
      setEditing(false);
    } catch {
      // keep editing on error
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    else if (e.key === "Escape") handleCancel();
  };

  if (editing) {
    return (
      <Group gap="xs" wrap="nowrap">
        <TextInput
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          disabled={saving}
          size="md"
          styles={{ input: { fontWeight: 700, fontSize: "var(--mantine-h2-font-size)" } }}
        />
        {saving ? (
          <Loader size={20} />
        ) : (
          <Group gap={4} wrap="nowrap">
            <ActionIcon variant="subtle" color="green" onClick={handleSave}>
              <IconCheck size={18} />
            </ActionIcon>
            <ActionIcon variant="subtle" color="gray" onClick={handleCancel}>
              <IconX size={18} />
            </ActionIcon>
          </Group>
        )}
      </Group>
    );
  }

  return (
    <Group
      gap="xs"
      wrap="nowrap"
      align="center"
      className="editable-field"
      onClick={handleStartEdit}
      style={{ cursor: "pointer" }}
    >
      <Title order={2}>{value}</Title>
      <ActionIcon
        className="edit-icon"
        size="sm"
        variant="subtle"
        color="gray"
        onClick={handleStartEdit}
      >
        <IconEdit size={16} />
      </ActionIcon>
    </Group>
  );
};
