import {
  Stack,
  Box,
  Text,
  Group,
  TextInput,
  ActionIcon,
} from "@mantine/core";
import {
  IconBrandSpotify,
  IconBrandApple,
  IconBrandYoutube,
  IconPlus,
  IconEdit,
} from "@tabler/icons-react";
import { useInlineEdit } from "../../hooks/use-inline-edit.js";
import { SaveCancelActions } from "./save-cancel-actions.js";

interface MediaEmbedsProps {
  spotifyId?: string | null;
  appleMusicId?: string | null;
  youtubeId?: string | null;
  /** If provided, platform IDs become editable */
  onSave?: (field: string, value: string) => Promise<void>;
  /** Entity type — determines embed URLs (track vs album vs artist). Default "track". */
  type?: "track" | "album" | "artist";
}

export const MediaEmbeds = ({
  spotifyId,
  appleMusicId,
  youtubeId,
  onSave,
  type = "track",
}: MediaEmbedsProps) => {
  const spotifyPath = type; // "track", "album", or "artist" — Spotify embed supports all three
  const appleMusicPath = type === "album" ? "album" : type === "artist" ? "artist" : "song";

  return (
    <Stack gap="md" w={300}>
      <PlatformEmbed
        id={spotifyId}
        platform="spotify"
        field="spotifyId"
        label="Spotify"
        icon={<IconBrandSpotify size={20} />}
        color="#1DB954"
        placeholder={`Spotify ${type} ID`}
        onSave={onSave}
        renderEmbed={(id) => (
          <iframe
            src={`https://open.spotify.com/embed/${spotifyPath}/${id}`}
            width={300}
            height={80}
            frameBorder={0}
            allow="encrypted-media"
            loading="lazy"
            style={{ borderRadius: 12, border: 0 }}
          />
        )}
      />
      <PlatformEmbed
        id={appleMusicId}
        platform="appleMusic"
        field="appleMusicId"
        label="Apple Music"
        icon={<IconBrandApple size={20} />}
        color="#FC3C44"
        placeholder={`Apple Music ${type} ID`}
        onSave={onSave}
        renderEmbed={(id) => (
          <iframe
            src={`https://embed.music.apple.com/us/${appleMusicPath}/${id}`}
            width={300}
            height={140}
            frameBorder={0}
            allow="autoplay; encrypted-media"
            loading="lazy"
            style={{ borderRadius: 12, border: 0 }}
          />
        )}
      />
      <PlatformEmbed
        id={youtubeId}
        platform="youtube"
        field="youtubeId"
        label={type === "artist" ? "YouTube Channel" : "YouTube"}
        icon={<IconBrandYoutube size={20} />}
        color="#FF0000"
        placeholder={type === "artist" ? "YouTube channel ID" : "YouTube video ID"}
        onSave={onSave}
        renderEmbed={(id) =>
          type === "artist" ? (
            <Box
              component="a"
              href={`https://www.youtube.com/channel/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                borderRadius: 12,
                border: "1px solid var(--mantine-color-dark-7)",
                backgroundColor: "var(--mantine-color-dark-8)",
                padding: "12px 16px",
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              <Group gap="xs" justify="center">
                <IconBrandYoutube size={20} color="#FF0000" />
                <Text size="sm" c="dimmed">Open YouTube Channel</Text>
              </Group>
            </Box>
          ) : (
            <iframe
              src={`https://www.youtube.com/embed/${id}`}
              width={300}
              height={169}
              frameBorder={0}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
              allowFullScreen
              loading="lazy"
              style={{ borderRadius: 12, border: 0 }}
            />
          )
        }
      />
    </Stack>
  );
};

// ---------------------------------------------------------------------------
// Internal: single platform embed with add/edit capability
// ---------------------------------------------------------------------------

interface PlatformEmbedProps {
  id: string | null | undefined;
  platform: string;
  field: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  placeholder: string;
  onSave?: (field: string, value: string) => Promise<void>;
  renderEmbed: (id: string) => React.ReactNode;
}

const PlatformEmbed = ({
  id,
  field,
  label,
  icon,
  color,
  placeholder,
  onSave,
  renderEmbed,
}: PlatformEmbedProps) => {
  const {
    editing,
    editValue,
    setEditValue,
    saving,
    startEdit,
    cancel,
    save,
    handleKeyDown,
  } = useInlineEdit(id, {
    onSave: async (value) => {
      if (onSave) await onSave(field, value);
    },
  });

  // Editing mode
  if (editing) {
    return (
      <Box>
        <Group gap="xs" mb={4}>
          {icon}
          <Text size="xs" fw={600}>{label}</Text>
        </Group>
        <Group gap="xs" wrap="nowrap">
          <TextInput
            size="xs"
            value={editValue}
            onChange={(e) => setEditValue(e.currentTarget.value)}
            placeholder={placeholder}
            style={{ flex: 1 }}
            disabled={saving}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <SaveCancelActions saving={saving} onSave={save} onCancel={cancel} />
        </Group>
      </Box>
    );
  }

  // Has ID — show embed + edit link
  if (id) {
    return (
      <Box>
        {renderEmbed(id)}
        {onSave && (
          <Group gap={4} mt={4} justify="flex-end">
            <ActionIcon
              size="xs"
              variant="subtle"
              color="gray"
              onClick={startEdit}
              title={`Edit ${label} ID`}
            >
              <IconEdit size={14} />
            </ActionIcon>
          </Group>
        )}
      </Box>
    );
  }

  // No ID — show placeholder
  if (!onSave) return null;

  return (
    <Box
      onClick={startEdit}
      style={{
        cursor: "pointer",
        borderRadius: 12,
        border: "1px dashed var(--mantine-color-dark-7)",
        backgroundColor: "var(--mantine-color-dark-8)",
        padding: "12px 16px",
      }}
    >
      <Group gap="xs" justify="center">
        <Box style={{ color }}>{icon}</Box>
        <Text size="xs" c="dimmed">Click to add {label}</Text>
        <IconPlus size={12} color="var(--mantine-color-dimmed)" />
      </Group>
    </Box>
  );
};
