"use client";

// =============================================================================
// ServiceWorkerRegister — mounts once in the root layout and registers the
// app-shell service worker (frontend/public/sw.js). No-op outside of browsers
// that support service workers, and safe to mount on every page (registration
// is idempotent — the browser only registers once per scope).
// =============================================================================

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Guard for environments where the public URL isn't resolvable (e.g. build).
    if (typeof window === "undefined") return;

    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => {
        // Non-fatal — the app works fine without a service worker.
        if (process.env.NODE_ENV !== "production") {
          console.warn("[sw] registration failed:", err);
        }
      });
  }, []);

  return null;
}