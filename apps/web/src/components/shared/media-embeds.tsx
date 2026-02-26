import { useState } from "react";
import {
  Stack,
  Box,
  Text,
  Group,
  TextInput,
  ActionIcon,
  Loader,
} from "@mantine/core";
import {
  IconBrandSpotify,
  IconBrandApple,
  IconBrandYoutube,
  IconPlus,
  IconEdit,
  IconCheck,
  IconX,
} from "@tabler/icons-react";

interface MediaEmbedsProps {
  spotifyId?: string | null;
  appleMusicId?: string | null;
  youtubeId?: string | null;
  /** If provided, platform IDs become editable */
  onSave?: (field: string, value: string) => Promise<void>;
  /** Entity type — determines embed URLs (track vs album). Default "track". */
  type?: "track" | "album";
}

export const MediaEmbeds = ({
  spotifyId,
  appleMusicId,
  youtubeId,
  onSave,
  type = "track",
}: MediaEmbedsProps) => {
  const spotifyPath = type === "album" ? "album" : "track";
  const appleMusicPath = type === "album" ? "album" : "song";

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
        label="YouTube"
        icon={<IconBrandYoutube size={20} />}
        color="#FF0000"
        placeholder="YouTube video ID"
        onSave={onSave}
        renderEmbed={(id) => (
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
        )}
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
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(id ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(field, editValue);
      setEditing(false);
    } catch {
      // keep editing
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setEditValue(id ?? "");
  };

  const startEdit = () => {
    setEditValue(id ?? "");
    setEditing(true);
  };

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
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") handleCancel();
            }}
            autoFocus
          />
          {saving ? (
            <Loader size={16} />
          ) : (
            <Group gap={4} wrap="nowrap">
              <ActionIcon size="xs" variant="subtle" color="green" onClick={handleSave}>
                <IconCheck size={14} />
              </ActionIcon>
              <ActionIcon size="xs" variant="subtle" color="gray" onClick={handleCancel}>
                <IconX size={14} />
              </ActionIcon>
            </Group>
          )}
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
              <IconEdit size={12} />
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
        border: "1px dashed var(--mantine-color-dark-4)",
        backgroundColor: "var(--mantine-color-dark-6)",
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
