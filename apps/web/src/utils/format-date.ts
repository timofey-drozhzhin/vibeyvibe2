/** Format a date value to "Mar 5, 2026" style. Returns "" for falsy values. */
export function formatDate(value: unknown): string {
  if (!value) return "";
  try {
    const date = new Date(String(value));
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return String(value);
  }
}
