import { ActionIcon, Tooltip, Group } from "@mantine/core";
import { IconBrandSpotify, IconBrandApple, IconBrandYoutube } from "@tabler/icons-react";

interface PlatformLinksProps {
  spotifyId?: string | null;
  appleMusicId?: string | null;
  youtubeId?: string | null;
  size?: number;
  type?: "track" | "album" | "artist";
}

function buildSpotifyUrl(id: string, type: string): string {
  return `https://open.spotify.com/${type}/${id}`;
}

function buildAppleMusicUrl(id: string, type: string): string {
  const path = type === "track" ? "song" : type;
  return `https://music.apple.com/us/${path}/${id}`;
}

function buildYoutubeUrl(id: string, type: string): string {
  if (type === "artist") return `https://www.youtube.com/channel/${id}`;
  return `https://www.youtube.com/watch?v=${id}`;
}

export const PlatformLinks = ({ spotifyId, appleMusicId, youtubeId, size = 16, type = "track" }: PlatformLinksProps) => {
  const hasAny = spotifyId || appleMusicId || youtubeId;
  if (!hasAny) return null;

  return (
    <Group gap={4}>
      {spotifyId && (
        <Tooltip label="Open on Spotify">
          <ActionIcon variant="subtle" color="green" size="sm"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); window.open(buildSpotifyUrl(spotifyId, type), '_blank'); }}>
            <IconBrandSpotify size={size} />
          </ActionIcon>
        </Tooltip>
      )}
      {appleMusicId && (
        <Tooltip label="Open on Apple Music">
          <ActionIcon variant="subtle" color="gray" size="sm"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); window.open(buildAppleMusicUrl(appleMusicId, type), '_blank'); }}>
            <IconBrandApple size={size} />
          </ActionIcon>
        </Tooltip>
      )}
      {youtubeId && (
        <Tooltip label="Open on YouTube">
          <ActionIcon variant="subtle" color="red" size="sm"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); window.open(buildYoutubeUrl(youtubeId, type), '_blank'); }}>
            <IconBrandYoutube size={size} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
};
