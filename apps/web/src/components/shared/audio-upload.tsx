import { useState, useRef, useCallback } from "react";
import { Box, Text, Loader, Group, ActionIcon, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconMusic, IconUpload, IconReplace } from "@tabler/icons-react";

const API_URL = import.meta.env.VITE_API_URL || "";

interface AudioUploadProps {
  /** Current storage path */
  path: string | null | undefined;
  /** Called with new storage path after upload */
  onUpload: (path: string) => void;
  /** Upload accept filter */
  accept?: string;
  /** Storage subdirectory */
  directory?: string;
}

export const AudioUpload = ({
  path,
  onUpload,
  accept = "audio/*",
  directory,
}: AudioUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const upload = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        if (directory) formData.append("directory", directory);

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
        onUpload(data.path);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        notifications.show({ title: "Upload error", message, color: "red" });
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [directory, onUpload]
  );

  const handleClick = () => {
    if (!uploading) fileRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  const dragHandlers = {
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
  };

  const src = path ? `${API_URL}/api/storage/${path}` : null;
  const fileName = path?.split("/").pop() || "Audio";

  const input = (
    <input
      ref={fileRef}
      type="file"
      accept={accept}
      onChange={handleFileChange}
      style={{ display: "none" }}
    />
  );

  // Empty state — placeholder with click + drag-drop
  if (!src) {
    return (
      <>
        {input}
        <Box
          onClick={handleClick}
          {...dragHandlers}
          p="xl"
          style={{
            cursor: "pointer",
            border: `1px dashed var(--mantine-color-${dragging ? "violet-6" : "dark-4"})`,
            borderRadius: "var(--mantine-radius-sm)",
            backgroundColor: dragging
              ? "var(--mantine-color-violet-light)"
              : "var(--mantine-color-dark-6)",
            transition: "border-color 0.2s, background-color 0.2s",
          }}
        >
          <Group justify="center" gap="xs">
            {uploading ? (
              <Loader size={20} />
            ) : (
              <>
                <IconMusic size={20} color="var(--mantine-color-dimmed)" />
                <Text size="sm" c="dimmed">
                  Click or drag audio file to upload
                </Text>
              </>
            )}
          </Group>
        </Box>
      </>
    );
  }

  // Has audio — player with replace button
  return (
    <>
      {input}
      <Box
        {...dragHandlers}
        p="sm"
        style={{
          border: `1px solid var(--mantine-color-${dragging ? "violet-6" : "dark-4"})`,
          borderRadius: "var(--mantine-radius-sm)",
          backgroundColor: dragging
            ? "var(--mantine-color-violet-light)"
            : "var(--mantine-color-dark-6)",
          transition: "border-color 0.2s, background-color 0.2s",
        }}
      >
        <Group justify="space-between" mb="xs">
          <Text
            size="sm"
            fw={500}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <IconMusic size={16} />
            {fileName}
          </Text>
          <Tooltip label="Replace audio" position="left">
            <ActionIcon
              size="sm"
              variant="subtle"
              color="gray"
              onClick={handleClick}
              loading={uploading}
            >
              <IconReplace size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
        <audio controls src={src} style={{ width: "100%" }}>
          Your browser does not support the audio element.
        </audio>
      </Box>
    </>
  );
};
