import { useState, useRef } from "react";
import { Image, Box, Loader } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPhoto, IconUpload } from "@tabler/icons-react";
import { API_URL } from "../../config/constants.js";

interface ImageUploadProps {
  /** Current storage path */
  path: string | null | undefined;
  /** Called with new storage path after upload */
  onUpload: (path: string) => void;
  /** Image alt text */
  alt?: string;
  /** Display size in px */
  size?: number;
  /** Upload accept filter */
  accept?: string;
  /** Storage subdirectory */
  directory?: string;
}

/**
 * Combined image preview + click-to-upload component.
 * Shows the current image (or a placeholder) and opens a file picker on click.
 */
export const ImageUpload = ({
  path,
  onUpload,
  alt = "Image",
  size = 300,
  accept = "image/*",
  directory,
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!uploading) {
      fileRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
        throw new Error((body as Record<string, string>).error || `Upload failed (${res.status})`);
      }

      const data = (await res.json()) as { path: string; url: string };
      onUpload(data.path);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      notifications.show({ title: "Upload error", message, color: "red" });
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const src = path ? `${API_URL}/api/storage/${path}` : null;

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <Box
        onClick={handleClick}
        style={{
          cursor: "pointer",
          position: "relative",
          width: size,
          height: size,
          borderRadius: "var(--mantine-radius-md)",
          overflow: "hidden",
        }}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            w={size}
            h={size}
            radius="md"
            fit="cover"
          />
        ) : (
          <Box
            style={{
              width: size,
              height: size,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderRadius: "var(--mantine-radius-md)",
              border: "1px dashed var(--mantine-color-dark-4)",
              backgroundColor: "var(--mantine-color-dark-6)",
            }}
          >
            {uploading ? (
              <Loader size={size * 0.15} />
            ) : (
              <>
                <IconPhoto size={size * 0.2} color="var(--mantine-color-dimmed)" />
                <IconUpload size={size * 0.1} color="var(--mantine-color-dimmed)" />
              </>
            )}
          </Box>
        )}
        {/* Upload overlay on hover */}
        {src && (
          <Box
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.5)",
              opacity: 0,
              transition: "opacity 0.2s",
              borderRadius: "var(--mantine-radius-md)",
            }}
            className="image-upload-overlay"
          >
            {uploading ? (
              <Loader size={32} color="white" />
            ) : (
              <IconUpload size={32} color="white" />
            )}
          </Box>
        )}
      </Box>
      <style>{`
        .image-upload-overlay:hover {
          opacity: 1 !important;
        }
      `}</style>
    </>
  );
};
