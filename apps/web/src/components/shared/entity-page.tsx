import type { ReactNode } from "react";
import {
  Group,
  Stack,
  Button,
  Card,
  Center,
  Loader,
  Text,
  Title,
  Divider,
} from "@mantine/core";
import { IconArrowLeft, IconPlus, IconHeart, IconHeartFilled } from "@tabler/icons-react";
import { ArchiveBadge, ArchiveButton } from "./archive-toggle.js";
import { DeleteButton } from "./delete-button.js";

// ---------------------------------------------------------------------------
// SectionCard
// ---------------------------------------------------------------------------

interface SectionCardProps {
  title: string;
  /** Single action button with "+" icon (backward-compatible) */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Custom actions node — when provided, renders instead of `action` */
  actions?: ReactNode;
  children: ReactNode;
}

export const SectionCard = ({ title, action, actions, children }: SectionCardProps) => (
  <Card>
    <Group justify="space-between" mb="md">
      <Title order={5} fw={600} c="dark.1">{title}</Title>
      {actions
        ? actions
        : action && (
            <Button
              size="xs"
              variant="light"
              leftSection={<IconPlus size={14} />}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
    </Group>
    {children}
  </Card>
);

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
  /** If provided, shows Delete button in footer (admin-only) */
  onDelete?: () => void;
  /** Whether the current user has liked this entity */
  liked?: boolean;
  /** Callback to toggle the like state */
  onLikeToggle?: () => void;
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
  onDelete,
  liked,
  onLikeToggle,
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
        liked={liked}
        onLikeToggle={onLikeToggle}
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

      {/* Footer - Archive & Delete buttons */}
      {(onArchiveToggle && archived !== undefined || onDelete) && (
        <>
          <Divider />
          <Group justify="flex-end">
            {onArchiveToggle && archived !== undefined && (
              <ArchiveButton archived={archived} onToggle={onArchiveToggle} />
            )}
            {onDelete && <DeleteButton onDelete={onDelete} />}
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

import { useRef, useEffect } from "react";
import { TextInput, ActionIcon } from "@mantine/core";
import { IconEdit } from "@tabler/icons-react";
import { useInlineEdit } from "../../hooks/use-inline-edit.js";
import { SaveCancelActions } from "./save-cancel-actions.js";

const HeaderSection = ({
  title,
  onBack,
  onTitleSave,
  archived,
  liked,
  onLikeToggle,
}: {
  title: string;
  onBack: () => void;
  onTitleSave?: (newTitle: string) => Promise<void>;
  archived?: boolean;
  liked?: boolean;
  onLikeToggle?: () => void;
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
      {onLikeToggle && (
        <ActionIcon
          variant="subtle"
          color={liked ? "red" : "gray"}
          onClick={onLikeToggle}
          size="lg"
        >
          {liked ? <IconHeartFilled size={22} /> : <IconHeart size={22} />}
        </ActionIcon>
      )}
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
  const {
    editing,
    editValue,
    setEditValue,
    saving,
    startEdit,
    cancel,
    save,
    handleKeyDown,
  } = useInlineEdit(value, {
    onSave: async (v) => {
      if (!v.trim()) return;
      await onSave(v.trim());
    },
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

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
        <SaveCancelActions saving={saving} onSave={save} onCancel={cancel} size="sm" iconSize={18} loaderSize={20} />
      </Group>
    );
  }

  return (
    <Group
      gap="xs"
      wrap="nowrap"
      align="center"
      className="editable-field"
      onClick={startEdit}
      style={{ cursor: "pointer" }}
    >
      <Title order={2}>{value}</Title>
      <ActionIcon
        className="edit-icon"
        size="sm"
        variant="subtle"
        color="gray"
        onClick={startEdit}
      >
        <IconEdit size={14} />
      </ActionIcon>
    </Group>
  );
};
