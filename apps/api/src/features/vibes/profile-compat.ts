// Backwards compatibility layer for profile data.
// v1 profiles: Array<{ name, category, value }> (flat)
// v2 profiles: { $version: 2, genre: { ... }, vocals: { ... }, ... } (nested)

import { VIBES_SCHEMA_VERSION, vibesSchema } from "./schema.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FlatVibeEntry {
  name: string;
  category: string;
  value: string;
}

// ---------------------------------------------------------------------------
// Version detection
// ---------------------------------------------------------------------------

/** Detect profile format version from parsed JSON. */
export function getProfileVersion(value: any): number {
  if (Array.isArray(value)) return 1;
  if (typeof value === "object" && value !== null) {
    return value.$version ?? 1;
  }
  return 1;
}

// ---------------------------------------------------------------------------
// Flatten v2 nested profile to v1 flat entries
// ---------------------------------------------------------------------------

/** Convert a v2 nested profile to flat v1 entries for legacy consumers. */
export function flattenProfile(
  nested: any,
  schema?: any,
): FlatVibeEntry[] {
  const effectiveSchema = schema ?? vibesSchema;
  const entries: FlatVibeEntry[] = [];

  walkAndFlatten(nested, effectiveSchema, "", "", entries);
  return entries;
}

function walkAndFlatten(
  data: any,
  schema: any,
  category: string,
  categoryTitle: string,
  entries: FlatVibeEntry[],
): void {
  if (data == null || schema == null) return;

  if (schema.type === "object" && schema.properties) {
    for (const [key, propSchema] of Object.entries(schema.properties) as [string, any][]) {
      const value = data[key];
      if (value === undefined || value === null) continue;

      // Top-level keys define categories
      const cat = category || key;
      const catTitle = categoryTitle || (propSchema.title ?? key);

      if (propSchema.type === "string" && typeof value === "string" && value.trim()) {
        entries.push({
          name: propSchema.title ?? key,
          category: cat,
          value: value.trim(),
        });
      } else if (propSchema.type === "array" && Array.isArray(value)) {
        flattenArray(value, propSchema, cat, catTitle, entries);
      } else if (propSchema.type === "object") {
        walkAndFlatten(value, propSchema, cat, catTitle, entries);
      }
    }
  }
}

function flattenArray(
  data: any[],
  schema: any,
  category: string,
  categoryTitle: string,
  entries: FlatVibeEntry[],
): void {
  const items = schema.items;
  if (!items) return;

  if (items.type === "string") {
    // Simple string array — join into a single entry
    const values = data.filter((v) => typeof v === "string" && v.trim());
    if (values.length > 0) {
      entries.push({
        name: schema.title ?? "Items",
        category,
        value: values.join(", "),
      });
    }
    return;
  }

  if (items.type === "object" && items.properties) {
    // Array of objects — flatten each item with an index label
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (item == null || typeof item !== "object") continue;

      const prefix = data.length > 1 ? `#${i + 1} ` : "";

      for (const [key, propSchema] of Object.entries(items.properties) as [string, any][]) {
        const value = item[key];
        if (value === undefined || value === null) continue;

        if (propSchema.type === "string" && typeof value === "string" && value.trim()) {
          entries.push({
            name: `${prefix}${propSchema.title ?? key}`,
            category,
            value: value.trim(),
          });
        } else if (propSchema.type === "array" && Array.isArray(value)) {
          const subEntries: FlatVibeEntry[] = [];
          flattenArray(value, propSchema, category, categoryTitle, subEntries);
          // Prefix sub-entries with the parent index
          for (const entry of subEntries) {
            entries.push({
              name: `${prefix}${entry.name}`,
              category,
              value: entry.value,
            });
          }
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Inject $version into a nested profile object
// ---------------------------------------------------------------------------

/** Add $version to a nested profile object before storing. */
export function stampVersion(profile: any): any {
  return { $version: VIBES_SCHEMA_VERSION, ...profile };
}
