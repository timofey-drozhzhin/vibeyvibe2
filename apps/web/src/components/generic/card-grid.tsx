import { Group, Box, Text, ActionIcon, Stack } from "@mantine/core";
import {
  IconHeart,
  IconHeartFilled,
} from "@tabler/icons-react";
import { PlatformLinks } from "../shared/platform-links.js";
import { API_URL } from "../../config/constants.js";

interface CardGridProps {
  records: any[];
  resource: string;
  imageCol: string | undefined;
  showPlatformLinks: boolean;
  platformType: "track" | "album" | "artist";
  onNavigate: (resource: string, id: number) => void;
  onToggleLike?: (resource: string, id: number) => void;
}

const IMG_SIZE = 48;

export const CardGrid = ({
  records,
  resource,
  imageCol,
  showPlatformLinks,
  platformType,
  onNavigate,
  onToggleLike,
}: CardGridProps) => (
  <Stack gap={0}>
    {records.map((record: any) => (
      <Box
        key={record.id}
        className="card-grid-item"
        onClick={() => onNavigate(resource, record.id)}
        style={{ cursor: "pointer" }}
      >
        <Group wrap="nowrap" gap="sm" py={8} px={4}>
          {/* Circular image */}
          {imageCol && (
            <Box
              style={{
                width: IMG_SIZE,
                height: IMG_SIZE,
                borderRadius: "50%",
                overflow: "hidden",
                flexShrink: 0,
                background: "var(--mantine-color-dark-8)",
              }}
            >
              {record[imageCol] ? (
                <img
                  src={`${API_URL}/api/storage/${record[imageCol]}`}
                  alt={record.name || ""}
                  style={{
                    width: IMG_SIZE,
                    height: IMG_SIZE,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : (
                <Box
                  style={{
                    width: IMG_SIZE,
                    height: IMG_SIZE,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text fz="xs" c="dimmed">
                    No img
                  </Text>
                </Box>
              )}
            </Box>
          )}

          {/* Text content */}
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text fw={500} size="sm" truncate>
              {record.name || ""}
            </Text>
            <Group gap={6} mt={2}>
              {onToggleLike && (
                <ActionIcon
                  variant="subtle"
                  color={record.liked ? "red" : "gray"}
                  size="xs"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onToggleLike(resource, record.id);
                  }}
                >
                  {record.liked ? (
                    <IconHeartFilled size={14} />
                  ) : (
                    <IconHeart size={14} />
                  )}
                </ActionIcon>
              )}
              {showPlatformLinks && (
                <Box
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                >
                  <PlatformLinks
                    spotifyId={record.spotify_uid}
                    appleMusicId={record.apple_music_uid}
                    youtubeId={record.youtube_uid}
                    type={platformType}
                    size={14}
                  />
                </Box>
              )}
            </Group>
          </Box>
        </Group>
      </Box>
    ))}
  </Stack>
);
