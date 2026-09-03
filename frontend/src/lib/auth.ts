// =============================================================================
// Auth token helpers — expiry check + silent refresh
// =============================================================================
// Access tokens expire after 15 minutes while the app stores them for the whole
// session. These helpers decode the JWT locally, refresh it silently via the
// backend rotation endpoint when it is about to expire, and keep a single
// in-flight refresh shared by concurrent callers (fetch wrappers + socket).
// =============================================================================

import { useAuthStore } from "@/stores/authStore";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const REFRESH_MARGIN_MS = 60_000; // refresh when < 1 min of validity left

// ---------------------------------------------------------------------------
// JWT payload decode (base64url, no dependency)
// ---------------------------------------------------------------------------

export function decodeJwtPayload<T = any>(token: string): T | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

// Milliseconds until expiry, or null when the token has no exp claim / is malformed.
export function getTokenExpiryMs(token: string): number | null {
  const payload = decodeJwtPayload<{ exp?: number }>(token);
  if (!payload || typeof payload.exp !== "number") return null;
  return payload.exp * 1000;
}

export function isTokenExpiringSoon(token: string, marginMs = REFRESH_MARGIN_MS): boolean {
  const exp = getTokenExpiryMs(token);
  if (exp === null) return true; // unparseable — treat as needing refresh
  return exp - Date.now() < marginMs;
}

// ---------------------------------------------------------------------------
// Refresh — POST /api/auth/refresh (rotation: returns NEW access + refresh)
// ---------------------------------------------------------------------------

let inFlightRefresh: Promise<boolean> | null = null;

export async function refreshAccessToken(): Promise<boolean> {
  // Share one in-flight refresh across concurrent callers
  if (inFlightRefresh) return inFlightRefresh;

  inFlightRefresh = (async () => {
    const { refreshToken, setAuth, clearAuth } = useAuthStore.getState();

    if (!refreshToken) {
      clearAuth();
      return false;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        clearAuth();
        return false;
      }

      const data = await res.json();
      if (!data.accessToken || !data.refreshToken || !data.user) {
        clearAuth();
        return false;
      }

      setAuth(data.user, data.accessToken, data.refreshToken);
      return true;
    } catch {
      clearAuth();
      return false;
    } finally {
      inFlightRefresh = null;
    }
  })();

  return inFlightRefresh;
}

// ---------------------------------------------------------------------------
// ensureValidAccessToken — refresh if needed, returns true when a valid access
// token is present in the store afterwards.
// ---------------------------------------------------------------------------

export async function ensureValidAccessToken(): Promise<boolean> {
  const { accessToken, user } = useAuthStore.getState();

  if (!accessToken || !user) return false;

  if (!isTokenExpiringSoon(accessToken)) return true;

  return refreshAccessToken();
}