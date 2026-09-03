// =============================================================================
// Orders Feature — Request Handlers (Controller)
// =============================================================================

import { Request, Response } from "express";
import { createOrder, getOrderByNumber, getMyOrderByNumber, getMyOrders, OrderError, validatePromoCode } from "./orders.service";

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
    const { items, shippingAddress, paymentMethod, email, promoCode } = req.body;

    // If user is authenticated, their userId will be used; otherwise guest user is created
    const authUserId = req.user?.userId;

    const order = await createOrder(
      { items, shippingAddress, paymentMethod, email, promoCode },
      authUserId
    );

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
