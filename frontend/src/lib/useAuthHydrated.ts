"use client";

// =============================================================================
// useAuthHydrated — true once the persisted auth store has rehydrated.
// Zustand persist hydration is asynchronous (a promise microtask after store
// creation), so guards that run on mount see empty state on hard refreshes and
// can wrongly redirect. Components should wait for this before deciding auth.
// =============================================================================

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";

export function useAuthHydrated(): boolean {
  const [hydrated, setHydrated] = useState<boolean>(() => {
    const hasHydrated = (useAuthStore as any).persist?.hasHydrated;
    return typeof hasHydrated === "function" ? hasHydrated() : true;
  });

  useEffect(() => {
    const store = useAuthStore as any;
    if (typeof store.persist?.hasHydrated === "function" && store.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = store.persist?.onFinishHydration?.(() => setHydrated(true));
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  return hydrated;
}