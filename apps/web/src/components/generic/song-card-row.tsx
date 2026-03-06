import type React from "react";
import { Group, Box, Text, ActionIcon, Menu, Stack, Center, Badge } from "@mantine/core";
import { IconHeart, IconHeartFilled, IconDots, IconEye } from "@tabler/icons-react";
import { API_URL } from "../../config/constants.js";
import { formatDate } from "../../utils/format-date.js";
import { darkPillBg, pillIconColor, likedIconColor } from "./card-styles.js";

/** Square thumbnail */
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
          <Group wrap="nowrap" gap={16} py={12} px={12} align="center">
            {/* Square thumbnail — 72×72, 12px radius, clickable */}
            <Box
              onClick={() => onNavigate(resource, record.id)}
              style={{
                width: THUMB,
                height: THUMB,
                flexShrink: 0,
                borderRadius: 12,
                overflow: "hidden",
                background: "var(--mantine-color-dark-5)",
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
                  <Text size="10px" c="dimmed">
                    No img
                  </Text>
                </Center>
              )}
            </Box>

            {/* Content area */}
            <Box style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
              {/* Title (clickable link) + Artists + Release year inline */}
              <Group gap={8} wrap="nowrap">
                <Text
                  fw={500}
                  fz={14}
                  lh="16px"
                  c="rgb(247, 244, 239)"
                  truncate
                  style={{ flexShrink: 0, cursor: "pointer" }}
                  className="clickable-name"
                  onClick={() => onNavigate(resource, record.id)}
                >
                  {record.name || ""}
                </Text>
                {artistsList.length > 0 && (
                  <Group gap={4} wrap="nowrap" style={{ overflow: "hidden" }}>
                    {artistsList.map((a) => (
                      <Badge
                        key={a.id}
                        component="a"
                        href={`/${artistResource}/show/${a.id}`}
                        variant="filled"
                        className="dark-pill row-action"
                        size="sm"
                        radius="sm"
                        style={{
                          backgroundColor: darkPillBg,
                          color: pillIconColor,
                          fontSize: 12,
                          fontWeight: 400,
                          textTransform: "none",
                          textDecoration: "none",
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                        onClick={(e: React.MouseEvent) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onNavigate(artistResource, a.id);
                        }}
                      >
                        {a.name}
                      </Badge>
                    ))}
                  </Group>
                )}
                {record.release_date && (
                  <Text
                    fz={12}
                    fw={400}
                    c="rgb(106, 106, 114)"
                    style={{ flexShrink: 0, whiteSpace: "nowrap" }}
                  >
                    {new Date(record.release_date).getFullYear()}
                  </Text>
                )}
              </Group>

              {/* Action icons — Suno-style dark pills, visual only */}
              <Group gap={6} mt={8}>
                <ActionIcon
                  variant="filled"
                  className="row-action"
                  size={32}
                  radius="xl"
                  style={{ backgroundColor: darkPillBg, border: "none" }}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onToggleLike?.(resource, record.id);
                  }}
                >
                  {record.liked ? (
                    <IconHeartFilled size={16} color={likedIconColor} />
                  ) : (
                    <IconHeart size={16} color={pillIconColor} />
                  )}
                </ActionIcon>
              </Group>
            </Box>

            {/* Right side: date + dots menu */}
            <Group gap="lg" wrap="nowrap" style={{ flexShrink: 0 }}>
              {record.created_at && (
                <Text
                  fz={12}
                  c="rgb(106, 106, 114)"
                  style={{ whiteSpace: "nowrap" }}
                >
                  {formatDate(record.created_at)}
                </Text>
              )}

              <Menu position="bottom-end" withArrow={false}>
                <Menu.Target>
                  <ActionIcon
                    variant="filled"
                    className="row-action"
                    size={40}
                    radius="xl"
                    style={{ backgroundColor: darkPillBg, border: "none" }}
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
