"use client";

import { usePathname } from "next/navigation";
import MobileBottomNav from "./MobileBottomNav";

// ---------------------------------------------------------------------------
// ClientShell — renders the mobile bottom nav, hidden on checkout/admin pages.
// Bottom padding is handled by the body element (pb-14 md:pb-0).
// ---------------------------------------------------------------------------

export default function ClientShell() {
  const pathname = usePathname();

  // Hide bottom nav on checkout, admin, and order-confirmation pages
  const hideOnRoutes = ["/checkout", "/admin", "/order-confirmation"];
  const shouldHide = hideOnRoutes.some((route) => pathname.startsWith(route));

  if (shouldHide) return null;

  return <MobileBottomNav />;
}
