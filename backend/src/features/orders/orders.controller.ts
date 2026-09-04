// =============================================================================
// Orders Feature — Request Handlers (Controller)
// =============================================================================

import { Request, Response } from "express";
import { createOrder, getOrderByNumber, getMyOrderByNumber, getMyOrders, OrderError, validatePromoCode } from "./orders.service";
import { getIO } from "../../sockets";
import { createNotification, pushAdminStats, ORDER_STATUS_LABELS } from "../../services/socketService";

// ---------------------------------------------------------------------------
// GET /api/orders/promo/validate?code=TRIONDA10 — public promo validation
// ---------------------------------------------------------------------------

export async function handleValidatePromo(req: Request, res: Response) {
  try {
    const code = (req.query.code as string) || "";
    const result = validatePromoCode(code);
    res.status(result.valid ? 200 : 400).json(result);
  } catch (err: any) {
    console.error("Validate promo error:", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// GET /api/orders/mine — customer's own orders (list)
// ---------------------------------------------------------------------------

export async function handleGetMyOrders(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const orders = await getMyOrders(userId);
    res.status(200).json({ data: orders });
  } catch (err: any) {
    console.error("Get my orders error:", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ---------------------------------------------------------------------------
// GET /api/orders/mine/:orderNumber — customer's own order (single, authenticated)
// ---------------------------------------------------------------------------

export async function handleGetMyOrder(req: Request, res: Response) {
  try {
    const orderNumber = req.params.orderNumber as string;
    const userId = req.user?.userId;

    if (!orderNumber) {
      return res.status(400).json({ error: "orderNumber is required." });
    }

    if (!userId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const order = await getMyOrderByNumber(orderNumber, userId);

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    res.status(200).json({ data: order });
  } catch (err: any) {
    console.error("Get my order error:", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ---------------------------------------------------------------------------
// GET /api/orders/:orderNumber — public, requires email verification
// ---------------------------------------------------------------------------

export async function handleGetOrder(req: Request, res: Response) {
  try {
    const orderNumber = req.params.orderNumber as string;
    const email = req.query.email as string | undefined;

    if (!orderNumber) {
      return res.status(400).json({ error: "orderNumber is required." });
    }

    // Require email for verification
    if (!email || email.trim().length === 0) {
      return res.status(400).json({ error: "email query parameter is required." });
    }

    const order = await getOrderByNumber(orderNumber, email);

    if (!order) {
      // 404 regardless of whether it's missing email or wrong email
      return res.status(404).json({ error: "Order not found." });
    }

    res.status(200).json({ data: order });
  } catch (err: any) {
    console.error("Get order error:", err?.message || err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ---------------------------------------------------------------------------
// POST /api/orders
// ---------------------------------------------------------------------------

export async function handleCreateOrder(req: Request, res: Response) {
  try {
    const { items, shippingAddress, paymentMethod, email, promoCode, deliveryZoneId } = req.body;

    // If user is authenticated, their userId will be used; otherwise guest user is created
    const authUserId = req.user?.userId;

    const order = await createOrder(
      { items, shippingAddress, paymentMethod, email, promoCode, deliveryZoneId },
      authUserId
    );

    // Notify connected admins in real time (Socket.IO 'admin' room).
    // Emit only AFTER the order is committed to the database.
    try {
      getIO()
        .to("admin")
        .emit("order:created", {
          orderId: order!.id,
          orderNumber: order!.orderNumber,
          total: Number(order!.total),
          status: order!.status,
          paymentMethod: order!.paymentMethod,
          paymentStatus: order!.paymentStatus,
          createdAt: order!.createdAt,
          user: order!.user,
          items: order!.items.map((i) => ({
            productName: (i.productVariant as any).product?.name ?? "Product",
            quantity: i.quantity,
            price: Number(i.priceAtPurchase),
          })),
        });
      console.log(`📡 Socket: emitted order:created for ${order!.orderNumber}`);
    } catch (emitErr: any) {
      // Socket failure must never block order placement
      console.error("Socket emit failed (order still saved):", emitErr?.message || emitErr);
    }

    // Confirmation notification for the customer (skip guest checkout users)
    const isGuest = order!.user.email?.toLowerCase().endsWith("@trionda-guest.local");
    if (!isGuest) {
      await createNotification(
        order!.user.id,
        "ORDER_STATUS",
        `Order ${order!.orderNumber} — Placed`,
        `We've received your order ${order!.orderNumber} (${ORDER_STATUS_LABELS[order!.status] || order!.status}). You'll get live updates as it progresses.`,
        { orderId: order!.id, orderNumber: order!.orderNumber, status: order!.status }
      );
    }

    // Refresh live admin dashboard stats without waiting for the 30s tick
    pushAdminStats().catch(() => {});

    res.status(201).json({
      message: "Order placed successfully",
      data: order,
    });
  } catch (err: any) {
    if (err instanceof OrderError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("Create order error:", err?.message || err);
    console.error("Create order stack:", err?.stack);
    res.status(500).json({ error: "Internal server error" });
  }
}
