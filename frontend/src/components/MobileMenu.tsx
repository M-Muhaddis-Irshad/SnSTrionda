"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";

export const OPEN_MENU_EVENT = "trionda:open-menu";

const navLinks = [
  { label: "Shop", href: "/shop" },
  { label: "Men", href: "/shop/men" },
  { label: "Women", href: "/shop/women" },
  { label: "Clothing", href: "/shop/clothing" },
  { label: "New Arrivals", href: "/shop/new-arrivals" },
  { label: "Collections", href: "/shop/collections" },
  { label: "FAQ", href: "/faq" },
];

export default function MobileMenu() {
  const { isAuthenticated, isAdmin } = useAuthStore();
  const authenticated = isAuthenticated();
  const admin = isAdmin();
  const accountHref = !authenticated ? "/login" : admin ? "/admin" : "/account";
  const accountLabel = !authenticated ? "Sign In" : "My Account";

  const [isOpen, setIsOpen] = useState(false);

  // Opened by the bottom mobile nav's "Menu" tab (no hamburger in the header)
  useEffect(() => {
    function onOpen() {
      setIsOpen(true);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    window.addEventListener(OPEN_MENU_EVENT, onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_MENU_EVENT, onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  return (
    <div className="mobile-menu-wrapper">
      {/* Overlay */}
      {isOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-in panel */}
      <div
        className={`mobile-menu-panel ${
          isOpen ? "mobile-menu-panel--open" : "mobile-menu-panel--closed"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <div className="mobile-menu-content">
          {/* Close button inside panel */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="mobile-menu-close"
            aria-label="Close menu"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Nav links */}
          <nav className="mobile-menu-nav" aria-label="Mobile navigation links">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="mobile-menu-link"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={accountHref}
              className="mobile-menu-account-link"
              onClick={() => setIsOpen(false)}
            >
              {accountLabel}
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
