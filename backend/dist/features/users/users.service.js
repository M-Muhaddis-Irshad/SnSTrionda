"use strict";
// =============================================================================
// Users Feature — Business Logic Service (admin user management)
// =============================================================================
// NOTE: the User model has NO isActive/isBanned field, so disable/enable is
// intentionally NOT implemented here — that needs a schema decision first.
// The password hash column is named `password` — it is NEVER selected in any
// query in this file.
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersError = exports.USER_ROLES = void 0;
exports.listUsers = listUsers;
exports.getUserProfile = getUserProfile;
exports.changeUserRole = changeUserRole;
const db_1 = require("../../db");
exports.USER_ROLES = ["CUSTOMER", "ADMIN"];
// ---------------------------------------------------------------------------
// Custom Error
// ---------------------------------------------------------------------------
class UsersError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = "UsersError";
    }
}
exports.UsersError = UsersError;
// ---------------------------------------------------------------------------
// Safe select — every field except password
// ---------------------------------------------------------------------------
const USER_SAFE_SELECT = {
    id: true,
    name: true,
    email: true,
    phone: true,
    role: true,
    emailVerified: true,
    image: true,
    createdAt: true,
    updatedAt: true,
};
async function listUsers(params) {
    const { page, limit, role, search } = params;
    const skip = (page - 1) * limit;
    const where = {};
    if (role) {
        where.role = role;
    }
    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
        ];
    }
    const [users, total] = await Promise.all([
        db_1.prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            select: {
                ...USER_SAFE_SELECT,
                _count: { select: { orders: true } },
            },
        }),
        db_1.prisma.user.count({ where }),
    ]);
    const totalPages = Math.ceil(total / limit);
    return {
        data: users,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    };
}
// ---------------------------------------------------------------------------
// Profile (with lightweight order summary)
// ---------------------------------------------------------------------------
async function getUserProfile(userId) {
    const user = await db_1.prisma.user.findUnique({
        where: { id: userId },
        select: {
            ...USER_SAFE_SELECT,
            _count: { select: { orders: true } },
            orders: {
                orderBy: { createdAt: "desc" },
                take: 5,
                select: {
                    id: true,
                    orderNumber: true,
                    status: true,
                    total: true,
                    createdAt: true,
                },
            },
        },
    });
    if (!user) {
        throw new UsersError("User not found", 404);
    }
    return user;
}
// ---------------------------------------------------------------------------
// Role change (with self-demotion guard)
// ---------------------------------------------------------------------------
async function changeUserRole(actorId, userId, role) {
    const user = await db_1.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
    });
    if (!user) {
        throw new UsersError("User not found", 404);
    }
    // An admin must never be able to demote themselves — prevents accidental
    // self-lockout (the only path to losing the last admin would be another
    // admin doing it deliberately).
    if (actorId && actorId === userId && role !== "ADMIN") {
        throw new UsersError("You cannot remove your own ADMIN role.", 400);
    }
    if (user.role === role) {
        // No-op — still return a clean success so the UI can refetch safely.
        const unchanged = await db_1.prisma.user.findUnique({
            where: { id: userId },
            select: USER_SAFE_SELECT,
        });
        return { user: unchanged, fromRole: user.role };
    }
    const updated = await db_1.prisma.user.update({
        where: { id: userId },
        data: { role },
        select: USER_SAFE_SELECT,
    });
    return { user: updated, fromRole: user.role };
}
//# sourceMappingURL=users.service.js.map