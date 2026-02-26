import { Group, Text, ActionIcon, Tooltip } from "@mantine/core";
import { IconStar, IconStarFilled } from "@tabler/icons-react";

interface RatingFieldProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: number;
}

/**
 * Rating component for 0-1 decimal scale displayed as 5 stars.
 * 0 = unrated, 0.2 = 1 star, 0.4 = 2 stars, ..., 1.0 = 5 stars.
 * Clicking the same star again resets to 0.
 * onChange emits the 0-1 decimal value.
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

  // Convert 0-1 decimal to 0-5 star count
  const starCount = Math.round(value * 5);

  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = starCount >= i;
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
            onClick={() => onChange?.(starCount === i ? 0 : i / 5)}
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
 * Accepts 0-1 decimal value, displays as 0-5 stars.
 */
export const RatingDisplay = ({ value, size = 14 }: { value: number; size?: number }) => {
  if (value === 0) return null;
  const starCount = Math.round(value * 5);
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const Icon = starCount >= i ? IconStarFilled : IconStar;
    stars.push(<Icon key={i} size={size} color="var(--mantine-color-yellow-5)" />);
  }
  return <Group gap={1}>{stars}</Group>;
};
