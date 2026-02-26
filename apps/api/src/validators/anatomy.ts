import { z } from "zod";

const isrcRegex = /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/;
const isniRegex = /^\d{15}[\dX]$/;

export const createAnatomySongSchema = z.object({
  name: z.string().min(1).max(200),
  isrc: z.string().regex(isrcRegex, "Invalid ISRC format"),
  imagePath: z.string().nullable().optional(),
  releaseDate: z.string().min(1, "Release date is required"),
  rating: z.number().int().min(0).max(5).default(0),
  spotifyId: z.string().nullable().optional(),
  appleMusicId: z.string().nullable().optional(),
  youtubeId: z.string().nullable().optional(),
});

export const updateAnatomySongSchema = createAnatomySongSchema.partial().extend({
  archived: z.boolean().optional(),
});

export const createAnatomyArtistSchema = z.object({
  name: z.string().min(1).max(200),
  isni: z.string().regex(isniRegex, "Invalid ISNI format (16 digits)"),
  imagePath: z.string().nullable().optional(),
  rating: z.number().int().min(0).max(5).default(0),
});

export const updateAnatomyArtistSchema = createAnatomyArtistSchema.partial().extend({
  archived: z.boolean().optional(),
});

export const createAttributeSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  instruction: z.string().nullable().optional(),
  examples: z.string().nullable().optional(),
});

export const updateAttributeSchema = createAttributeSchema.partial().extend({
  archived: z.boolean().optional(),
});

export const createProfileSchema = z.object({
  value: z.string().refine(
    (val) => {
      try {
        const parsed = JSON.parse(val);
        return typeof parsed === "object" && !Array.isArray(parsed);
      } catch {
        return false;
      }
    },
    { message: "Value must be a valid JSON object" }
  ),
});

export const updateProfileSchema = z.object({
  value: z.string().refine(
    (val) => {
      try {
        const parsed = JSON.parse(val);
        return typeof parsed === "object" && !Array.isArray(parsed);
      } catch {
        return false;
      }
    },
    { message: "Value must be a valid JSON object" }
  ).optional(),
  archived: z.boolean().optional(),
});

export const importUrlSchema = z.object({
  url: z.string().url("Must be a valid URL"),
});

export const assignArtistSchema = z.object({
  artistId: z.string().min(1),
});

export const createAnatomyAlbumSchema = z.object({
  name: z.string().min(1),
  ean: z.string().optional(),
  imagePath: z.string().optional(),
  releaseDate: z.string().optional(),
  rating: z.number().int().min(0).max(5).optional(),
  spotifyId: z.string().optional(),
  appleMusicId: z.string().optional(),
  youtubeId: z.string().optional(),
});

export const updateAnatomyAlbumSchema = createAnatomyAlbumSchema.partial().extend({
  archived: z.boolean().optional(),
});

export const assignAlbumSchema = z.object({
  albumId: z.string().min(1),
});

export const smartSearchSchema = z.object({
  q: z.string().min(1),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
