// =============================================================================
// Auth Feature — Middleware (authenticate & requireRole)
// =============================================================================

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

// ---------------------------------------------------------------------------
// Extended Request type — attaches decoded token payload to req.user
// ---------------------------------------------------------------------------

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
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

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required. Please provide a valid access token." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;

    if (decoded.type !== "access") {
      return res.status(401).json({ error: "Invalid token type. Access token required." });
    }

    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Access token has expired. Please refresh your token." });
    }
    return res.status(401).json({ error: "Invalid access token." });
  }
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
