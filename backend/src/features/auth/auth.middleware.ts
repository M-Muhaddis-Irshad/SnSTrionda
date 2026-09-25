// =============================================================================
// Auth Feature — Middleware (authenticate & requireRole)
// =============================================================================

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../../db";

const JWT_SECRET = process.env.JWT_SECRET!;

// Roles that may access admin-only endpoints. ADMIN = delegated admin (a
// regular User row); SUPER_ADMIN = the store owner (credentials live in the
// dedicated SuperAdmin table, with a shadow User row for FK-based features).
export const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;

export function isAdminRole(role?: string): boolean {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role);
}

// ---------------------------------------------------------------------------
// Extended Request type — attaches decoded token payload to req.user
// ---------------------------------------------------------------------------

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
  /** Snapshot of User.tokenVersion when the token was issued. */
  tokenVersion?: number;
  type: "access";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

// ---------------------------------------------------------------------------
// authenticate middleware
// ---------------------------------------------------------------------------
// Reads the Authorization header, verifies the JWT access token, and attaches
// the decoded payload to req.user. Returns 401 on any failure.

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required. Please provide a valid access token." });
  }

  const token = authHeader.split(" ")[1];

  let decoded: AuthPayload;

  try {
    decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Access token has expired. Please refresh your token." });
    }
    return res.status(401).json({ error: "Invalid access token." });
  }

  if (decoded.type !== "access") {
    return res.status(401).json({ error: "Invalid token type. Access token required." });
  }

  // Session invalidation — tokens minted before a password reset carry an
  // older tokenVersion and are rejected here. This costs one primary-key
  // lookup per authenticated request; the tradeoff is instant invalidation of
  // every outstanding JWT when the password changes (see resetPassword).
  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { tokenVersion: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid access token." });
    }

    if ((decoded.tokenVersion ?? 0) !== user.tokenVersion) {
      return res
        .status(401)
        .json({ error: "Your session was reset. Please sign in again." });
    }
  } catch (err) {
    console.error("Token version check failed:", err);
    return res.status(500).json({ error: "Could not validate session." });
  }

  req.user = decoded;
  next();
}

// ---------------------------------------------------------------------------
// requireRole middleware
// ---------------------------------------------------------------------------
// Must be used AFTER authenticate. Checks that req.user.role is in the
// allowed list. Returns 403 if not.

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      // This shouldn't happen if authenticate ran first, but guard anyway
      return res.status(401).json({ error: "Authentication required." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Access denied. You do not have permission to access this resource.",
      });
    }

    next();
  };
}
