import { useState, useRef } from "react";
import {
  FileInput,
  Group,
  Text,
  Loader,
  ActionIcon,
  Box,
} from "@mantine/core";
import { IconUpload, IconX } from "@tabler/icons-react";

const API_URL = import.meta.env.VITE_API_URL || "";

interface FileUploadProps {
  /** Current storage path value */
  value: string;
  /** Called with the storage path after successful upload, or empty string on clear */
  onChange: (path: string) => void;
  /** Accepted mime types (e.g., "image/*", "audio/*") */
  accept?: string;
  /** Storage subdirectory (e.g., "artists", "albums", "songs", "bin") */
  directory?: string;
  /** Field label */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Description text */
  description?: string;
}

export const FileUpload = ({
  value,
  onChange,
  accept = "image/*",
  directory,
  label = "File",
  placeholder = "Select a file",
  description,
}: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resetRef = useRef<() => void>(null);

  const handleFileChange = async (file: File | null) => {
    if (!file) {
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (directory) {
        formData.append("directory", directory);
      }

      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as Record<string, string>).error || `Upload failed (${res.status})`
        );
      }

      const data = (await res.json()) as { path: string; url: string };
      onChange(data.path);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    onChange("");
    setError(null);
    if (resetRef.current) {
      resetRef.current();
    }
  };

  return (
    <Box>
      <FileInput
        label={label}
        placeholder={placeholder}
        description={description}
        accept={accept}
        onChange={handleFileChange}
        leftSection={uploading ? <Loader size={16} /> : <IconUpload size={16} />}
        disabled={uploading}
        error={error}
        clearable={false}
        resetRef={resetRef}
      />
      {value && (
        <Group gap="xs" mt={4}>
          <Text size="xs" c="dimmed" style={{ wordBreak: "break-all" }}>
            Uploaded: {value}
          </Text>
          <ActionIcon
            size="xs"
            variant="subtle"
            color="red"
            onClick={handleClear}
            title="Clear file"
          >
            <IconX size={12} />
          </ActionIcon>
        </Group>
      )}
    </Box>
  );
};
