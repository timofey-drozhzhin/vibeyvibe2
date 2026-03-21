import { useState } from "react";
import { Button, Modal, Group, Text } from "@mantine/core";

interface ConfirmationModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor: string;
  confirmVariant?: string;
}

export const ConfirmationModal = ({
  opened,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  confirmColor,
  confirmVariant = "filled",
}: ConfirmationModalProps) => (
  <Modal opened={opened} onClose={onClose} title={title}>
    <Text size="sm" mb="lg">
      {message}
    </Text>
    <Group justify="flex-end">
      <Button variant="default" onClick={onClose}>
        Cancel
      </Button>
      <Button
        color={confirmColor}
        variant={confirmVariant}
        onClick={() => {
          onConfirm();
          onClose();
        }}
      >
        {confirmLabel}
      </Button>
    </Group>
  </Modal>
);

/**
 * Hook that provides modal state and a trigger button pattern.
 * Returns [opened, open, close] similar to Mantine's useDisclosure.
 */
export function useConfirmation() {
  const [opened, setOpened] = useState(false);
  return [opened, () => setOpened(true), () => setOpened(false)] as const;
}
