// =============================================================================
// Orders Feature — Request Handlers (Controller)
// =============================================================================

import { Request, Response } from "express";
import { createOrder, getOrderByNumber, OrderError } from "./orders.service";

// ---------------------------------------------------------------------------
// POST /api/orders
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// GET /api/orders/:orderNumber
// ---------------------------------------------------------------------------

export async function handleGetOrder(req: Request, res: Response) {
  try {
    const orderNumber = req.params.orderNumber as string;

    if (!orderNumber) {
      return res.status(400).json({ error: "orderNumber is required." });
    }

    const order = await getOrderByNumber(orderNumber);

    if (!order) {
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
    const { items, shippingAddress, paymentMethod, email } = req.body;

    // If user is authenticated, their userId will be used; otherwise guest user is created
    const authUserId = req.user?.userId;

    const order = await createOrder(
      { items, shippingAddress, paymentMethod, email },
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
