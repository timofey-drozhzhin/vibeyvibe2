import { z } from "zod";

const isrcRegex = /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/;
const isniRegex = /^\d{15}[\dX]$/;
const eanRegex = /^\d{13}$/;
const tiktokRegex = /^@[a-zA-Z0-9_.]+$/;
const instagramRegex = /^[a-zA-Z0-9_.]{1,30}$/;
const youtubeRegex = /^@[a-zA-Z0-9_.-]+$/;

export const createSongSchema = z.object({
  name: z.string().min(1).max(200),
  isrc: z.string().regex(isrcRegex, "Invalid ISRC format").nullable().optional(),
  imagePath: z.string().nullable().optional(),
  releaseDate: z.string().nullable().optional(),
  rating: z.number().min(0).max(10).default(0),
  spotifyId: z.string().nullable().optional(),
  appleMusicId: z.string().nullable().optional(),
  youtubeId: z.string().nullable().optional(),
});

export const updateSongSchema = createSongSchema.partial().extend({
  archived: z.boolean().optional(),
});

export const createArtistSchema = z.object({
  name: z.string().min(1).max(200),
  isni: z.string().regex(isniRegex, "Invalid ISNI format (16 digits)").nullable().optional(),
  imagePath: z.string().nullable().optional(),
  rating: z.number().min(0).max(10).default(0),
  spotifyId: z.string().nullable().optional(),
  youtubeUsername: z.string().regex(youtubeRegex, "YouTube username must start with @").nullable().optional(),
  tiktokUsername: z.string().regex(tiktokRegex, "TikTok username must start with @").nullable().optional(),
  instagramUsername: z.string().regex(instagramRegex, "Invalid Instagram username").nullable().optional(),
});

export const updateArtistSchema = createArtistSchema.partial().extend({
  archived: z.boolean().optional(),
});

export const createAlbumSchema = z.object({
  name: z.string().min(1).max(200),
  ean: z.string().regex(eanRegex, "Invalid EAN format (13 digits)").nullable().optional(),
  imagePath: z.string().nullable().optional(),
  releaseDate: z.string().nullable().optional(),
  rating: z.number().min(0).max(10).default(0),
  spotifyId: z.string().nullable().optional(),
  appleMusicId: z.string().nullable().optional(),
  youtubeId: z.string().nullable().optional(),
});

export const updateAlbumSchema = createAlbumSchema.partial().extend({
  archived: z.boolean().optional(),
});

export const assignArtistSchema = z.object({
  artistId: z.string().min(1),
});

export const assignAlbumSchema = z.object({
  albumId: z.string().min(1),
});

// List query params
export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  archived: z.coerce.boolean().optional(),
});
