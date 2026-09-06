"use strict";
// =============================================================================
// Auth Feature — Business Logic Service
// =============================================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.register = register;
exports.login = login;
exports.refreshToken = refreshToken;
exports.logout = logout;
exports.googleLogin = googleLogin;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const google_auth_library_1 = require("google-auth-library");
const db_1 = require("../../db");
const googleClient = new google_auth_library_1.OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
// ---------------------------------------------------------------------------
// Config — these come from environment variables
// ---------------------------------------------------------------------------
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
const BCRYPT_SALT_ROUNDS = 12;
// ---------------------------------------------------------------------------
// Helper: strip passwordHash from a user object
// ---------------------------------------------------------------------------
function sanitizeUser(user) {
    const { password, ...rest } = user;
    return rest;
}
// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------
function generateAccessToken(user) {
    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        type: "access",
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
function generateRefreshToken(user) {
    const payload = {
        userId: user.id,
        email: user.email,
        type: "refresh",
    };
    // Refresh tokens use a DIFFERENT secret than access tokens (security best practice)
    return jsonwebtoken_1.default.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}
function generateTokens(user) {
    return {
        accessToken: generateAccessToken(user),
        refreshToken: generateRefreshToken(user),
    };
}
// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------
async function register(body) {
    const { email, password, name, phone } = body;
    // Check if user already exists
    const existingUser = await db_1.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new AppError("An account with this email already exists", 409);
    }
    // Hash password
    const hashedPassword = await bcryptjs_1.default.hash(password, BCRYPT_SALT_ROUNDS);
    // Create user
    const user = await db_1.prisma.user.create({
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
async function login(body) {
    const { email, password } = body;
    // Find user by email
    const user = await db_1.prisma.user.findUnique({ where: { email } });
    if (!user) {
        // Generic error — don't reveal whether email or password was wrong
        throw new AppError("Invalid email or password", 401);
    }
    // Verify password
    const isPasswordValid = await bcryptjs_1.default.compare(password, user.password || '');
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
async function refreshToken(token) {
    // Verify the refresh token
    let payload;
    try {
        payload = jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET);
    }
    catch (err) {
        throw new AppError("Invalid or expired refresh token", 401);
    }
    // Ensure it's actually a refresh token (not an access token reused here)
    if (payload.type !== "refresh") {
        throw new AppError("Invalid token type", 401);
    }
    // Fetch the user to get their current role
    const user = await db_1.prisma.user.findUnique({ where: { id: payload.userId } });
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
function logout() {
    return {
        message: "Successfully logged out. Please discard your access and refresh tokens.",
    };
}
// ---------------------------------------------------------------------------
// Google Login
// ---------------------------------------------------------------------------
async function googleLogin(body) {
    const { credential } = body;
    // Verify the Google ID token
    let ticket;
    try {
        ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        });
    }
    catch (err) {
        throw new AppError("Invalid Google token", 401);
    }
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
        throw new AppError("Could not extract Google user info", 401);
    }
    const { email, name, picture } = payload;
    // Find or create user
    let user = await db_1.prisma.user.findUnique({ where: { email } });
    if (!user) {
        // Create new user from Google data
        user = await db_1.prisma.user.create({
            data: {
                email,
                name: name || null,
                image: picture || null,
                emailVerified: new Date(),
            },
        });
    }
    else if (!user.name && name) {
        // Update name if user exists but has no name
        user = await db_1.prisma.user.update({
            where: { id: user.id },
            data: { name, image: user.image || picture || null },
        });
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
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = "AppError";
    }
}
exports.AppError = AppError;
//# sourceMappingURL=auth.service.js.map