"use strict";
// =============================================================================
// Orders Feature — Request Handlers (Controller)
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetMyOrders = handleGetMyOrders;
exports.handleGetMyOrder = handleGetMyOrder;
exports.handleGetOrder = handleGetOrder;
exports.handleCreateOrder = handleCreateOrder;
const orders_service_1 = require("./orders.service");
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// GET /api/orders/mine — customer's own orders (list)
// ---------------------------------------------------------------------------
async function handleGetMyOrders(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: "Authentication required." });
        }
        const orders = await (0, orders_service_1.getMyOrders)(userId);
        res.status(200).json({ data: orders });
    }
    catch (err) {
        console.error("Get my orders error:", err?.message || err);
        res.status(500).json({ error: "Internal server error" });
    }
}
// ---------------------------------------------------------------------------
// GET /api/orders/mine/:orderNumber — customer's own order (single, authenticated)
// ---------------------------------------------------------------------------
async function handleGetMyOrder(req, res) {
    try {
        const orderNumber = req.params.orderNumber;
        const userId = req.user?.userId;
        if (!orderNumber) {
            return res.status(400).json({ error: "orderNumber is required." });
        }
        if (!userId) {
            return res.status(401).json({ error: "Authentication required." });
        }
        const order = await (0, orders_service_1.getMyOrderByNumber)(orderNumber, userId);
        if (!order) {
            return res.status(404).json({ error: "Order not found." });
        }
        res.status(200).json({ data: order });
    }
    catch (err) {
        console.error("Get my order error:", err?.message || err);
        res.status(500).json({ error: "Internal server error" });
    }
}
// ---------------------------------------------------------------------------
// GET /api/orders/:orderNumber — public, requires email verification
// ---------------------------------------------------------------------------
async function handleGetOrder(req, res) {
    try {
        const orderNumber = req.params.orderNumber;
        const email = req.query.email;
        if (!orderNumber) {
            return res.status(400).json({ error: "orderNumber is required." });
        }
        // Require email for verification
        if (!email || email.trim().length === 0) {
            return res.status(400).json({ error: "email query parameter is required." });
        }
        const order = await (0, orders_service_1.getOrderByNumber)(orderNumber, email);
        if (!order) {
            // 404 regardless of whether it's missing email or wrong email
            return res.status(404).json({ error: "Order not found." });
        }
        res.status(200).json({ data: order });
    }
    catch (err) {
        console.error("Get order error:", err?.message || err);
        res.status(500).json({ error: "Internal server error" });
    }
}
// ---------------------------------------------------------------------------
// POST /api/orders
// ---------------------------------------------------------------------------
async function handleCreateOrder(req, res) {
    try {
        const { items, shippingAddress, paymentMethod, email } = req.body;
        // If user is authenticated, their userId will be used; otherwise guest user is created
        const authUserId = req.user?.userId;
        const order = await (0, orders_service_1.createOrder)({ items, shippingAddress, paymentMethod, email }, authUserId);
        res.status(201).json({
            message: "Order placed successfully",
            data: order,
        });
    }
    catch (err) {
        if (err instanceof orders_service_1.OrderError) {
            return res.status(err.statusCode).json({ error: err.message });
        }
        console.error("Create order error:", err?.message || err);
        console.error("Create order stack:", err?.stack);
        res.status(500).json({ error: "Internal server error" });
    }
}
//# sourceMappingURL=orders.controller.js.map