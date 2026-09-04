"use client";

// =============================================================================
// TermsConditionsModal — full-screen modal showing the Terms & Conditions.
// Opened from the auth pages (/login, /signup) when the user clicks the T&C
// link. Escape, backdrop click, and the X button all close it. The Agree
// button calls the optional onAgree() callback, then closes.
//
// The same TERMS_SECTIONS content is reused by the /terms-and-conditions page
// so the modal and the standalone page always show identical copy.
// =============================================================================

import { useEffect } from "react";
import { TERMS_SECTIONS } from "./termsContent";

interface TermsConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree?: () => void;
}

export default function TermsConditionsModal({
  isOpen,
  onClose,
  onAgree,
}: TermsConditionsModalProps) {
  // Escape closes the modal
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Lock body scroll while the modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Terms and Conditions"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 flex max-h-[80vh] w-full flex-col overflow-hidden border border-chrome-500 bg-surface shadow-2xl md:w-[600px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-chrome-500 px-6 py-4">
          <h2 className="font-display text-lg tracking-[0.15em] text-foreground">
            TERMS &amp; CONDITIONS
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close terms and conditions"
            className="flex h-8 w-8 items-center justify-center text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 rounded-sm"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {TERMS_SECTIONS.map((section) => (
            <section key={section.heading}>
              <h3 className="mb-2 font-display text-sm tracking-[0.12em] text-foreground">
                {section.heading}
              </h3>
              <p className="font-body text-sm leading-relaxed text-muted">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 border-t border-chrome-500 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="border border-chrome-500 px-6 py-2 font-body text-xs uppercase tracking-[0.15em] text-muted transition-colors hover:border-chrome-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 rounded-sm"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => {
              onAgree?.();
              onClose();
            }}
            className="bg-white px-6 py-2 font-body text-xs font-semibold uppercase tracking-[0.15em] text-black transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 rounded-sm"
          >
            Agree
          </button>
        </div>
      </div>
    </div>
  );
}