// =============================================================================
// Auth Store — Zustand with localStorage persistence
// =============================================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
}

interface AuthActions {
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setAuth: (user, accessToken, refreshToken) => {
        // Mirror the access token into a cookie so edge middleware can
        // role-gate routes. 7 days matches the refresh-token lifetime; the
        // token itself is refreshed silently by lib/auth.ts, which re-calls
        // setAuth (and therefore re-syncs this cookie).
        try {
          document.cookie =
            `authToken=${encodeURIComponent(accessToken)}; path=/; max-age=604800; samesite=lax`;
        } catch {
          /* non-browser environment */
        }
        set({ user, accessToken, refreshToken });
      },

      clearAuth: () => {
        try {
          document.cookie = "authToken=; path=/; max-age=0";
        } catch {
          /* non-browser environment */
        }
        set({ user: null, accessToken: null, refreshToken: null });
      },

      isAuthenticated: () => !!get().accessToken && !!get().user,

      isAdmin: () => get().user?.role === "ADMIN",
    }),
    {
      name: "trionda-auth",
    }
  )
);
