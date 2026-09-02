"use strict";
// =============================================================================
// Auth Feature — Middleware (authenticate & requireRole)
// =============================================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET;
// ---------------------------------------------------------------------------
// authenticate middleware
// ---------------------------------------------------------------------------
// Reads the Authorization header, verifies the JWT access token, and attaches
// the decoded payload to req.user. Returns 401 on any failure.
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authentication required. Please provide a valid access token." });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded.type !== "access") {
            return res.status(401).json({ error: "Invalid token type. Access token required." });
        }
        req.user = decoded;
        next();
    }
    catch (err) {
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
function requireRole(...allowedRoles) {
    return (req, res, next) => {
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
//# sourceMappingURL=auth.middleware.js.map