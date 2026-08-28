"use strict";
// =============================================================================
// Auth Feature — Request Handlers (Controller)
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRegister = handleRegister;
exports.handleLogin = handleLogin;
exports.handleRefresh = handleRefresh;
exports.handleLogout = handleLogout;
const auth_service_1 = require("./auth.service");
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
//# sourceMappingURL=auth.controller.js.map