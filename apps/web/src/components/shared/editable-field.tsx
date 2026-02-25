import { useState, useRef, useEffect } from "react";
import {
  Group,
  Text,
  TextInput,
  ActionIcon,
  Loader,
  Box,
} from "@mantine/core";
import { IconCheck, IconX, IconEdit } from "@tabler/icons-react";

interface EditableFieldProps {
  value: string | null | undefined;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  emptyText?: string;
  renderDisplay?: (value: string) => React.ReactNode;
  validate?: (value: string) => string | null;
}

export const EditableField = ({
  value,
  onSave,
  placeholder,
  emptyText = "Click to add",
  renderDisplay,
  validate,
}: EditableFieldProps) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(value ?? "");
    setError(null);
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setEditValue(value ?? "");
    setError(null);
  };

  const handleSave = async () => {
    if (validate) {
      const err = validate(editValue);
      if (err) {
        setError(err);
        return;
      }
    }
    setSaving(true);
    try {
      await onSave(editValue);
      setEditing(false);
      setError(null);
    } catch {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (editing) {
    return (
      <Group gap="xs" wrap="nowrap">
        <TextInput
          ref={inputRef}
          size="xs"
          value={editValue}
          onChange={(e) => {
            setEditValue(e.currentTarget.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          error={error}
          style={{ flex: 1 }}
          disabled={saving}
        />
        {saving ? (
          <Loader size={16} />
        ) : (
          <Group gap={4} wrap="nowrap">
            <ActionIcon size="xs" variant="subtle" color="green" onClick={handleSave}>
              <IconCheck size={14} />
            </ActionIcon>
            <ActionIcon size="xs" variant="subtle" color="gray" onClick={handleCancel}>
              <IconX size={14} />
            </ActionIcon>
          </Group>
        )}
      </Group>
    );
  }

  const displayValue = value ?? "";
  const hasValue = displayValue.length > 0;

  return (
    <Box className="editable-field" onClick={handleStartEdit}>
      <Group gap="xs" wrap="nowrap" align="center">
        {hasValue ? (
          renderDisplay ? renderDisplay(displayValue) : <Text size="sm">{displayValue}</Text>
        ) : (
          <Text size="sm" c="dimmed" fs="italic">{emptyText}</Text>
        )}
        <ActionIcon
          className="edit-icon"
          size="xs"
          variant="subtle"
          color="gray"
          onClick={handleStartEdit}
        >
          <IconEdit size={14} />
        </ActionIcon>
      </Group>
    </Box>
  );
};
