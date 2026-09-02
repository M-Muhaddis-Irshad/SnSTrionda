// =============================================================================
// Auth Feature — Request Handlers (Controller)
// =============================================================================

import { Request, Response } from "express";
import {
  register,
  login,
  googleLogin,
  refreshToken,
  logout,
  AppError,
} from "./auth.service";
import { prisma } from "../../db";
import type {
  RegisterRequestBody,
  LoginRequestBody,
  GoogleLoginRequestBody,
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
    if (!body.email || !body.password || !body.name) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["email", "password", "name"],
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

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------

export async function handleMe(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json({ user });
  } catch (err: any) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ---------------------------------------------------------------------------
// GET /api/auth/admin-check
// ---------------------------------------------------------------------------

export function handleAdminCheck(req: Request, res: Response) {
  res.json({ message: "Admin access confirmed.", user: req.user });
}

// ---------------------------------------------------------------------------
// POST /api/auth/google
// ---------------------------------------------------------------------------

export async function handleGoogleLogin(req: Request, res: Response) {
  try {
    const body = getBody<GoogleLoginRequestBody>(req);

    if (!body.credential) {
      return res.status(400).json({
        error: "Google credential is required",
      });
    }

    const result = await googleLogin(body);

    res.json({
      message: "Google login successful",
      ...result,
    });
  } catch (err: any) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("Google login error:", err?.message || err);
    res.status(500).json({ error: "Internal server error", details: err?.message });
  }
}

// ---------------------------------------------------------------------------
// GET /api/auth/images/:pageType
// ---------------------------------------------------------------------------

export async function handleGetAuthImage(req: Request, res: Response) {
  try {
    const pageType = req.params.pageType as string;
    const image = await prisma.authImage.findFirst({
      where: { pageType },
    });

    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    res.json(image);
  } catch (err: any) {
    console.error("Auth image error:", err);
    res.status(500).json({ error: "Failed to fetch image" });
  }
}
