"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";

const NAV_ITEMS = [
  { href: "/account", label: "Overview", exact: true },
  { href: "/account/orders", label: "Order History", exact: false },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    setChecking(false);
  }, [isAuthenticated, router]);

  function handleLogout() {
    clearAuth();
    router.push("/");
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted font-body text-sm tracking-wider uppercase">
          Loading your account...
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="font-display text-2xl sm:text-3xl tracking-wide text-foreground">
            My Account
          </h1>
          <p className="font-body text-sm text-muted mt-2">
            Welcome back, {user?.firstName || "there"}
          </p>
        </div>

        {/* Two-column layout: sidebar + content */}
        <div className="flex flex-col sm:flex-row gap-8 sm:gap-12">
          {/* Sidebar navigation */}
          <nav className="sm:w-48 shrink-0">
            <div className="flex sm:flex-col gap-4 sm:gap-1 overflow-x-auto sm:overflow-x-visible pb-2 sm:pb-0">
              {NAV_ITEMS.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      font-body text-sm tracking-wide whitespace-nowrap px-3 py-2 sm:px-0 sm:py-2
                      transition-colors duration-150
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background
                      ${
                        isActive
                          ? "text-foreground sm:border-b-2 sm:border-chrome-200"
                          : "text-muted hover:text-foreground"
                      }
                    `}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="font-body text-sm tracking-wide text-muted hover:text-foreground transition-colors text-left px-3 py-2 sm:px-0 sm:py-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:border-t sm:border-chrome-500 sm:mt-2"
              >
                Sign Out
              </button>
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </main>
  );
}
