// =============================================================================
// Role helpers — keep admin checks in sync with the backend.
// ADMIN = delegated admin (a regular User row); SUPER_ADMIN = store owner
// (credentials live in the dedicated SuperAdmin table on the backend).
// =============================================================================

export const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;

export function isAdminRole(role?: string | null): boolean {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role);
}