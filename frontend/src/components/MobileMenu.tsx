"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";

const navLinks = [
  { label: "Shop", href: "/shop" },
  { label: "Men", href: "/shop/men" },
  { label: "Women", href: "/shop/women" },
  { label: "Clothing", href: "/shop/clothing" },
  { label: "Footwear", href: "/shop/footwear" },
  { label: "Accessories", href: "/shop/accessories" },
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

  return (
    <div className="mobile-menu-wrapper">
      {/* Hamburger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="mobile-menu-toggle"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
      >
        <span className="sr-only">{isOpen ? "Close menu" : "Open menu"}</span>
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 9h16.5m-16.5 6.75h16.5"
            />
          )}
        </svg>
      </button>

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
          <nav className="mobile-menu-nav">
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
