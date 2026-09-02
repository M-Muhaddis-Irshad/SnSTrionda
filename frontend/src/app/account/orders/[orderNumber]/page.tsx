"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  createdAt: string;
  userId: string;
  items: {
    quantity: number;
    priceAtPurchase: number;
    productVariant: {
      product: { name: string; slug: string };
      size: string;
      color: string;
      sku: string;
    };
    customMeasurement?: { label: string } | null;
  }[];
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    province: string;
    postalCode?: string | null;
    country: string;
  };
  user: {
    id: string;
    email: string;
    name: string;
  };
}

function formatPrice(price: number): string {
  return `Rs. ${price.toLocaleString("en-PK")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const orderNumber = params.orderNumber as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`${API_URL}/api/orders/mine/${orderNumber}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) {
          setError("Order not found.");
          setLoading(false);
          return;
        }

        const data = await res.json();
        setOrder(data.data);
      } catch {
        setError("Failed to load order details.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderNumber, accessToken, user?.id]);

  if (loading) {
    return (
      <div className="border border-chrome-500 bg-surface p-6 text-center">
        <p className="font-body text-sm text-muted">Loading order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-chrome-500 bg-surface p-6 text-center">
        <p className="font-body text-sm text-red-400 mb-4">{error}</p>
        <Link
          href="/account/orders"
          className="font-body text-sm text-chrome-200 hover:text-foreground transition-colors"
        >
          ← Back to order history
        </Link>
      </div>
    );
  }

  if (!order) return null;

  const address = order.shippingAddress;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/account/orders"
        className="font-body text-sm text-muted hover:text-foreground transition-colors"
      >
        ← Back to order history
      </Link>

      {/* Order header */}
      <section className="border border-chrome-500 bg-surface p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl text-foreground">
              {order.orderNumber}
            </h2>
            <p className="font-body text-xs text-muted mt-1">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <span className="font-body text-xs px-3 py-1 border border-chrome-500 text-muted">
              {order.status}
            </span>
            <span className="font-body text-xs px-3 py-1 border border-chrome-500 text-muted">
              {order.paymentStatus}
            </span>
          </div>
        </div>
      </section>

      {/* Items */}
      <section className="border border-chrome-500 bg-surface p-6">
        <h3 className="font-display text-lg text-foreground mb-4">Items</h3>
        <div className="space-y-4">
          {order.items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between pb-4 border-b border-chrome-500 last:border-b-0 last:pb-0"
            >
              <div>
                <p className="font-body text-sm text-foreground">
                  {item.productVariant.product.name}
                </p>
                <p className="font-body text-xs text-muted mt-1">
                  {item.productVariant.size} · {item.productVariant.color}
                </p>
                {item.customMeasurement && (
                  <p className="font-body text-xs text-muted mt-1">
                    Measurement: {item.customMeasurement.label}
                  </p>
                )}
                <p className="font-body text-xs text-muted mt-1">
                  Qty: {item.quantity}
                </p>
              </div>
              <p className="font-body text-sm text-foreground">
                {formatPrice(item.priceAtPurchase * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-6 pt-4 border-t border-chrome-500 space-y-2">
          <div className="flex justify-between">
            <span className="font-body text-sm text-muted">Subtotal</span>
            <span className="font-body text-sm text-foreground">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-body text-sm text-muted">Shipping</span>
            <span className="font-body text-sm text-foreground">{formatPrice(order.shippingCost)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-chrome-500">
            <span className="font-body text-sm text-foreground font-medium">Total</span>
            <span className="font-body text-sm text-foreground font-medium">{formatPrice(order.total)}</span>
          </div>
        </div>
      </section>

      {/* Shipping address */}
      <section className="border border-chrome-500 bg-surface p-6">
        <h3 className="font-display text-lg text-foreground mb-4">Shipping Address</h3>
        <div className="font-body text-sm text-foreground space-y-1">
          <p>{address.fullName}</p>
          <p>{address.addressLine1}</p>
          {address.addressLine2 && <p>{address.addressLine2}</p>}
          <p>
            {address.city}, {address.province}
            {address.postalCode ? ` ${address.postalCode}` : ""}
          </p>
          <p>{address.country}</p>
          <p className="text-muted mt-2">Phone: {address.phone}</p>
        </div>
      </section>

      {/* Payment info */}
      <section className="border border-chrome-500 bg-surface p-6">
        <h3 className="font-display text-lg text-foreground mb-4">Payment</h3>
        <div className="font-body text-sm text-foreground space-y-1">
          <p>
            <span className="text-muted">Method: </span>
            {order.paymentMethod === "COD"
              ? "Cash on Delivery"
              : order.paymentMethod === "CARD"
              ? "Credit / Debit Card"
              : order.paymentMethod}
          </p>
          <p>
            <span className="text-muted">Status: </span>
            {order.paymentStatus}
          </p>
        </div>
      </section>
    </div>
  );
}
