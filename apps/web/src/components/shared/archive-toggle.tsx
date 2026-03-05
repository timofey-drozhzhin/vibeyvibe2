import { Badge, Button } from "@mantine/core";
import { ConfirmationModal, useConfirmation } from "./confirmation-modal.js";

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
  const [opened, open, close] = useConfirmation();

  const action = archived ? "Restore" : "Archive";
  const color = archived ? "blue" : "yellow";

  return (
    <>
      <Button color={color} variant="light" onClick={open}>
        {action}
      </Button>

      <ConfirmationModal
        opened={opened}
        onClose={close}
        onConfirm={() => onToggle(!archived)}
        title={`${action} Record`}
        message={
          archived
            ? "Are you sure you want to restore this record? It will become active again."
            : "Are you sure you want to archive this record? It can be restored later."
        }
        confirmLabel={action}
        confirmColor={color}
      />
    </>
  );
};
