import { SimpleGrid, Group, Box, Text, ActionIcon, Menu, Center } from "@mantine/core";
import {
  IconHeart,
  IconHeartFilled,
  IconDots,
  IconEye,
  IconBrandSpotify,
} from "@tabler/icons-react";
import { API_URL } from "../../config/constants.js";
import { darkPillBg, pillIconColor, likedIconColor } from "./card-styles.js";

/** Circular thumbnail — same height as song-card-row */
const THUMB = 72;

interface ArtistCardListProps {
  records: any[];
  resource: string;
  imageCol: string | undefined;
  showPlatformLinks: boolean;
  platformType: "track" | "album" | "artist";
  onNavigate: (resource: string, id: number) => void;
  onToggleLike: (resource: string, id: number) => void;
}

export const ArtistCardList = ({
  records,
  resource,
  imageCol,
  onNavigate,
  onToggleLike,
}: ArtistCardListProps) => (
  <SimpleGrid
    cols={{ base: 1, sm: 2, md: 3 }}
    spacing="lg"
    verticalSpacing="xs"
  >
    {records.map((record: any) => (
      <Box key={record.id} className="artist-card-item">
        <Group wrap="nowrap" gap={16} py={12} px={12} align="center">
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
                background: "var(--mantine-color-dark-5)",
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
                  <Text size="10px" c="dimmed">
                    No img
                  </Text>
                </Center>
              )}
            </Box>
          )}

          {/* Content area */}
          <Box style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
            {/* Row 1: Artist name (clickable) */}
            <Text
              fw={500}
              fz={14}
              lh="16px"
              c="rgb(247, 244, 239)"
              truncate
              className="clickable-name"
              onClick={() => onNavigate(resource, record.id)}
              style={{ cursor: "pointer" }}
            >
              {record.name || ""}
            </Text>

            {/* Row 2: Action icons — Suno-style dark pills */}
            <Group gap={6} mt={8}>
              <ActionIcon
                variant="filled"
                className="row-action"
                size={32}
                radius="xl"
                style={{ backgroundColor: darkPillBg, border: "none" }}
                onClick={() => onToggleLike(resource, record.id)}
              >
                {record.liked ? (
                  <IconHeartFilled size={16} color={likedIconColor} />
                ) : (
                  <IconHeart size={16} color={pillIconColor} />
                )}
              </ActionIcon>
              {record.spotify_uid && (
                <ActionIcon
                  variant="filled"
                  className="row-action"
                  size={32}
                  radius="xl"
                  style={{ backgroundColor: darkPillBg, border: "none" }}
                  component="a"
                  href={`https://open.spotify.com/artist/${record.spotify_uid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IconBrandSpotify size={16} color={pillIconColor} />
                </ActionIcon>
              )}
            </Group>
          </Box>

          {/* Right side: date + dots menu */}
          <Group gap="lg" wrap="nowrap" style={{ flexShrink: 0 }}>
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
    ))}
  </SimpleGrid>
);
