import { Hono } from "hono";
import { nanoid } from "nanoid";
import { createStorageClient } from "../services/storage/index.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_PREFIXES = ["image/", "audio/"];

function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));
}

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filename.slice(lastDot);
}

const VALID_DIRECTORIES = ["artists", "albums", "songs", "bin"];

export const uploadRoutes = new Hono();

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

  // Generate unique filename
  const ext = getExtension(file.name);
  const uniqueName = `${nanoid()}${ext}`;
  const storagePath = directory ? `${directory}/${uniqueName}` : uniqueName;

  // Upload to storage
  const storage = createStorageClient();
  const arrayBuffer = await file.arrayBuffer();
  await storage.upload(storagePath, arrayBuffer, file.type);

  const url = storage.getPublicUrl(storagePath);

  return c.json({ path: storagePath, url }, 201);
});
