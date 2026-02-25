import { z } from "zod";

export const createPromptSchema = z.object({
  lyrics: z.string().nullable().optional(),
  style: z.string().nullable().optional(),
  voiceGender: z.enum(["male", "female", "neutral"]).nullable().optional(),
  notes: z.string().nullable().optional(),
  profileId: z.string().nullable().optional(),
  rating: z.number().min(0).max(10).default(0),
});

export const updatePromptSchema = createPromptSchema.partial().extend({
  archived: z.boolean().optional(),
});

export const createCollectionSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
});

export const updateCollectionSchema = createCollectionSchema.partial().extend({
  archived: z.boolean().optional(),
});

export const assignPromptSchema = z.object({
  promptId: z.string().min(1),
});

export const createGenerationSchema = z.object({
  sunoId: z.string().nullable().optional(),
  binSongId: z.string().nullable().optional(),
});

export const assignGenerationPromptSchema = z.object({
  promptId: z.string().min(1),
});
