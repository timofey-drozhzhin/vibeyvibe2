import { Group, Text, ActionIcon, Tooltip } from "@mantine/core";
import { IconStar, IconStarFilled, IconStarHalfFilled } from "@tabler/icons-react";

interface RatingFieldProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: number;
}

/**
 * Rating component for 0-10 scale (displayed as 0-5 stars with half-star precision).
 * Internal value is 0-10, display is 0-5 stars.
 */
export const RatingField = ({
  value,
  onChange,
  readOnly = false,
  size = 20,
}: RatingFieldProps) => {
  const starValue = value / 2; // Convert 0-10 to 0-5 stars

  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = starValue >= i;
    const half = !filled && starValue >= i - 0.5;

    const Icon = filled ? IconStarFilled : half ? IconStarHalfFilled : IconStar;

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
        <Group key={i} gap={0}>
          <Tooltip label={`${(i - 0.5) * 2}/10`}>
            <ActionIcon
              variant="transparent"
              size={size}
              onClick={() => onChange?.((i - 0.5) * 2)}
            >
              <Icon size={size} color="var(--mantine-color-yellow-5)" />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={`${i * 2}/10`}>
            <ActionIcon
              variant="transparent"
              size={size}
              onClick={() => onChange?.(i * 2)}
            >
              <Icon size={size} color="var(--mantine-color-yellow-5)" />
            </ActionIcon>
          </Tooltip>
        </Group>
      );
    }
  }

  return (
    <Group gap={2}>
      {readOnly ? stars : stars}
      <Text size="sm" c="dimmed" ml="xs">
        {value}/10
      </Text>
    </Group>
  );
};

/**
 * Simple read-only rating display as text badge.
 */
export const RatingDisplay = ({ value }: { value: number }) => (
  <Text size="sm" fw={500}>
    {value}/10
  </Text>
);
