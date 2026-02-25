import { ActionIcon, Tooltip, Group } from "@mantine/core";
import { IconBrandSpotify, IconBrandApple, IconBrandYoutube } from "@tabler/icons-react";

interface PlatformLinksProps {
  spotifyId?: string | null;
  appleMusicId?: string | null;
  youtubeId?: string | null;
  size?: number;
}

export const PlatformLinks = ({ spotifyId, appleMusicId, youtubeId, size = 16 }: PlatformLinksProps) => {
  const hasAny = spotifyId || appleMusicId || youtubeId;
  if (!hasAny) return null;

  return (
    <Group gap={4}>
      {spotifyId && (
        <Tooltip label="Open on Spotify">
          <ActionIcon variant="subtle" color="green" size="sm"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); window.open(`https://open.spotify.com/track/${spotifyId}`, '_blank'); }}>
            <IconBrandSpotify size={size} />
          </ActionIcon>
        </Tooltip>
      )}
      {appleMusicId && (
        <Tooltip label="Open on Apple Music">
          <ActionIcon variant="subtle" color="gray" size="sm"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); window.open(`https://music.apple.com/us/song/${appleMusicId}`, '_blank'); }}>
            <IconBrandApple size={size} />
          </ActionIcon>
        </Tooltip>
      )}
      {youtubeId && (
        <Tooltip label="Open on YouTube">
          <ActionIcon variant="subtle" color="red" size="sm"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); window.open(`https://www.youtube.com/watch?v=${youtubeId}`, '_blank'); }}>
            <IconBrandYoutube size={size} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
};
