"use client";

import { usePathname } from "next/navigation";
import MobileBottomNav from "./MobileBottomNav";
import { OPEN_MENU_EVENT } from "./MobileMenu";

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

  // The bottom nav's "Menu" tab opens the full slide-in menu (no hamburger).
  function openMenu() {
    window.dispatchEvent(new Event(OPEN_MENU_EVENT));
  }

  return <MobileBottomNav onMenuToggle={openMenu} />;
}
