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

/** Square thumbnail */
const THUMB = 72;

interface AlbumCardListProps {
  records: any[];
  resource: string;
  imageCol: string | undefined;
  showPlatformLinks: boolean;
  platformType: "track" | "album" | "artist";
  onNavigate: (resource: string, id: number) => void;
  onToggleLike: (resource: string, id: number) => void;
}

export const AlbumCardList = ({
  records,
  resource,
  imageCol,
  onNavigate,
  onToggleLike,
}: AlbumCardListProps) => (
  <Box
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(min(550px, 100%), 1fr))",
      gap: "var(--mantine-spacing-xs) var(--mantine-spacing-lg)",
    }}
  >
    {records.map((record: any) => {
      const year = record.release_date
        ? new Date(record.release_date).getFullYear()
        : null;
      const songCount: number | undefined = record.song_count;
      const artistsList: { id: number; name: string }[] =
        Array.isArray(record.artists) ? record.artists : [];
      const artistResource = resource.replace(/\/[^/]+$/, "/artists");

      return (
        <Box key={record.id} className="artist-card-item">
          <Group wrap="nowrap" gap="md" py="sm" px="sm" align="center">
            {/* Square album thumbnail — 72×72 */}
            {imageCol && (
              <Box
                onClick={() => onNavigate(resource, record.id)}
                style={{
                  width: THUMB,
                  height: THUMB,
                  borderRadius: "var(--mantine-radius-md)",
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
                    <Text fz={10} c="dimmed">
                      No img
                    </Text>
                  </Center>
                )}
              </Box>
            )}

            {/* Content area */}
            <Box style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
              {/* Row 1: Album name + release year badge */}
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

              {/* Row 2: Artist names + song count */}
              <Group gap={4} wrap="nowrap" mt="xs" style={{ overflow: "hidden" }}>
                {artistsList.length > 0 ? (
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
                ) : null}
                {songCount !== undefined && songCount > 0 && (
                  <Text fz="sm" c="dimmed" style={{ flexShrink: 0 }}>
                    {artistsList.length > 0 ? " \u00B7 " : ""}
                    {songCount} {songCount === 1 ? "song" : "songs"}
                  </Text>
                )}
              </Group>
            </Box>

            {/* Right side: spotify + heart + dots menu */}
            <Group gap="sm" wrap="nowrap" style={{ flexShrink: 0 }}>
              {record.spotify_uid && (
                <ActionIcon
                  variant="default"
                  className="row-action dark-pill"
                  size="xl"
                  component="a"
                  href={`https://open.spotify.com/album/${record.spotify_uid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IconBrandSpotify size={16} />
                </ActionIcon>
              )}

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
