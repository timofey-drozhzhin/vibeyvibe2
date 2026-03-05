import { useCallback, useState } from "react";
import { API_URL } from "../config/constants.js";

/**
 * Hook for toggling likes on entities.
 * Calls POST /api/likes/toggle and returns the new liked state.
 */
export function useLikeToggle(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);

  const toggle = useCallback(
    async (entity: string, entityId: number) => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/likes/toggle`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entity, entityId }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        onSuccess?.();
        return json.data.liked as boolean;
      } finally {
        setLoading(false);
      }
    },
    [onSuccess],
  );

  return { toggle, loading };
}
