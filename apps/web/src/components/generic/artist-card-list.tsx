import type React from "react";
import { Group, Box, Text, ActionIcon, Menu, Center, Badge } from "@mantine/core";
import {
  IconHeart,
  IconHeartFilled,
  IconDots,
  IconEye,
  IconBrandSpotify,
} from "@tabler/icons-react";
import { API_URL } from "../../config/constants.js";

/** Circular thumbnail — same height as song-card-row */
const THUMB = 72;

interface ArtistCardListProps {
  records: any[];
  resource: string;
  imageCol: string | undefined;
  showPlatformLinks: boolean;
  platformType: "track" | "album" | "artist";
  onNavigate: (resource: string, id: number) => void;
  onToggleLike?: (resource: string, id: number) => void;
}

export const ArtistCardList = ({
  records,
  resource,
  imageCol,
  onNavigate,
  onToggleLike,
}: ArtistCardListProps) => (
  <Box
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(min(550px, 100%), 1fr))",
      gap: "var(--mantine-spacing-xs) var(--mantine-spacing-lg)",
    }}
  >
    {records.map((record: any) => {
      const year = record.created_at
        ? new Date(record.created_at).getFullYear()
        : null;
      const songCount: number | undefined = record.song_count;

      return (
        <Box key={record.id} className="artist-card-item">
          <Group wrap="nowrap" gap="md" py="sm" px="sm" align="center">
            {/* Circular artist thumbnail — 72×72 */}
            {imageCol && (
              <Box
                onClick={() => onNavigate(resource, record.id)}
                style={{
                  width: THUMB,
                  height: THUMB,
                  borderRadius: "50%",
                  overflow: "hidden",
                  flexShrink: 0,
                  background: "var(--mantine-color-dark-8)",
                  cursor: "pointer",
                }}
              >
                {record[imageCol] ? (
                  <img
                    src={`${API_URL}/api/storage/${record[imageCol]}`}
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
            )}

            {/* Content area */}
            <Box style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
              {/* Row 1: Artist name + year badge */}
              <Group gap="xs" wrap="nowrap">
                <Text
                  fw={500}
                  fz="sm"
                  truncate
                  className="clickable-name"
                  onClick={() => onNavigate(resource, record.id)}
                  style={{ cursor: "pointer" }}
                >
                  {record.name || ""}
                </Text>
                {year && (
                  <Badge
                    variant="light"
                    size="lg"
                    color="gray"
                    tt="none"
                    fw={400}
                    style={{ flexShrink: 0 }}
                  >
                    {year}
                  </Badge>
                )}
              </Group>

              {/* Row 2: Song count */}
              {songCount !== undefined && (
                <Text fz="sm" c="dimmed" mt="xs">
                  {songCount} {songCount === 1 ? "song" : "songs"}
                </Text>
              )}
            </Box>

            {/* Right side: spotify + heart + dots menu */}
            <Group gap="sm" wrap="nowrap" style={{ flexShrink: 0 }}>
              {record.spotify_uid && (
                <ActionIcon
                  variant="default"
                  className="row-action dark-pill"
                  size="xl"
                  component="a"
                  href={`https://open.spotify.com/artist/${record.spotify_uid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IconBrandSpotify size={16} />
                </ActionIcon>
              )}

              {onToggleLike && (
                <ActionIcon
                  variant="default"
                  className="row-action dark-pill"
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
                    className="row-action dark-pill"
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
  </Box>
);
