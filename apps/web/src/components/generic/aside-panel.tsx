import { Stack } from "@mantine/core";
import { ImageUpload } from "../shared/image-upload.js";
import { MediaEmbeds } from "../shared/media-embeds.js";
import type { FieldDef, EntityDef } from "../../config/entity-registry.js";

interface AsidePanelProps {
  fields: FieldDef[];
  record: any;
  onSave: (field: string, value: any) => Promise<void>;
  entity: EntityDef;
}

/**
 * Maps MediaEmbeds callback field names back to entity registry field keys.
 * MediaEmbeds uses "spotifyId", "appleMusicId", "youtubeId" as callback field names.
 * The entity registry uses "spotify_uid", "apple_music_uid", "youtube_uid".
 */
const mediaFieldToEntityKey: Record<string, string> = {
  spotifyId: "spotify_uid",
  appleMusicId: "apple_music_uid",
  youtubeId: "youtube_uid",
};

export const AsidePanel = ({ fields, record, onSave, entity }: AsidePanelProps) => {
  // Find the image field
  const imageField = fields.find((f) => f.type === "image");

  // Find uid fields
  const uidFields = fields.filter((f) => f.type === "uid");

  // Determine embed type from the uid fields (they should all share the same embedType)
  const embedType = uidFields.find((f) => f.embedType)?.embedType ?? "track";

  // Build platform ID values from uid fields
  const spotifyField = uidFields.find((f) => f.platform === "spotify");
  const appleMusicField = uidFields.find((f) => f.platform === "apple_music");
  const youtubeField = uidFields.find((f) => f.platform === "youtube");

  const spotifyId = spotifyField ? record[spotifyField.key] ?? null : null;
  const appleMusicId = appleMusicField ? record[appleMusicField.key] ?? null : null;
  const youtubeId = youtubeField ? record[youtubeField.key] ?? null : null;

  const hasMediaEmbeds = uidFields.length > 0;

  const handleMediaSave = async (mediaField: string, value: string) => {
    const entityKey = mediaFieldToEntityKey[mediaField];
    if (entityKey) {
      await onSave(entityKey, value);
    }
  };

  return (
    <Stack gap="md">
      {imageField && (
        <ImageUpload
          path={record[imageField.key] ?? null}
          onUpload={(path) => onSave(imageField.key, path)}
          alt={record.name || entity.name}
          size={300}
          directory={imageField.directory}
        />
      )}
      {hasMediaEmbeds && (
        <MediaEmbeds
          spotifyId={spotifyId}
          appleMusicId={appleMusicId}
          youtubeId={youtubeId}
          onSave={handleMediaSave}
          type={embedType}
        />
      )}
    </Stack>
  );
};
