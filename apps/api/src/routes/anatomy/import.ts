import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { importUrlSchema } from "../../validators/anatomy.js";

export const anatomyImportRoutes = new Hono();

function detectUrlType(url: string): "spotify" | "unknown" {
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname === "open.spotify.com" ||
      parsed.hostname === "spotify.link"
    ) {
      return "spotify";
    }
    return "unknown";
  } catch {
    return "unknown";
  }
}

// POST /import - Accept a URL, detect type, and return parsed data
anatomyImportRoutes.post(
  "/import",
  zValidator("json", importUrlSchema),
  async (c) => {
    const { url } = c.req.valid("json");
    const type = detectUrlType(url);

    if (type === "unknown") {
      return c.json(
        { error: "Unsupported URL. Currently only Spotify URLs are supported." },
        400
      );
    }

    // Placeholder response - actual Spotify parsing will be implemented later
    // with the spotify-url-info library
    return c.json({
      data: {
        type,
        url,
        parsed: null,
        message:
          "Spotify import is not yet implemented. The URL has been validated as a Spotify link.",
      },
    });
  }
);
