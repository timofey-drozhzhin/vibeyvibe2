import { Switch, Badge } from "@mantine/core";

interface ArchiveToggleProps {
  value: boolean;
  onChange: (archived: boolean) => void;
  label?: string;
}

/** Toggle switch for setting archived status on edit forms. */
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

/** Read-only badge showing archive status. */
export const ArchiveBadge = ({ archived }: { archived: boolean }) =>
  archived ? (
    <Badge color="red" variant="light">
      Archived
    </Badge>
  ) : null;
