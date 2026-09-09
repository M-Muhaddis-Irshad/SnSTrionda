"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  message?: string;
}

export default function LoginModal({ open, onClose, message }: LoginModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="login-modal-overlay"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="login-modal-card">
        <button
          className="login-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        <div className="login-modal-icon">🔒</div>
        <h3 className="login-modal-title">Sign in required</h3>
        <p className="login-modal-text">
          {message || "Please sign in or create an account to continue."}
        </p>

        <div className="login-modal-actions">
          <Link href="/login" className="login-modal-btn login-modal-btn-primary" onClick={onClose}>
            Log In
          </Link>
          <Link href="/signup" className="login-modal-btn login-modal-btn-secondary" onClick={onClose}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
