"use strict";
// =============================================================================
// Auth Feature — Request Handlers (Controller)
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRegister = handleRegister;
exports.handleLogin = handleLogin;
exports.handleRefresh = handleRefresh;
exports.handleLogout = handleLogout;
exports.handleMe = handleMe;
exports.handleAdminCheck = handleAdminCheck;
exports.handleGoogleLogin = handleGoogleLogin;
exports.handleGetAuthImage = handleGetAuthImage;
const auth_service_1 = require("./auth.service");
const db_1 = require("../../db");
// ---------------------------------------------------------------------------
// Helper: extract and validate request body
// ---------------------------------------------------------------------------
function getBody(req) {
    return req.body;
}
// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
async function handleRegister(req, res) {
    try {
        const body = getBody(req);
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
        const result = await (0, auth_service_1.register)(body);
        res.status(201).json({
            message: "Account created successfully",
            ...result,
        });
    }
    catch (err) {
        if (err instanceof auth_service_1.AppError) {
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
async function handleLogin(req, res) {
    try {
        const body = getBody(req);
        // Basic validation
        if (!body.email || !body.password) {
            return res.status(400).json({
                error: "Email and password are required",
            });
        }
        const result = await (0, auth_service_1.login)(body);
        res.json({
            message: "Login successful",
            ...result,
        });
    }
    catch (err) {
        if (err instanceof auth_service_1.AppError) {
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
async function handleRefresh(req, res) {
    try {
        const body = getBody(req);
        if (!body.refreshToken) {
            return res.status(400).json({
                error: "Refresh token is required",
            });
        }
        const result = await (0, auth_service_1.refreshToken)(body.refreshToken);
        res.json({
            message: "Tokens refreshed successfully",
            ...result,
        });
    }
    catch (err) {
        if (err instanceof auth_service_1.AppError) {
            return res.status(err.statusCode).json({ error: err.message });
        }
        console.error("Refresh error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
}
// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------
function handleLogout(req, res) {
    try {
        const result = (0, auth_service_1.logout)();
        res.json(result);
    }
    catch (err) {
        console.error("Logout error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
}
// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------
async function handleMe(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: "Authentication required." });
        }
        const user = await db_1.prisma.user.findUnique({
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
    }
    catch (err) {
        console.error("Get profile error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
}
// ---------------------------------------------------------------------------
// GET /api/auth/admin-check
// ---------------------------------------------------------------------------
function handleAdminCheck(req, res) {
    res.json({ message: "Admin access confirmed.", user: req.user });
}
// ---------------------------------------------------------------------------
// POST /api/auth/google
// ---------------------------------------------------------------------------
async function handleGoogleLogin(req, res) {
    try {
        const body = getBody(req);
        if (!body.credential) {
            return res.status(400).json({
                error: "Google credential is required",
            });
        }
        const result = await (0, auth_service_1.googleLogin)(body);
        res.json({
            message: "Google login successful",
            ...result,
        });
    }
    catch (err) {
        if (err instanceof auth_service_1.AppError) {
            return res.status(err.statusCode).json({ error: err.message });
        }
        console.error("Google login error:", err?.message || err);
        res.status(500).json({ error: "Internal server error", details: err?.message });
    }
}
// ---------------------------------------------------------------------------
// GET /api/auth/images/:pageType
// ---------------------------------------------------------------------------
async function handleGetAuthImage(req, res) {
    try {
        const pageType = req.params.pageType;
        const image = await db_1.prisma.authImage.findFirst({
            where: { pageType },
        });
        if (!image) {
            return res.status(404).json({ error: "Image not found" });
        }
        res.json(image);
    }
    catch (err) {
        console.error("Auth image error:", err);
        res.status(500).json({ error: "Failed to fetch image" });
    }
}
//# sourceMappingURL=auth.controller.js.map