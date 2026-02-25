import { useState } from "react";
import { Switch, Badge, Button, Modal, Group, Text } from "@mantine/core";

interface ArchiveToggleProps {
  value: boolean;
  onChange: (archived: boolean) => void;
  label?: string;
}

/**
 * @deprecated Use ArchiveButton instead. ArchiveToggle is kept for backwards compatibility.
 */
export const ArchiveToggle = ({
  value,
  onChange,
  label = "Archived",
}: ArchiveToggleProps) => (
  <Switch
    label={label}
    checked={value}
    onChange={(e) => onChange(e.currentTarget.checked)}
    color="red"
  />
);

/** Read-only badge showing archive status. Green "Active" or red "Archived". */
export const ArchiveBadge = ({ archived }: { archived: boolean }) =>
  archived ? (
    <Badge color="red" variant="light">
      Archived
    </Badge>
  ) : (
    <Badge color="green" variant="light">
      Active
    </Badge>
  );

interface ArchiveButtonProps {
  archived: boolean;
  onToggle: (newValue: boolean) => void;
}

/** Button that opens a confirmation modal before toggling archive status. */
export const ArchiveButton = ({ archived, onToggle }: ArchiveButtonProps) => {
  const [opened, setOpened] = useState(false);

  const action = archived ? "Restore" : "Archive";
  const color = archived ? "green" : "red";

  return (
    <>
      <Button color={color} variant="light" onClick={() => setOpened(true)}>
        {action}
      </Button>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={`${action} Record`}
        centered
      >
        <Text size="sm" mb="lg">
          {archived
            ? "Are you sure you want to restore this record? It will become active again."
            : "Are you sure you want to archive this record? It can be restored later."}
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setOpened(false)}>
            Cancel
          </Button>
          <Button
            color={color}
            onClick={() => {
              onToggle(!archived);
              setOpened(false);
            }}
          >
            {action}
          </Button>
        </Group>
      </Modal>
    </>
  );
};
