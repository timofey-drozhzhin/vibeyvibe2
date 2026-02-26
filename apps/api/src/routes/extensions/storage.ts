import { Hono } from "hono";
import { createStorageClient } from "../../services/storage/index.js";

const storageRoutes = new Hono();

// GET /* - Serve files from storage with Range request support
storageRoutes.get("/*", async (c) => {
  // In nested Hono routes, c.req.param("*") can be empty.
  // Extract the storage path by stripping the /api/storage/ prefix from the full path.
  const prefix = "/api/storage/";
  const path = c.req.path.startsWith(prefix)
    ? c.req.path.slice(prefix.length)
    : c.req.param("*");

  if (!path) {
    return c.json({ error: "No file path specified" }, 400);
  }

  const storage = createStorageClient();

  const exists = await storage.exists(path);
  if (!exists) {
    return c.json({ error: "File not found" }, 404);
  }

  const data = await storage.download(path);
  const totalSize = data.byteLength;

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

  const rangeHeader = c.req.header("Range");

  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : totalSize - 1;

      if (start >= totalSize || end >= totalSize || start > end) {
        return new Response(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${totalSize}` },
        });
      }

      const slice = data.slice(start, end + 1);
      return new Response(slice, {
        status: 206,
        headers: {
          "Content-Type": contentType,
          "Content-Length": String(slice.byteLength),
          "Content-Range": `bytes ${start}-${end}/${totalSize}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  }

  return new Response(data, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(totalSize),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
});

export default storageRoutes;
