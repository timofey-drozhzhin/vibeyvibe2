import { useRef, useEffect } from "react";
import {
  Group,
  Text,
  TextInput,
  ActionIcon,
  Box,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconEdit } from "@tabler/icons-react";
import { useInlineEdit } from "../../hooks/use-inline-edit.js";
import { SaveCancelActions } from "./save-cancel-actions.js";

interface EditableFieldProps {
  value: string | null | undefined;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  emptyText?: string;
  renderDisplay?: (value: string) => React.ReactNode;
  validate?: (value: string) => string | null;
  /** Field type. "date" renders a calendar date picker. Default is "text". */
  type?: "text" | "date";
  /** When true, only the edit icon triggers edit mode (not clicking the value). */
  editOnIconOnly?: boolean;
}

export const EditableField = ({
  value,
  onSave,
  placeholder,
  emptyText = "Click to add",
  renderDisplay,
  validate,
  type = "text",
  editOnIconOnly = false,
}: EditableFieldProps) => {
  const {
    editing,
    editValue,
    setEditValue,
    saving,
    error,
    setError,
    startEdit,
    cancel,
    save,
    handleKeyDown,
  } = useInlineEdit(value, { onSave, validate });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current && type === "text") {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing, type]);

  if (editing) {
    return (
      <Group gap="xs" wrap="nowrap">
        {type === "date" ? (
          <DateInput
            size="xs"
            value={editValue || null}
            onChange={(v: string | null) => {
              setEditValue(v ?? "");
              setError(null);
            }}
            placeholder={placeholder || "Select date"}
            error={error}
            style={{ flex: 1 }}
            disabled={saving}
            clearable
            valueFormat="YYYY-MM-DD"
            popoverProps={{ withinPortal: true }}
          />
        ) : (
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
        )}
        <SaveCancelActions saving={saving} onSave={save} onCancel={cancel} />
      </Group>
    );
  }

  const displayValue = value ?? "";
  const hasValue = displayValue.length > 0;

  return (
    <Box className="editable-field" onClick={editOnIconOnly ? undefined : startEdit}>
      <Group gap="xs" wrap="nowrap" align="center">
        {hasValue ? (
          renderDisplay ? renderDisplay(displayValue) : <Text size="sm">{displayValue}</Text>
        ) : (
          <Text size="sm" c="dimmed" fs="italic" onClick={editOnIconOnly ? startEdit : undefined} style={editOnIconOnly ? { cursor: "pointer" } : undefined}>{emptyText}</Text>
        )}
        <ActionIcon
          className="edit-icon"
          size="xs"
          variant="subtle"
          color="gray"
          onClick={startEdit}
        >
          <IconEdit size={14} />
        </ActionIcon>
      </Group>
    </Box>
  );
};
