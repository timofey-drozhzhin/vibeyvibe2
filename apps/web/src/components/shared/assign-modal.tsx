import { useState } from "react";
import { useList } from "@refinedev/core";
import { Modal, Select, Button, Group, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";

const API_URL = import.meta.env.VITE_API_URL || "";

interface AssignModalProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  resource: string;
  assignUrl: string;
  fieldName: string;
  labelField: string;
  onSuccess: () => void;
}

export const AssignModal = ({
  opened,
  onClose,
  title,
  resource,
  assignUrl,
  fieldName,
  labelField,
  onSuccess,
}: AssignModalProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const listResult = useList({
    resource,
    pagination: { pageSize: 100 },
    filters: [{ field: "archived", operator: "eq", value: "false" }],
    queryOptions: { enabled: opened },
  });

  const isLoading = listResult.query.isLoading;

  const options =
    listResult.result.data?.map((item: any) => ({
      value: String(item.id),
      label: item[labelField] || String(item.id),
    })) ?? [];

  const handleConfirm = async () => {
    if (!selectedId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}${assignUrl}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [fieldName]: selectedId }),
      });

      if (res.status === 409) {
        notifications.show({
          title: "Already assigned",
          message: "This relationship already exists.",
          color: "yellow",
        });
      } else if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      } else {
        notifications.show({
          title: "Assigned",
          message: "Relationship added successfully.",
          color: "green",
        });
        onSuccess();
      }

      setSelectedId(null);
      onClose();
    } catch (err: any) {
      notifications.show({
        title: "Error",
        message: err.message || "Failed to assign.",
        color: "red",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedId(null);
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title={title}>
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Search and select an item to assign.
        </Text>
        <Select
          data={options}
          value={selectedId}
          onChange={setSelectedId}
          placeholder="Search..."
          searchable
          clearable
          nothingFoundMessage="No items found"
          disabled={isLoading}

        />
        <Group justify="flex-end">
          <Button variant="default" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            loading={isSubmitting}
            disabled={!selectedId}
          >
            Confirm
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
