"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated, isAdmin } = useAuthStore();
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
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      setAuth(data.user, data.accessToken, data.refreshToken);

      // Role-based redirect
      if (data.user.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/account");
      }
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
            Sign in to your account
          </p>
        </div>

        {/* Login Card */}
        <div className="border border-chrome-500 bg-surface p-8">
          <h2 className="font-display text-xl text-foreground mb-6">
            Welcome Back
          </h2>

          {error && (
            <div className="mb-6 px-4 py-3 border border-red-500/50 bg-red-500/10 text-red-400 text-sm font-body">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>

        {/* Register link */}
        <div className="text-center mt-6">
          <p className="font-body text-sm text-muted">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-chrome-200 underline hover:text-foreground transition-colors"
            >
              Register
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
