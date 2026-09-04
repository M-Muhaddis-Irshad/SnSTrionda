// =============================================================================
// Users Feature — Request Handlers (Controller)
// =============================================================================

import { Request, Response } from "express";
import {
  listUsers,
  getUserProfile,
  changeUserRole,
  UsersError,
  USER_ROLES,
  type UserRoleValue,
} from "./users.service";
import { logAdminActivity } from "../../services/socketService";

// Fire-and-forget audit trail entry (never blocks or fails the request)
function track(
  adminId: string | undefined,
  action: string,
  entityType: string,
  entityId: string,
  details?: Record<string, unknown>
) {
  if (!adminId) return;
  logAdminActivity(adminId, action, entityType, entityId, details ?? null).catch(() => {});
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function handleUsersError(err: any, res: Response) {
  if (err instanceof UsersError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error("Users error:", err?.message || err);
  res.status(500).json({ error: "Internal server error" });
}

function isUserRole(value: any): value is UserRoleValue {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export async function handleListUsers(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = (req.query.search as string) || undefined;
    const role = (req.query.role as string) || undefined;

    if (role && !isUserRole(role)) {
      return res.status(400).json({
        error: `Invalid role filter. Must be one of: ${USER_ROLES.join(", ")}.`,
      });
    }

    const result = await listUsers({ page, limit, role, search });
    res.json(result);
  } catch (err: any) {
    handleUsersError(err, res);
  }
}

export async function handleGetUserProfile(req: Request, res: Response) {
  try {
    const userId = req.params.userId as string;
    const user = await getUserProfile(userId);
    res.json({ data: user });
  } catch (err: any) {
    handleUsersError(err, res);
  }
}

export async function handleChangeUserRole(req: Request, res: Response) {
  try {
    const userId = req.params.userId as string;
    const { role } = req.body;

    if (!isUserRole(role)) {
      return res.status(400).json({
        error: `Invalid role. Must be one of: ${USER_ROLES.join(", ")}.`,
      });
    }

    const { user, fromRole } = await changeUserRole(req.user?.userId, userId, role);

    res.json({ data: user, message: `Role changed to ${role}` });
    track(req.user?.userId, "UPDATE_USER_ROLE", "User", userId, {
      fromRole,
      toRole: role,
    });
  } catch (err: any) {
    handleUsersError(err, res);
  }
}
