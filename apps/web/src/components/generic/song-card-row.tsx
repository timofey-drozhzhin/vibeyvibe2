import type React from "react";
import { Group, Box, Text, ActionIcon, Menu, Stack, Center, Badge } from "@mantine/core";
import { IconHeart, IconHeartFilled, IconDots, IconEye } from "@tabler/icons-react";
import { API_URL } from "../../config/constants.js";
import { formatDate } from "../../utils/format-date.js";

const THUMB = 72;

interface SongCardRowProps {
  records: any[];
  resource: string;
  onNavigate: (resource: string, id: number) => void;
  onToggleLike?: (resource: string, id: number) => void;
}

export const SongCardRow = ({
  records,
  resource,
  onNavigate,
  onToggleLike,
}: SongCardRowProps) => (
  <Stack gap={0}>
    {records.map((record: any) => {
      const artistsList: { id: number; name: string }[] =
        Array.isArray(record.artists) ? record.artists : [];
      const artistResource = resource.replace(/\/[^/]+$/, "/artists");

      return (
        <Box key={record.id} className="song-card-row">
          <Group wrap="nowrap" gap="md" py="sm" px="sm" align="center">
            {/* Square thumbnail */}
            <Box
              bg="dark.8"
              onClick={() => onNavigate(resource, record.id)}
              style={{
                width: THUMB,
                height: THUMB,
                flexShrink: 0,
                borderRadius: "var(--mantine-radius-md)",
                overflow: "hidden",
                cursor: "pointer",
              }}
            >
              {record.image_path ? (
                <img
                  src={`${API_URL}/api/storage/${record.image_path}`}
                  alt={record.name || ""}
                  style={{
                    width: THUMB,
                    height: THUMB,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : (
                <Center w={THUMB} h={THUMB}>
                  <Text fz="xs" c="dimmed">
                    No img
                  </Text>
                </Center>
              )}
            </Box>

            {/* Content area */}
            <Box style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
              {/* Row 1: Title + Release year label */}
              <Group gap="xs" wrap="nowrap">
                <Text
                  fw={500}
                  fz="md"
                  truncate
                  style={{ flexShrink: 0, cursor: "pointer" }}
                  className="clickable-name"
                  onClick={() => onNavigate(resource, record.id)}
                >
                  {record.name || ""}
                </Text>
                {record.release_date && (
                  <Badge
                    variant="light"
                    size="lg"
                    color="gray"
                    tt="none"
                    fw={400}
                    style={{ flexShrink: 0 }}
                  >
                    {new Date(record.release_date).getFullYear()}
                  </Badge>
                )}
              </Group>

              {/* Row 2: Artist names */}
              {artistsList.length > 0 && (
                <Group gap={4} wrap="nowrap" mt="xs" style={{ overflow: "hidden" }}>
                  <Text fz="sm" c="dimmed" truncate>
                    {artistsList.map((a, i) => (
                      <Text
                        key={a.id}
                        component="a"
                        href={`/${artistResource}/show/${a.id}`}
                        fz="sm"
                        c="dimmed"
                        className="clickable-name"
                        style={{ textDecoration: "none", cursor: "pointer" }}
                        onClick={(e: React.MouseEvent) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onNavigate(artistResource, a.id);
                        }}
                      >
                        {a.name}{i < artistsList.length - 1 ? ", " : ""}
                      </Text>
                    ))}
                  </Text>
                </Group>
              )}
            </Box>

            {/* Right side: date + like + dots menu */}
            <Group gap="sm" wrap="nowrap" style={{ flexShrink: 0 }}>
              {record.created_at && (
                <Text fz="sm" c="dimmed" style={{ whiteSpace: "nowrap" }}>
                  {formatDate(record.created_at)}
                </Text>
              )}

              {onToggleLike && (
                <ActionIcon
                  variant="default"
                  className="row-action"
                  size="xl"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onToggleLike(resource, record.id);
                  }}
                >
                  {record.liked ? (
                    <IconHeartFilled size={16} />
                  ) : (
                    <IconHeart size={16} />
                  )}
                </ActionIcon>
              )}

              <Menu position="bottom-end" withArrow={false}>
                <Menu.Target>
                  <ActionIcon
                    variant="default"
                    className="row-action"
                    size="xl"
                  >
                    <IconDots size={16} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconEye size={14} />}
                    onClick={() => onNavigate(resource, record.id)}
                  >
                    View Details
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>
        </Box>
      );
    })}
  </Stack>
);
