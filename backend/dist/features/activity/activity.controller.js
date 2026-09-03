"use strict";
// =============================================================================
// Activity Feature — Request Handlers (Controller)
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleListActivity = handleListActivity;
const activity_service_1 = require("./activity.service");
// ---------------------------------------------------------------------------
// GET /api/admin/activity — paginated feed with optional filters
// ---------------------------------------------------------------------------
async function handleListActivity(req, res) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const result = await (0, activity_service_1.listAdminActivity)({
            page,
            limit,
            action: req.query.action || undefined,
            entityType: req.query.entityType || undefined,
            from: req.query.from || undefined,
            to: req.query.to || undefined,
        });
        res.json(result);
    }
    catch (err) {
        console.error("Activity list error:", err?.message || err);
        res.status(500).json({ error: "Internal server error" });
    }
}
//# sourceMappingURL=activity.controller.js.map