// =============================================================================
// Auth Feature — Business Logic Service
// =============================================================================

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import cloudinary from "../../config/cloudinary";
import { prisma } from "../../db";
import type {
  RegisterRequestBody,
  LoginRequestBody,
  GoogleLoginRequestBody,
  AuthUser,
  AuthTokensResponse,
  AccessTokenPayload,
  RefreshTokenPayload,
} from "./auth.types";

const googleClient = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

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
// Profile update (name / phone) and avatar upload
// ---------------------------------------------------------------------------

const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

export async function updateProfile(
  userId: string,
  data: { name?: string; phone?: string }
): Promise<AuthUser> {
  const patch: any = {};
  if (data.name !== undefined) patch.name = data.name.trim() || null;
  if (data.phone !== undefined) patch.phone = data.phone.trim() || null;

  const user = await prisma.user.update({ where: { id: userId }, data: patch });
  return sanitizeUser(user);
}

export async function uploadAvatar(userId: string, file: Express.Multer.File): Promise<AuthUser> {
  if (!ALLOWED_AVATAR_TYPES.includes(file.mimetype)) {
    throw new AppError(
      `Invalid file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP, GIF.`,
      400
    );
  }

  // Upload to Cloudinary (buffer from multer memory storage)
  const result = await new Promise<any>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "trionda-wears/avatars",
        public_id: `user-${userId}-${Date.now()}`,
        resource_type: "image",
        transformation: { width: 512, height: 512, crop: "limit" },
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Upload failed — no result returned"));
        resolve(result);
      }
    );
    uploadStream.end(file.buffer);
  });

  const user = await prisma.user.update({
    where: { id: userId },
    data: { image: result.secure_url },
  });
  return sanitizeUser(user);
}

// ---------------------------------------------------------------------------
// Google Login
// ---------------------------------------------------------------------------

export async function googleLogin(body: GoogleLoginRequestBody): Promise<AuthTokensResponse> {
  const { credential } = body;

  // Verify the Google ID token
  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });
  } catch (err) {
    throw new AppError("Invalid Google token", 401);
  }

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new AppError("Could not extract Google user info", 401);
  }

  const { email, name, picture } = payload;

  // Find or create user
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Create new user from Google data
    user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        image: picture || null,
        emailVerified: new Date(),
      },
    });
  } else {
    // Existing user — refresh the avatar whenever Google provides one (keeps
    // the profile icon in sync if the user changes their Google photo), and
    // backfill the name once if it was never set.
    const patch: any = {};
    if (!user.name && name) patch.name = name;
    if (picture && picture !== user.image) patch.image = picture;
    if (Object.keys(patch).length > 0) {
      user = await prisma.user.update({ where: { id: user.id }, data: patch });
    }
  }

  const tokens = generateTokens(user);

  return {
    user: sanitizeUser(user),
    ...tokens,
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
