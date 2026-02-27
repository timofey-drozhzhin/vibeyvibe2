import { useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import {
  Group,
  Stack,
  Title,
  Button,
  Card,
  TextInput,
  ActionIcon,
  Loader,
} from "@mantine/core";
import { IconArrowLeft, IconPlus, IconCheck, IconX, IconEdit } from "@tabler/icons-react";

interface ShowPageHeaderProps {
  title: string;
  onBack: () => void;
  onTitleSave?: (newTitle: string) => Promise<void>;
  badges?: ReactNode;
  actions?: ReactNode;
}

export const ShowPageHeader = ({
  title,
  onBack,
  onTitleSave,
  badges,
  actions,
}: ShowPageHeaderProps) => (
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
      {badges}
    </Group>
    {actions && <Group>{actions}</Group>}
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
  <Card withBorder>
    <Group justify="space-between" mb="md">
      <Title order={4}>{title}</Title>
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
