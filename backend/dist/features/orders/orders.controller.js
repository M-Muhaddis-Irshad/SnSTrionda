"use strict";
// =============================================================================
// Orders Feature — Request Handlers (Controller)
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleValidatePromo = handleValidatePromo;
exports.handleGetMyOrders = handleGetMyOrders;
exports.handleGetMyOrder = handleGetMyOrder;
exports.handleGetOrder = handleGetOrder;
exports.handleCreateOrder = handleCreateOrder;
const orders_service_1 = require("./orders.service");
const socket_1 = require("../../lib/socket");
const socketService_1 = require("../../services/socketService");
// ---------------------------------------------------------------------------
// GET /api/orders/promo/validate?code=TRIONDA10 — public promo validation
// ---------------------------------------------------------------------------
async function handleValidatePromo(req, res) {
    try {
        const code = req.query.code || "";
        const result = (0, orders_service_1.validatePromoCode)(code);
        res.status(result.valid ? 200 : 400).json(result);
    }
    catch (err) {
        console.error("Validate promo error:", err?.message || err);
        res.status(500).json({ error: "Internal server error" });
    }
}
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
        const { items, shippingAddress, paymentMethod, email, promoCode, deliveryZoneId } = req.body;
        // If user is authenticated, their userId will be used; otherwise guest user is created
        const authUserId = req.user?.userId;
        const order = await (0, orders_service_1.createOrder)({ items, shippingAddress, paymentMethod, email, promoCode, deliveryZoneId }, authUserId);
        // Notify connected admins in real time (Socket.IO 'admin' room).
        // Emit only AFTER the order is committed to the database.
        try {
            (0, socket_1.getIO)()
                .to("admin")
                .emit("order:created", {
                orderId: order.id,
                orderNumber: order.orderNumber,
                total: Number(order.total),
                status: order.status,
                paymentMethod: order.paymentMethod,
                paymentStatus: order.paymentStatus,
                createdAt: order.createdAt,
                user: order.user,
                items: order.items.map((i) => ({
                    productName: i.productVariant.product?.name ?? "Product",
                    quantity: i.quantity,
                    price: Number(i.priceAtPurchase),
                })),
            });
            console.log(`📡 Socket: emitted order:created for ${order.orderNumber}`);
        }
        catch (emitErr) {
            // Socket failure must never block order placement
            console.error("Socket emit failed (order still saved):", emitErr?.message || emitErr);
        }
        // Confirmation notification for the customer (skip guest checkout users)
        const isGuest = order.user.email?.toLowerCase().endsWith("@trionda-guest.local");
        if (!isGuest) {
            await (0, socketService_1.createNotification)(order.user.id, "ORDER_STATUS", `Order ${order.orderNumber} — Placed`, `We've received your order ${order.orderNumber} (${socketService_1.ORDER_STATUS_LABELS[order.status] || order.status}). You'll get live updates as it progresses.`, { orderId: order.id, orderNumber: order.orderNumber, status: order.status });
        }
        // Refresh live admin dashboard stats without waiting for the 30s tick
        (0, socketService_1.pushAdminStats)().catch(() => { });
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