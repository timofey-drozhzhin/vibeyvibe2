import { Image, Box, Text } from "@mantine/core";
import { IconPhoto } from "@tabler/icons-react";

const API_URL = import.meta.env.VITE_API_URL || "";

interface ImagePreviewProps {
  /** Storage path (e.g., "artists/abc123.jpg") */
  path: string | null | undefined;
  /** Image width and height in pixels */
  size?: number;
  /** Alt text for the image */
  alt?: string;
}

export const ImagePreview = ({
  path,
  size = 120,
  alt = "Image",
}: ImagePreviewProps) => {
  if (!path) {
    return (
      <Box
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--mantine-radius-md)",
          border: "1px dashed var(--mantine-color-dark-4)",
          backgroundColor: "var(--mantine-color-dark-6)",
        }}
      >
        <IconPhoto size={size * 0.3} color="var(--mantine-color-dimmed)" />
      </Box>
    );
  }

  const src = `${API_URL}/api/storage/${path}`;

  return (
    <Image
      src={src}
      alt={alt}
      w={size}
      h={size}
      radius="md"
      fit="cover"
      fallbackSrc={undefined}
    />
  );
};
