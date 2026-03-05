/**
 * Try to resolve a display name for a foreign key value.
 * The API enricher may have added related objects to the record
 * (e.g., record.source for bin_source_id, record.songName for song_id).
 */
export function resolveFkDisplayName(
  fieldKey: string,
  value: unknown,
  record: Record<string, unknown>,
): string | null {
  if (value == null) return null;

  // e.g., "bin_source_id" -> "bin_source"
  const baseKey = fieldKey.replace(/_id$/, "");

  // Check for enriched object (e.g., record.source = { id, name })
  const enriched = record[baseKey];
  if (enriched && typeof enriched === "object" && (enriched as Record<string, unknown>).name) {
    return String((enriched as Record<string, unknown>).name);
  }

  // Check for "songName" style enrichment (e.g., song_id -> songName)
  const parts = baseKey.split("_");
  const camelName = parts
    .map((p, i) => (i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join("");
  const nameKey = `${camelName}Name`;
  if (record[nameKey]) {
    return String(record[nameKey]);
  }

  // Check snake_case variant (e.g., bin_source_name)
  const snakeNameKey = `${baseKey}_name`;
  if (record[snakeNameKey]) {
    return String(record[snakeNameKey]);
  }

  return `#${value}`;
}
