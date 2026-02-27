import { useState } from "react";
import { useList, useCustomMutation } from "@refinedev/core";
import { Modal, Select, Button, Group, Stack, Text, TextInput, Textarea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import type { PayloadFieldDef } from "../../config/entity-registry.js";

interface AssignModalProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  resource: string;
  assignUrl: string;
  fieldName: string;
  labelField: string;
  onSuccess: () => void;
  payloadFields?: PayloadFieldDef[];
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
  payloadFields,
}: AssignModalProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [payloadValues, setPayloadValues] = useState<Record<string, string>>({});

  const listResult = useList({
    resource,
    pagination: { pageSize: 100 },
    filters: [{ field: "archived", operator: "eq", value: "false" }],
    queryOptions: { enabled: opened },
  });

  const { mutateAsync, mutation } = useCustomMutation();

  const isLoading = listResult.query.isLoading;

  const options =
    listResult.result.data?.map((item: any) => ({
      value: String(item.id),
      label: item[labelField] || String(item.id),
    })) ?? [];

  const handleConfirm = async () => {
    if (!selectedId) return;

    // Validate required payload fields
    if (payloadFields) {
      for (const pf of payloadFields) {
        if (pf.required && !payloadValues[pf.key]?.trim()) {
          notifications.show({
            title: "Validation Error",
            message: `${pf.label} is required.`,
            color: "red",
          });
          return;
        }
      }
    }

    try {
      await mutateAsync({
        url: assignUrl,
        method: "post",
        values: {
          [fieldName]: Number(selectedId),
          ...payloadValues,
        },
        successNotification: false,
        errorNotification: false,
      });

      notifications.show({
        title: "Assigned",
        message: "Relationship added successfully.",
        color: "green",
      });
      onSuccess();
      setSelectedId(null);
      setPayloadValues({});
      onClose();
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("Already assigned") || msg.includes("409")) {
        notifications.show({
          title: "Already assigned",
          message: "This relationship already exists.",
          color: "yellow",
        });
        setSelectedId(null);
        setPayloadValues({});
        onClose();
      } else {
        notifications.show({
          title: "Error",
          message: msg || "Failed to assign.",
          color: "red",
        });
      }
    }
  };

  const handleClose = () => {
    setSelectedId(null);
    setPayloadValues({});
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
        {payloadFields?.map((pf) =>
          pf.type === "textarea" ? (
            <Textarea
              key={pf.key}
              label={pf.label}
              placeholder={pf.placeholder}
              value={payloadValues[pf.key] || ""}
              onChange={(e) =>
                setPayloadValues((prev) => ({
                  ...prev,
                  [pf.key]: e.currentTarget.value,
                }))
              }
              required={pf.required}
            />
          ) : (
            <TextInput
              key={pf.key}
              label={pf.label}
              placeholder={pf.placeholder}
              value={payloadValues[pf.key] || ""}
              onChange={(e) =>
                setPayloadValues((prev) => ({
                  ...prev,
                  [pf.key]: e.currentTarget.value,
                }))
              }
              required={pf.required}
            />
          ),
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            loading={mutation.isPending}
            disabled={!selectedId}
          >
            Confirm
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
