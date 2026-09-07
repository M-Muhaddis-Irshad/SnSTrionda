"use client";

import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { useMounted } from "@/lib/useMounted";

export default function AccountButton() {
  const mounted = useMounted();
  const user = useAuthStore((s) => s.user);
  const { isAuthenticated, isAdmin } = useAuthStore();
  const authenticated = mounted && isAuthenticated();
  const admin = mounted && isAdmin();

  const href = !authenticated ? "/login" : admin ? "/admin" : "/account";
  const label = !authenticated ? "Sign In" : admin ? "Admin" : "Account";

  // Google sign-in stores the user's photo on the account — show it as the
  // profile icon instead of the default silhouette.
  const avatarUrl = authenticated && user?.image ? user.image : null;

  return (
    <Link href={href} className="header-icon-btn" aria-label={label} title={label}>
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={user?.name || label}
          className="h-7 w-7 rounded-full border border-chrome-400 object-cover"
        />
      ) : (
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
            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
          />
        </svg>
      )}
    </Link>
  );
}
