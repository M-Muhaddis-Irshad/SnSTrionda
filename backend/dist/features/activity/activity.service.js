"use strict";
// =============================================================================
// Activity Feature — Business Logic Service (admin audit feed)
// =============================================================================
// Rows are written by socketService.logAdminActivity() whenever an admin
// mutates a core entity; this service only reads them back for the feed.
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAdminActivity = listAdminActivity;
const db_1 = require("../../db");
async function listAdminActivity(params) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;
    const where = {};
    if (params.action)
        where.action = params.action;
    if (params.entityType)
        where.entityType = params.entityType;
    const createdAt = {};
    if (params.from) {
        const from = new Date(params.from + "T00:00:00.000Z");
        if (!isNaN(from.getTime()))
            createdAt.gte = from;
    }
    if (params.to) {
        const to = new Date(params.to + "T23:59:59.999Z");
        if (!isNaN(to.getTime()))
            createdAt.lte = to;
    }
    if (Object.keys(createdAt).length > 0)
        where.createdAt = createdAt;
    const [data, total] = await Promise.all([
        db_1.prisma.adminActivity.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                admin: { select: { id: true, name: true, email: true } },
            },
        }),
        db_1.prisma.adminActivity.count({ where }),
    ]);
    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}
//# sourceMappingURL=activity.service.js.map