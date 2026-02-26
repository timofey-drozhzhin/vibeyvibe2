import { Hono } from "hono";
import { createStorageClient } from "../services/storage/index.js";

export const storageRoutes = new Hono();

// GET /* - Serve files from storage
storageRoutes.get("/*", async (c) => {
  const path = c.req.param("*");

  if (!path) {
    return c.json({ error: "No file path specified" }, 400);
  }

  const storage = createStorageClient();

  const exists = await storage.exists(path);
  if (!exists) {
    return c.json({ error: "File not found" }, 404);
  }

  const data = await storage.download(path);

  // Determine content type from extension
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const contentTypeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    ico: "image/x-icon",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    flac: "audio/flac",
    aac: "audio/aac",
    m4a: "audio/mp4",
    wma: "audio/x-ms-wma",
  };

  const contentType = contentTypeMap[ext] || "application/octet-stream";

  return new Response(data, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
});
