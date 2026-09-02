"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated, isAdmin } = useAuthStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated()) {
    if (isAdmin()) {
      router.replace("/admin");
    } else {
      router.replace("/account");
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `${firstName} ${lastName}`.trim(), email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Auto-login after successful registration
      setAuth(data.user, data.accessToken, data.refreshToken);
      router.push("/account");
    } catch {
      setError("Failed to connect to server. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl tracking-wide text-foreground">
            Trionda Wears
          </h1>
          <p className="font-body text-sm text-muted mt-2 tracking-wider uppercase">
            Create your account
          </p>
        </div>

        {/* Register Card */}
        <div className="border border-chrome-500 bg-surface p-8">
          <h2 className="font-display text-xl text-foreground mb-6">
            Register
          </h2>

          {error && (
            <div className="mb-6 px-4 py-3 border border-red-500/50 bg-red-500/10 text-red-400 text-sm font-body">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="firstName"
                  className="block font-body text-xs text-muted mb-2 tracking-wider uppercase"
                >
                  First Name
                </label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ahmed"
                  required
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block font-body text-xs text-muted mb-2 tracking-wider uppercase"
                >
                  Last Name
                </label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Khan"
                  required
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block font-body text-xs text-muted mb-2 tracking-wider uppercase"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block font-body text-xs text-muted mb-2 tracking-wider uppercase"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <p className="font-body text-xs text-muted mt-1">
                Must be at least 8 characters long
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        </div>

        {/* Login link */}
        <div className="text-center mt-6">
          <p className="font-body text-sm text-muted">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-chrome-200 underline hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Back to shop */}
        <div className="text-center mt-3">
          <Link
            href="/"
            className="font-body text-xs text-muted hover:text-foreground transition-colors tracking-wider uppercase"
          >
            ← Back to Shop
          </Link>
        </div>
      </div>
    </main>
  );
}
