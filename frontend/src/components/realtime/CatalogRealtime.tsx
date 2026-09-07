"use client";

// =============================================================================
// CatalogRealtime — mounted once in the root layout.
// The backend emits "catalog:changed" (via the storefront socket room) whenever
// an admin creates/updates/deletes products, categories, coupons, discounts,
// collections or store settings. That event is surfaced as a window event by
// the socket singleton (lib/socket.ts); this component turns it into a
// router.refresh() so the server components on the current page re-render with
// fresh data — zero manual reloads for signed-in visitors.
//
// Note: the socket only connects for authenticated users (the server rejects
// anonymous sockets), so logged-out visitors get fresh data on their next
// navigation/reload instead of a live push.
// =============================================================================

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CatalogRealtime() {
  const router = useRouter();

  useEffect(() => {
    const onChanged = () => {
      router.refresh();
    };
    window.addEventListener("trionda:catalog-changed", onChanged);
    return () => {
      window.removeEventListener("trionda:catalog-changed", onChanged);
    };
  }, [router]);

  return null;
}
