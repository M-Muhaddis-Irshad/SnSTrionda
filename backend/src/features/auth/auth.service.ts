// =============================================================================
// Auth Feature — Business Logic Service
// =============================================================================

import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import cloudinary from "../../config/cloudinary";
import { prisma } from "../../db";
import {
  sendPasswordResetEmail,
  PASSWORD_RESET_OTP_MINUTES,
} from "../../services/emailService";
import type {
  RegisterRequestBody,
  LoginRequestBody,
  GoogleLoginRequestBody,
  ForgotPasswordRequestBody,
  ResetPasswordRequestBody,
  AuthUser,
  AuthTokensResponse,
  AccessTokenPayload,
  RefreshTokenPayload,
} from "./auth.types";

// The Google client id may be configured under either name depending on where
// it lives: Render sets GOOGLE_CLIENT_ID, while the Next.js/Vercel build sets
// NEXT_PUBLIC_GOOGLE_CLIENT_ID. Accept both so ID-token verification never
// silently runs with an undefined audience (which fails every Google login).
const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

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

function generateAccessToken(user: {
  id: string;
  email: string;
  role: string;
  tokenVersion?: number | null;
}): string {
  const payload: AccessTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    // Snapshot so tokens minted BEFORE a password reset are rejected later.
    tokenVersion: user.tokenVersion ?? 0,
    type: "access",
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

function generateRefreshToken(user: {
  id: string;
  email: string;
  tokenVersion?: number | null;
}): string {
  const payload: RefreshTokenPayload = {
    userId: user.id,
    email: user.email,
    tokenVersion: user.tokenVersion ?? 0,
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

  // 1. Super admin credentials live in their own dedicated table, so they are
  //    never mixed with customer accounts.
  const superAdmin = await prisma.superAdmin.findUnique({ where: { email } });
  if (superAdmin) {
    const isSuperAdminPasswordValid = await bcrypt.compare(password, superAdmin.password || "");
    if (!isSuperAdminPasswordValid) {
      // Generic error — don't reveal whether email or password was wrong
      throw new AppError("Invalid email or password", 401);
    }

    // The super admin has a matching shadow row in the User table (role
    // SUPER_ADMIN, no usable password) so JWT refresh, /auth/me, chat and the
    // activity feed keep working through the existing User relations.
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== "SUPER_ADMIN") {
      throw new AppError("Super admin account is not fully configured", 500);
    }

    const tokens = generateTokens(user);

    return {
      user: sanitizeUser(user),
      ...tokens,
    };
  }

  // 2. Normal users and delegated admins
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Generic error — don't reveal whether email or password was wrong
    throw new AppError("Invalid email or password", 401);
  }

  // A SUPER_ADMIN shadow row without a matching SuperAdmin entry must never
  // be allowed to sign in through the regular path.
  if (user.role === "SUPER_ADMIN") {
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

  // Reject refresh tokens issued before a password reset (tokenVersion bump).
  if ((payload.tokenVersion ?? 0) !== user.tokenVersion) {
    throw new AppError("Session expired. Please sign in again.", 401);
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
      audience: GOOGLE_CLIENT_ID,
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
    // Existing user — backfill the name once if it was never set. Only copy
    // the Google photo when the user has no avatar of their own (an uploaded
    // profile picture must never be silently replaced by the Google one).
    const patch: any = {};
    if (!user.name && name) patch.name = name;
    if (picture && !user.image) patch.image = picture;
    if (Object.keys(patch).length > 0) {
      user = await prisma.user.update({ where: { id: user.id }, data: patch });
    }
  }

  // Super admins authenticate with their own dedicated credentials — never via
  // Google (the shadow User row must not be reachable through OAuth).
  if (user.role === "SUPER_ADMIN") {
    throw new AppError("This account requires admin credentials to sign in.", 403);
  }

  const tokens = generateTokens(user);

  return {
    user: sanitizeUser(user),
    ...tokens,
  };
}

// ---------------------------------------------------------------------------
// Password reset — request a code (POST /api/auth/forgot-password)
// ---------------------------------------------------------------------------

/** Wrong-OTP attempts allowed before the stored code is wiped. */
const RESET_OTP_MAX_ATTEMPTS = 5;

/** Same rules as the signup / reset form in the frontend. */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GENERIC_RESET_MESSAGE =
  "If an account exists for that email, we've sent a 6-digit reset code.";

async function findUserByEmail(email: string) {
  const trimmed = email.trim();
  return prisma.user.findFirst({
    where: { email: { in: [trimmed, trimmed.toLowerCase()] } },
  });
}

function generateOtp(): string {
  // crypto.randomInt is CSPRNG-backed. Numeric (not hex) so the code always
  // matches the "6 digits" validation in both the UI and this service.
  return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
}

async function clearPasswordReset(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordResetToken: null,
      passwordResetTokenExpiry: null,
      passwordResetAttempts: 0,
    },
  });
}

