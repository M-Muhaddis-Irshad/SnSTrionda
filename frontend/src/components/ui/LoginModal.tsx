"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  message?: string;
}

export default function LoginModal({ open, onClose, message }: LoginModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setEmail("");
      setPassword("");
      setError("");
      setSuccess(false);
      setShowPassword(false);
    }
  }, [open]);

  if (!open) return null;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid email or password.");
        setLoading(false);
        return;
      }

      // Backend returns a flat shape: { message, user, accessToken, refreshToken }
      setAuth(data.user, data.accessToken, data.refreshToken);
      setSuccess(true);

      // Brief delay so user sees the success state, then close
      setTimeout(() => {
        onClose();
        // Force a shallow refresh so header picks up the new auth state
        router.refresh();
      }, 600);
    } catch {
      setError("Could not connect to the server. Please try again.");
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(credential: string) {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Google sign-in failed.");
        setLoading(false);
        return;
      }

      // Backend returns a flat shape: { message, user, accessToken, refreshToken }
      setAuth(data.user, data.accessToken, data.refreshToken);
      setSuccess(true);

      setTimeout(() => {
        onClose();
        router.refresh();
      }, 600);
    } catch {
      setError("Google sign-in failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-surface border border-chrome-500 rounded-lg p-6 sm:p-8 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>

        {/* Success state */}
        {success ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-body text-sm text-foreground">Welcome back!</p>
            <p className="font-body text-xs text-muted mt-1">Continuing shortly…</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-6">
              <h3 className="font-display text-xl tracking-wider text-foreground">
                Sign In
              </h3>
              {message && (
                <p className="font-body text-xs text-muted mt-1.5">{message}</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3 py-2.5 rounded">
                {error}
              </div>
            )}

            {/* Email / Password form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block font-body text-[10px] uppercase tracking-wider text-muted mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-background border border-chrome-500 px-3 py-2.5 text-sm text-foreground placeholder-chrome-400 focus:outline-none focus:border-chrome-300 transition"
                />
              </div>

              <div>
                <label className="block font-body text-[10px] uppercase tracking-wider text-muted mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-background border border-chrome-500 px-3 py-2.5 pr-10 text-sm text-foreground placeholder-chrome-400 focus:outline-none focus:border-chrome-300 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3.933 3.933A17.478 17.478 0 0 0 12 7.5c4.243 0 8.233-1.53 11.384-3.933M20.676 20.676A17.478 17.478 0 0 1 12 16.5c-4.243 0-8.233 1.53-11.384 3.933" strokeLinecap="round" />
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M1 1l22 22" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" />
                        <circle cx="12" cy="12" r="3" strokeLinecap="round" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 font-body text-xs tracking-[0.2em] uppercase border border-chrome-300 bg-chrome-500 text-foreground hover:bg-chrome-400 transition disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in…
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-chrome-500" />
              <span className="font-body text-[10px] uppercase tracking-wider text-muted">or</span>
              <div className="flex-1 h-px bg-chrome-500" />
            </div>

            {/* Google */}
            <GoogleSignInButton onSuccess={handleGoogleSuccess} />

            {/* Signup link */}
            <p className="text-center font-body text-xs text-muted mt-5">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-chrome-200 underline hover:text-foreground transition-colors"
                onClick={onClose}
              >
                Sign up
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
