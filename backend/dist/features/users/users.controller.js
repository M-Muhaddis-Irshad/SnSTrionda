"use strict";
// =============================================================================
// Users Feature — Request Handlers (Controller)
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleListUsers = handleListUsers;
exports.handleGetUserProfile = handleGetUserProfile;
exports.handleChangeUserRole = handleChangeUserRole;
const users_service_1 = require("./users.service");
const socketService_1 = require("../../services/socketService");
// Fire-and-forget audit trail entry (never blocks or fails the request)
function track(adminId, action, entityType, entityId, details) {
    if (!adminId)
        return;
    (0, socketService_1.logAdminActivity)(adminId, action, entityType, entityId, details ?? null).catch(() => { });
}
// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function handleUsersError(err, res) {
    if (err instanceof users_service_1.UsersError) {
        return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("Users error:", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
}
function isUserRole(value) {
    return typeof value === "string" && users_service_1.USER_ROLES.includes(value);
}
// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------
async function handleListUsers(req, res) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const search = req.query.search || undefined;
        const role = req.query.role || undefined;
        if (role && !isUserRole(role)) {
            return res.status(400).json({
                error: `Invalid role filter. Must be one of: ${users_service_1.USER_ROLES.join(", ")}.`,
            });
        }
        const result = await (0, users_service_1.listUsers)({ page, limit, role, search });
        res.json(result);
    }
    catch (err) {
        handleUsersError(err, res);
    }
}
async function handleGetUserProfile(req, res) {
    try {
        const userId = req.params.userId;
        const user = await (0, users_service_1.getUserProfile)(userId);
        res.json({ data: user });
    }
    catch (err) {
        handleUsersError(err, res);
    }
}
async function handleChangeUserRole(req, res) {
    try {
        const userId = req.params.userId;
        const { role } = req.body;
        if (!isUserRole(role)) {
            return res.status(400).json({
                error: `Invalid role. Must be one of: ${users_service_1.USER_ROLES.join(", ")}.`,
            });
        }
        const { user, fromRole } = await (0, users_service_1.changeUserRole)(req.user?.userId, userId, role);
        res.json({ data: user, message: `Role changed to ${role}` });
        track(req.user?.userId, "UPDATE_USER_ROLE", "User", userId, {
            fromRole,
            toRole: role,
        });
    }
    catch (err) {
        handleUsersError(err, res);
    }
}
//# sourceMappingURL=users.controller.js.map