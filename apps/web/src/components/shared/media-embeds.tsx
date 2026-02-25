import { Stack } from "@mantine/core";

interface MediaEmbedsProps {
  spotifyId?: string | null;
  appleMusicId?: string | null;
  youtubeId?: string | null;
}

export const MediaEmbeds = ({ spotifyId, appleMusicId, youtubeId }: MediaEmbedsProps) => {
  const hasAny = spotifyId || appleMusicId || youtubeId;
  if (!hasAny) return null;

  return (
    <Stack gap="md" w={300}>
      {spotifyId && (
        <iframe
          src={`https://open.spotify.com/embed/track/${spotifyId}`}
          width={300}
          height={90}
          frameBorder={0}
          allow="encrypted-media"
          loading="lazy"
          style={{ borderRadius: 12, border: 0 }}
        />
      )}
      {appleMusicId && (
        <iframe
          src={`https://embed.music.apple.com/us/song/${appleMusicId}`}
          width={300}
          height={140}
          frameBorder={0}
          allow="autoplay; encrypted-media"
          loading="lazy"
          style={{ borderRadius: 12, border: 0 }}
        />
      )}
      {youtubeId && (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}`}
          width={300}
          height={169}
          frameBorder={0}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
          allowFullScreen
          loading="lazy"
          style={{ borderRadius: 12, border: 0 }}
        />
      )}
    </Stack>
  );
};
