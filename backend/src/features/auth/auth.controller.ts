// =============================================================================
// Auth Feature — Request Handlers (Controller)
// =============================================================================

import { Request, Response } from "express";
import {
  register,
  login,
  refreshToken,
  logout,
  AppError,
} from "./auth.service";
import type {
  RegisterRequestBody,
  LoginRequestBody,
  RefreshRequestBody,
} from "./auth.types";

// ---------------------------------------------------------------------------
// Helper: extract and validate request body
// ---------------------------------------------------------------------------

function getBody<T>(req: Request): T {
  return req.body as T;
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------

export async function handleRegister(req: Request, res: Response) {
  try {
    const body = getBody<RegisterRequestBody>(req);

    // Basic validation
    if (!body.email || !body.password || !body.firstName || !body.lastName) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["email", "password", "firstName", "lastName"],
        optional: ["phone"],
      });
    }

    if (body.password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long",
      });
    }

    const result = await register(body);

    res.status(201).json({
      message: "Account created successfully",
      ...result,
    });
  } catch (err: any) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("Register error:", err?.message || err);
    console.error("Register error stack:", err?.stack);
    res.status(500).json({ error: "Internal server error", details: err?.message });
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------

export async function handleLogin(req: Request, res: Response) {
  try {
    const body = getBody<LoginRequestBody>(req);

    // Basic validation
    if (!body.email || !body.password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const result = await login(body);

    res.json({
      message: "Login successful",
      ...result,
    });
  } catch (err: any) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("Login error:", err?.message || err);
    console.error("Login error stack:", err?.stack);
    res.status(500).json({ error: "Internal server error", details: err?.message });
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/refresh
// ---------------------------------------------------------------------------

export async function handleRefresh(req: Request, res: Response) {
  try {
    const body = getBody<RefreshRequestBody>(req);

    if (!body.refreshToken) {
      return res.status(400).json({
        error: "Refresh token is required",
      });
    }

    const result = await refreshToken(body.refreshToken);

    res.json({
      message: "Tokens refreshed successfully",
      ...result,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("Refresh error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------

export function handleLogout(req: Request, res: Response) {
  try {
    const result = logout();

    res.json(result);
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
