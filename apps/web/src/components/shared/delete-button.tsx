import { useState } from "react";
import { Button, Modal, Group, Text } from "@mantine/core";

interface DeleteButtonProps {
  onDelete: () => void;
}

/** Red button that opens a confirmation modal before permanently deleting a record. */
export const DeleteButton = ({ onDelete }: DeleteButtonProps) => {
  const [opened, setOpened] = useState(false);

  return (
    <>
      <Button color="red" variant="filled" onClick={() => setOpened(true)}>
        Permanently Delete
      </Button>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Permanently Delete Record"
        centered
      >
        <Text size="sm" mb="lg">
          Are you sure you want to permanently delete this record? This action
          cannot be undone.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setOpened(false)}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={() => {
              onDelete();
              setOpened(false);
            }}
          >
            Permanently Delete
          </Button>
        </Group>
      </Modal>
    </>
  );
};
