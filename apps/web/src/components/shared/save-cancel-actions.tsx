import { Group, ActionIcon, Loader } from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";

interface SaveCancelActionsProps {
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
  size?: "xs" | "sm" | "md";
  iconSize?: number;
  loaderSize?: number;
}

export const SaveCancelActions = ({
  saving,
  onSave,
  onCancel,
  size = "xs",
  iconSize = 14,
  loaderSize = 16,
}: SaveCancelActionsProps) => {
  if (saving) {
    return <Loader size={loaderSize} />;
  }

  return (
    <Group gap={4} wrap="nowrap">
      <ActionIcon size={size} variant="subtle" color="green" onClick={onSave}>
        <IconCheck size={iconSize} />
      </ActionIcon>
      <ActionIcon size={size} variant="subtle" color="gray" onClick={onCancel}>
        <IconX size={iconSize} />
      </ActionIcon>
    </Group>
  );
};