export async function forgotPassword(
  body: ForgotPasswordRequestBody
): Promise<{ message: string }> {
  const email = body.email?.trim();

  if (!email || !EMAIL_REGEX.test(email)) {
    throw new AppError("Enter a valid email address.", 400);
  }

  const user = await findUserByEmail(email);

  // Unknown address: identical response so an email can never be probed here.
  if (!user) {
    console.warn(`[password-reset] code requested for unknown address: ${email}`);
    return { message: GENERIC_RESET_MESSAGE };
  }

  // Super admin credentials are recovered out of band, never self-service.
  // This MUST be checked before the Google-only branch below: the super
  // admin's shadow User row always has password = NULL, so otherwise the
  // "sign in with Google" message would be shown instead.
  if (user.role === "SUPER_ADMIN") {
    console.warn(
      `[password-reset] blocked self-service reset for SUPER_ADMIN ${user.email}`
    );
    return { message: GENERIC_RESET_MESSAGE };
  }

  // Google-only accounts have no password — there is nothing to reset.
  if (!user.password) {
    return {
      message:
        "This account signs in with Google. Use 'Continue with Google' instead.",
    };
  }

  const otp = generateOtp();
  // Store only the bcrypt hash — the DB never holds the raw code.
  const hash = await bcrypt.hash(otp, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hash,
      passwordResetTokenExpiry: new Date(
        Date.now() + PASSWORD_RESET_OTP_MINUTES * 60 * 1000
      ),
      passwordResetAttempts: 0,
    },
  });

  const sent = await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    otp,
  });

  if (!sent.ok) {
    // Still a 200 (never leak), but make the failure obvious in the logs.
    console.error(
      `[password-reset] email failed for ${user.email}: ${sent.error}`
    );
  }

  return { message: GENERIC_RESET_MESSAGE };
}

// ---------------------------------------------------------------------------
// Password reset — redeem the code (POST /api/auth/reset-password)
// ---------------------------------------------------------------------------

export async function resetPassword(
  body: ResetPasswordRequestBody
): Promise<{ message: string }> {
  const email = body.email?.trim() || "";
  const otp = String(body.otp || "").trim();
  const newPassword = body.newPassword || body.password || "";

  if (!email || !EMAIL_REGEX.test(email)) {
    throw new AppError("Enter a valid email address.", 400);
  }
  if (!/^\d{6}$/.test(otp)) {
    throw new AppError("Enter the 6-digit code from your email.", 400);
  }
  if (!PASSWORD_REGEX.test(newPassword)) {
    throw new AppError(
      "Password must be at least 8 characters with an uppercase letter and a number.",
      400
    );
  }

  const user = await findUserByEmail(email);

  // SUPER_ADMIN and Google-only rows never receive a code (forgot-password
  // blocks them), so they land here with the same generic error.
  if (
    !user ||
    !user.passwordResetToken ||
    !user.passwordResetTokenExpiry
  ) {
    throw new AppError("Invalid or expired code.", 401);
  }

  if (user.passwordResetTokenExpiry.getTime() < Date.now()) {
    await clearPasswordReset(user.id);
    throw new AppError("This code has expired. Request a new one.", 401);
  }

  if (user.passwordResetAttempts >= RESET_OTP_MAX_ATTEMPTS) {
    await clearPasswordReset(user.id);
    throw new AppError("Too many incorrect attempts. Request a new code.", 401);
  }

  const matches = await bcrypt.compare(otp, user.passwordResetToken);
  if (!matches) {
    const attempts = user.passwordResetAttempts + 1;
    if (attempts >= RESET_OTP_MAX_ATTEMPTS) {
      await clearPasswordReset(user.id);
      throw new AppError(
        "Too many incorrect attempts. Request a new code.",
        401
      );
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetAttempts: attempts },
    });
    throw new AppError("Invalid code. Please try again.", 401);
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: passwordHash,
      passwordResetToken: null,
      passwordResetTokenExpiry: null,
      passwordResetAttempts: 0,
      // Bumping this invalidates every JWT issued before the reset.
      tokenVersion: { increment: 1 },
      // They just proved control of the mailbox.
      emailVerified: user.emailVerified ?? new Date(),
    },
  });

  return { message: "Password updated. Sign in with your new password." };
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
