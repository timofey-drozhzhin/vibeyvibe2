import { useState, useCallback } from "react";

interface UseInlineEditOptions {
  onSave: (value: string) => Promise<void>;
  validate?: (value: string) => string | null;
}

export function useInlineEdit(initialValue: string | null | undefined, options: UseInlineEditOptions) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(initialValue ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditValue(initialValue ?? "");
    setError(null);
    setEditing(true);
  }, [initialValue]);

  const cancel = useCallback(() => {
    setEditing(false);
    setEditValue(initialValue ?? "");
    setError(null);
  }, [initialValue]);

  const save = useCallback(async () => {
    if (options.validate) {
      const err = options.validate(editValue);
      if (err) {
        setError(err);
        return;
      }
    }
    setSaving(true);
    try {
      await options.onSave(editValue);
      setEditing(false);
      setError(null);
    } catch {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  }, [editValue, options]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") save();
    else if (e.key === "Escape") cancel();
  }, [save, cancel]);

  return {
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
  };
}
