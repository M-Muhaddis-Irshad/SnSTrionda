"use client";

import { useEffect, type ReactNode } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

export default function Modal({ title, onClose, children, wide }: ModalProps) {
  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${wide ? "max-w-2xl" : "max-w-lg"} bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-white transition p-1"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small building blocks reused by all media modals/tables
// ---------------------------------------------------------------------------

export const inputCls =
  "w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition";

export const btnPrimaryCls =
  "px-4 py-2 bg-white text-black text-sm font-semibold rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition";

export const btnSecondaryCls =
  "px-4 py-2 border border-gray-600 text-gray-200 text-sm font-semibold rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition";

export const btnDangerCls =
  "px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition";

export const fieldErrorCls = "text-red-400 text-xs mt-1";
