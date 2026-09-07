"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { useMounted } from "@/lib/useMounted";
import { gsap } from "@/lib/motion";

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
  const mounted = useMounted();
  const { isAuthenticated, isAdmin } = useAuthStore();
  const authenticated = mounted && isAuthenticated();
  const admin = mounted && isAdmin();
  const accountHref = !authenticated ? "/login" : admin ? "/admin" : "/account";
  const accountLabel = !authenticated ? "Sign In" : "My Account";

  const [isOpen, setIsOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const openCtx = useRef<gsap.Context | null>(null);

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

  // GSAP polish on top of the CSS slide (panel position stays CSS-driven —
  // GSAP only fades the overlay and staggers the links in, so the open/close
  // state logic and the earlier hamburger fix are untouched).
  useLayoutEffect(() => {
    if (!isOpen) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      if (overlayRef.current) {
        gsap.fromTo(
          overlayRef.current,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.3, ease: "power1.out" }
        );
      }
      if (navRef.current) {
        const links = gsap.utils.toArray<HTMLElement>(
          ".mobile-menu-link, .mobile-menu-account-link",
          navRef.current
        );
        gsap.fromTo(
          links,
          { y: 16, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.45, ease: "power2.out", stagger: 0.055, delay: 0.15 }
        );
      }
    });
    openCtx.current?.revert();
    openCtx.current = ctx;
  }, [isOpen]);

  // Kill lingering tweens when the menu unmounts entirely
  useLayoutEffect(() => () => openCtx.current?.revert(), []);

  return (
    <div className="mobile-menu-wrapper">
      {/* Hamburger toggle (mobile only — wrapper is md:hidden) */}
      <button
        type="button"
        className="mobile-menu-toggle"
        aria-label="Open menu"
        aria-expanded={isOpen}
        aria-controls="mobile-menu-panel"
        onClick={() => setIsOpen(true)}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          ref={overlayRef}
          className="mobile-menu-overlay"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-in panel */}
      <div
        id="mobile-menu-panel"
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
          <nav ref={navRef} className="mobile-menu-nav" aria-label="Mobile navigation links">
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
