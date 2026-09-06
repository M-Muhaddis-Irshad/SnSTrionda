"use client";

// =============================================================================
// useMounted — returns false during SSR and the first client render (hydration),
// then true after mount. Components that gate on this render identically on
// server and client during hydration, avoiding the mismatch that Zustand
// persist stores cause when they rehydrate from localStorage before React's
// first render.
// =============================================================================

import { useEffect, useState } from "react";

export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
