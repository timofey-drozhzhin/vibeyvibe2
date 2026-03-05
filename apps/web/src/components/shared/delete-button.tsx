import { Button } from "@mantine/core";
import { ConfirmationModal, useConfirmation } from "./confirmation-modal.js";

interface DeleteButtonProps {
  onDelete: () => void;
}

/** Red button that opens a confirmation modal before permanently deleting a record. */
export const DeleteButton = ({ onDelete }: DeleteButtonProps) => {
  const [opened, open, close] = useConfirmation();

  return (
    <>
      <Button color="red" variant="filled" onClick={open}>
        Permanently Delete
      </Button>

      <ConfirmationModal
        opened={opened}
        onClose={close}
        onConfirm={onDelete}
        title="Permanently Delete Record"
        message="Are you sure you want to permanently delete this record? This action cannot be undone."
        confirmLabel="Permanently Delete"
        confirmColor="red"
      />
    </>
  );
};
