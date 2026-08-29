// =============================================================================
// Auth Feature — Optional Authentication Middleware
// =============================================================================
// Decodes the JWT access token if present and valid, attaches req.user.
// Does NOT return 401 if no token is provided — allows guest flows.

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthPayload } from "./auth.middleware";

const JWT_SECRET = process.env.JWT_SECRET!;

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // No token — that's fine, continue without req.user
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    if (decoded.type === "access") {
      req.user = decoded;
    }
  } catch {
    // Invalid/expired token — ignore, continue without req.user
  }

  next();
}
