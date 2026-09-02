// =============================================================================
// Auth Feature — Business Logic Service
// =============================================================================

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../db";
import type {
  RegisterRequestBody,
  LoginRequestBody,
  AuthUser,
  AuthTokensResponse,
  AccessTokenPayload,
  RefreshTokenPayload,
} from "./auth.types";

// ---------------------------------------------------------------------------
// Config — these come from environment variables
// ---------------------------------------------------------------------------

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN: string = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

const BCRYPT_SALT_ROUNDS = 12;

// ---------------------------------------------------------------------------
// Helper: strip passwordHash from a user object
// ---------------------------------------------------------------------------

function sanitizeUser(user: any): AuthUser {
  const { password, ...rest } = user;
  return rest as AuthUser;
}

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------

function generateAccessToken(user: { id: string; email: string; role: string }): string {
  const payload: AccessTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    type: "access",
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

function generateRefreshToken(user: { id: string; email: string }): string {
  const payload: RefreshTokenPayload = {
    userId: user.id,
    email: user.email,
    type: "refresh",
  };
  // Refresh tokens use a DIFFERENT secret than access tokens (security best practice)
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions);
}

function generateTokens(user: { id: string; email: string; role: string }) {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
  };
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

export async function register(body: RegisterRequestBody): Promise<AuthTokensResponse> {
  const { email, password, name, phone } = body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: name || null,
      phone: phone || null,
    },
  });

  const tokens = generateTokens(user);

  return {
    user: sanitizeUser(user),
    ...tokens,
  };
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export async function login(body: LoginRequestBody): Promise<AuthTokensResponse> {
  const { email, password } = body;

  // Find user by email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Generic error — don't reveal whether email or password was wrong
    throw new AppError("Invalid email or password", 401);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password || '');
  if (!isPasswordValid) {
    // Generic error — don't reveal whether email or password was wrong
    throw new AppError("Invalid email or password", 401);
  }

  const tokens = generateTokens(user);

  return {
    user: sanitizeUser(user),
    ...tokens,
  };
}

// ---------------------------------------------------------------------------
// Refresh Token
// ---------------------------------------------------------------------------

/**
 * JUDGMENT CALL: Refresh token rotation is enabled.
 * When a refresh token is used, a NEW refresh token is issued.
 * This limits the window of exposure if a refresh token is stolen,
 * because the old token becomes invalid after first use.
 */
export async function refreshToken(token: string): Promise<AuthTokensResponse> {
  // Verify the refresh token
  let payload: RefreshTokenPayload;
  try {
    payload = jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch (err) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  // Ensure it's actually a refresh token (not an access token reused here)
  if (payload.type !== "refresh") {
    throw new AppError("Invalid token type", 401);
  }

  // Fetch the user to get their current role
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw new AppError("User not found", 401);
  }

  // Issue NEW tokens (rotation — old refresh token is now effectively invalid
  // because the user will replace it with this new one)
  const tokens = generateTokens(user);

  return {
    user: sanitizeUser(user),
    ...tokens,
  };
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

/**
 * JUDGMENT CALL: Logout is currently a client-side operation.
 * Since we don't store refresh tokens server-side (no revocation list/table),
 * we cannot truly invalidate tokens. The client should discard both tokens.
 *
 * FUTURE CONSIDERATION: For real server-side invalidation, implement one of:
 * 1. A token blacklist table (store revoked token JTIs with expiry)
 * 2. Store active refresh tokens in the DB per user (and delete on logout)
 * 3. Use short-lived access tokens + HttpOnly cookies for session management
 *
 * For now, this endpoint confirms the intent to logout and instructs the client.
 */
export function logout(): { message: string } {
  return {
    message: "Successfully logged out. Please discard your access and refresh tokens.",
  };
}

// ---------------------------------------------------------------------------
// Custom App Error class
// ---------------------------------------------------------------------------

export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}
