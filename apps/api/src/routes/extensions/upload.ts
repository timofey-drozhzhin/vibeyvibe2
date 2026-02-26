import { Hono } from "hono";
import { createStorageClient } from "../../services/storage/index.js";
import { processImage } from "../../services/image/index.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_PREFIXES = ["image/", "audio/"];

function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));
}

const VALID_DIRECTORIES = ["artists", "albums", "songs", "bin"];

const uploadRoutes = new Hono();

// POST / - Upload a file
uploadRoutes.post("/", async (c) => {
  const body = await c.req.parseBody();

  const file = body["file"];
  if (!file || !(file instanceof File)) {
    return c.json({ error: "No file provided" }, 400);
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return c.json(
      { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
      400
    );
  }

  // Validate mime type
  if (!file.type || !isAllowedMimeType(file.type)) {
    return c.json(
      { error: `Invalid file type: ${file.type || "unknown"}. Allowed: image/*, audio/*` },
      400
    );
  }

  // Get optional directory
  const directoryRaw = body["directory"];
  const directory =
    typeof directoryRaw === "string" && VALID_DIRECTORIES.includes(directoryRaw)
      ? directoryRaw
      : undefined;

  const isImage = file.type.startsWith("image/");
  let fileData = await file.arrayBuffer();
  let contentType = file.type;
  let ext = isImage ? ".jpg" : file.name.slice(file.name.lastIndexOf("."));

  // Process images: downscale to 600x600 square JPEG
  if (isImage) {
    fileData = await processImage(fileData);
    contentType = "image/jpeg";
  }

  // Generate unique filename
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
  const storagePath = directory ? `${directory}/${uniqueName}` : uniqueName;

  // Upload to storage
  const storage = createStorageClient();
  await storage.upload(storagePath, fileData, contentType);

  const url = storage.getPublicUrl(storagePath);

  return c.json({ path: storagePath, url }, 201);
});

export default uploadRoutes;
