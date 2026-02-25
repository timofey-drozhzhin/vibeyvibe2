import type { ReactNode } from "react";
import { Group, Stack, Title, Button, Card } from "@mantine/core";
import { IconArrowLeft, IconEdit, IconPlus } from "@tabler/icons-react";

interface ShowPageHeaderProps {
  title: string;
  onBack: () => void;
  onEdit?: () => void;
  badges?: ReactNode;
}

export const ShowPageHeader = ({
  title,
  onBack,
  onEdit,
  badges,
}: ShowPageHeaderProps) => (
  <Group justify="space-between">
    <Group>
      <Button
        variant="subtle"
        leftSection={<IconArrowLeft size={16} />}
        onClick={onBack}
      >
        Back
      </Button>
      <Title order={2}>{title}</Title>
      {badges}
    </Group>
    {onEdit && (
      <Button
        variant="light"
        leftSection={<IconEdit size={16} />}
        onClick={onEdit}
      >
        Edit
      </Button>
    )}
  </Group>
);

interface SectionCardProps {
  title: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children: ReactNode;
}

export const SectionCard = ({ title, action, children }: SectionCardProps) => (
  <Card withBorder>
    <Group justify="space-between" mb="md">
      <Title order={4}>{title}</Title>
      {action && (
        <Button
          size="xs"
          variant="light"
          leftSection={<IconPlus size={14} />}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </Group>
    {children}
  </Card>
);
