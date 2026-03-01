import { Box, Text } from "@mantine/core";
import { IconMusic } from "@tabler/icons-react";
import { API_URL } from "../../config/constants.js";

interface AudioPlayerProps {
  path?: string | null;
  label?: string;
}

/**
 * Simple audio player that plays files from storage.
 * Accepts a storage path (e.g. "bin/abc123.mp3") and builds the full URL.
 */
export const AudioPlayer = ({ path, label }: AudioPlayerProps) => {
  if (!path) {
    return (
      <Box
        p="md"
        style={{
          border: "1px dashed var(--mantine-color-dark-4)",
          borderRadius: "var(--mantine-radius-sm)",
        }}
      >
        <Text size="sm" c="dimmed" ta="center">
          No audio file available
        </Text>
      </Box>
    );
  }

  const src = `${API_URL}/api/storage/${path}`;
  const fileName = label || path.split("/").pop() || "Audio";

  return (
    <Box
      p="sm"
      style={{
        border: "1px solid var(--mantine-color-dark-4)",
        borderRadius: "var(--mantine-radius-sm)",
        backgroundColor: "var(--mantine-color-dark-6)",
      }}
    >
      <Text size="sm" fw={500} mb="xs" style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <IconMusic size={16} />
        {fileName}
      </Text>
      <audio controls src={src} style={{ width: "100%" }}>
        Your browser does not support the audio element.
      </audio>
    </Box>
  );
};
