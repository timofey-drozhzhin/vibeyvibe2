import { z } from "zod";

export const createBinSongSchema = z.object({
  name: z.string().min(1).max(200),
  sourceId: z.string().nullable().optional(),
  assetPath: z.string().nullable().optional(),
  sourceUrl: z.string().url().nullable().optional(),
});

export const updateBinSongSchema = createBinSongSchema.partial().extend({
  archived: z.boolean().optional(),
});

export const createBinSourceSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().url().nullable().optional(),
});

export const updateBinSourceSchema = createBinSourceSchema.partial().extend({
  archived: z.boolean().optional(),
});

export const importYoutubeSchema = z.object({
  url: z.string().url("Must be a valid YouTube URL"),
});
