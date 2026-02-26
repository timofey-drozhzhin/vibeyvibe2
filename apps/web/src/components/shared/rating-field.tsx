import { Group, Text, ActionIcon, Tooltip } from "@mantine/core";
import { IconStar, IconStarFilled } from "@tabler/icons-react";

interface RatingFieldProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: number;
}

/**
 * Rating component for 0-5 scale (whole stars only).
 * 0 = unrated, 1-5 = actual rating.
 * Clicking the same star again resets to 0.
 */
export const RatingField = ({
  value,
  onChange,
  readOnly = false,
  size = 20,
}: RatingFieldProps) => {
  if (readOnly && value === 0) {
    return <Text size="sm" c="dimmed">--</Text>;
  }

  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = value >= i;
    const Icon = filled ? IconStarFilled : IconStar;

    if (readOnly) {
      stars.push(
        <Icon
          key={i}
          size={size}
          color="var(--mantine-color-yellow-5)"
        />
      );
    } else {
      stars.push(
        <Tooltip key={i} label={`${i}/5`}>
          <ActionIcon
            variant="transparent"
            size={size}
            onClick={() => onChange?.(value === i ? 0 : i)}
          >
            <Icon size={size} color="var(--mantine-color-yellow-5)" />
          </ActionIcon>
        </Tooltip>
      );
    }
  }

  return <Group gap={2}>{stars}</Group>;
};

/**
 * Simple read-only rating display as star icons.
 */
export const RatingDisplay = ({ value, size = 14 }: { value: number; size?: number }) => {
  if (value === 0) return null;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const Icon = value >= i ? IconStarFilled : IconStar;
    stars.push(<Icon key={i} size={size} color="var(--mantine-color-yellow-5)" />);
  }
  return <Group gap={1}>{stars}</Group>;
};
