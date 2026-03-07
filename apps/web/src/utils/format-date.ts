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

/** Format a date value as relative time, e.g. "2m ago", "1h ago". Returns "" for falsy values. */
export function formatTimeAgo(value: unknown): string {
  if (!value) return "";
  try {
    const date = new Date(String(value));
    const now = Date.now();
    const diffMs = now - date.getTime();
    if (diffMs < 0) return "just now";
    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return String(value);
  }
}
