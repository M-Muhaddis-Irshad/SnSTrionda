"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCartStore, selectTotalItems } from "@/stores/cartStore";
import { useMounted } from "@/lib/useMounted";

// ---------------------------------------------------------------------------
// Navigation items
// ---------------------------------------------------------------------------

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      className="h-5 w-5"
      fill={active ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      />
    </svg>
  );
}

function ShopIcon({ active }: { active: boolean }) {
  return (
    <svg
      className="h-5 w-5"
      fill={active ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0021 9.349m-18 0V6.375a3 3 0 013-3h12a3 3 0 013 3v.075"
      />
    </svg>
  );
}

function CartIcon({ active }: { active: boolean }) {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
      />
    </svg>
  );
}

function MenuIcon({ active }: { active: boolean }) {
  return (
    <svg
      className="h-5 w-5"
      fill={active ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// MobileBottomNav Component
// ---------------------------------------------------------------------------

interface MobileBottomNavProps {
  onMenuToggle?: () => void;
}

export default function MobileBottomNav({ onMenuToggle }: MobileBottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useMounted();
  const cartTotalItems = useCartStore(selectTotalItems);
  const totalItems = mounted ? cartTotalItems : 0;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const tabs: NavItem[] = [
    { label: "Home", href: "/", icon: <HomeIcon active={isActive("/")} /> },
    { label: "Shop", href: "/shop", icon: <ShopIcon active={isActive("/shop")} /> },
    { label: "Cart", href: "__cart__", icon: <CartIcon active={false} /> },
    { label: "Menu", href: "__menu__", icon: <MenuIcon active={false} /> },
  ];

  function handleTabClick(item: NavItem) {
    if (item.href === "__cart__") {
      window.dispatchEvent(new CustomEvent("trionda:open-cart"));
    } else if (item.href === "__menu__") {
      onMenuToggle?.();
    } else {
      router.push(item.href);
    }
  }

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      <div className="mobile-bottom-nav-inner">
        {tabs.map((item) => {
          const active =
            item.href === "__cart__" || item.href === "__menu__"
              ? false
              : isActive(item.href);

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => handleTabClick(item)}
              className={`mobile-bottom-nav-tab ${
                active
                  ? "mobile-bottom-nav-tab--active"
                  : "mobile-bottom-nav-tab--inactive"
              }`}
              aria-label={item.label}
            >
              <span className="relative">
                {item.icon}
                {item.label === "Cart" && totalItems > 0 && (
                  <span className="mobile-bottom-nav-badge">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
