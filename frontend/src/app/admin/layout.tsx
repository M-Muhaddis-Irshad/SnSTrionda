"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/products", label: "Products", icon: "📦" },
  { href: "/admin/orders", label: "Orders", icon: "🛒" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isAdmin, user, clearAuth } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // If on the login page, skip the auth gate (login page handles its own redirect)
    if (pathname === "/admin/login") {
      setChecking(false);
      return;
    }

    if (!isAuthenticated() || !isAdmin()) {
      router.replace("/admin/login");
      return;
    }

    setChecking(false);
  }, [pathname, isAuthenticated, isAdmin, router]);

  function handleLogout() {
    clearAuth();
    router.push("/admin/login");
  }

  // Login page renders without the admin shell
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Auth loading state
  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted font-body text-sm tracking-wider uppercase">
          Verifying access...
        </div>
      </div>
    );
  }

  // Not authenticated — will redirect via useEffect, show nothing
  if (!isAuthenticated() || !isAdmin()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-chrome-500
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Brand */}
          <div className="px-6 py-6 border-b border-chrome-500">
            <h1 className="font-display text-lg text-foreground tracking-wide">
              Trionda Wears
            </h1>
            <p className="font-body text-xs text-muted mt-1 tracking-wider uppercase">
              Admin Panel
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 font-body text-sm tracking-wide
                    transition-colors duration-150
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2 focus-visible:ring-offset-surface
                    ${
                      isActive
                        ? "bg-chrome-500 text-foreground border-l-2 border-chrome-100"
                        : "text-muted hover:text-foreground hover:bg-chrome-500/30"
                    }
                  `}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User info + logout */}
          <div className="px-4 py-4 border-t border-chrome-500">
            <div className="px-4 py-2">
              <p className="font-body text-sm text-foreground truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="font-body text-xs text-muted truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full mt-2 px-4 py-2 font-body text-sm text-muted hover:text-foreground transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              Sign Out →
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden sticky top-0 z-30 bg-surface border-b border-chrome-500 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted hover:text-foreground transition-colors p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300"
            aria-label="Open navigation"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 7h18M3 12h18M3 17h18" strokeLinecap="round" />
            </svg>
          </button>
          <span className="font-display text-sm text-foreground tracking-wide">
            Admin
          </span>
          <div className="w-8" /> {/* Spacer */}
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
