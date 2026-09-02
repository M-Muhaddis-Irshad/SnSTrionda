"use strict";
// =============================================================================
// Auth Feature — Optional Authentication Middleware
// =============================================================================
// Decodes the JWT access token if present and valid, attaches req.user.
// Does NOT return 401 if no token is provided — allows guest flows.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = optionalAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET;
function optionalAuth(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        // No token — that's fine, continue without req.user
        return next();
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded.type === "access") {
            req.user = decoded;
        }
    }
    catch {
        // Invalid/expired token — ignore, continue without req.user
    }
    next();
}
//# sourceMappingURL=auth.optional.js.map