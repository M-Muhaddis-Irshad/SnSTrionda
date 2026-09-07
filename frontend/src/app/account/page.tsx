"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Camera, Loader2, User as UserIcon } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useAuthHydrated } from "@/lib/useAuthHydrated";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  items: { quantity: number }[];
}

function formatPrice(price: number): string {
  return `Rs. ${price.toLocaleString("en-PK")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getInitials(name?: string | null): string {
  if (!name) return "U";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export default function AccountOverviewPage() {
  const { user, accessToken, updateUser } = useAuthStore();
  const authHydrated = useAuthHydrated();

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Editable profile fields
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Avatar upload
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Keep local form in sync with store (e.g. after Google login refresh)
  useEffect(() => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
  }, [user?.name, user?.phone]);

  useEffect(() => {
    if (!accessToken) return;

    async function fetchOrders() {
      try {
        const res = await fetch(`${API_URL}/api/orders/mine`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data.data || []);
        }
      } catch {
        // Silently fail — will show empty state
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [accessToken]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;

    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      updateUser(data.user);
      setSaveMsg({ ok: true, text: "Profile updated" });
    } catch (err: any) {
      setSaveMsg({ ok: false, text: err.message || "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;

    setUploading(true);
    setSaveMsg(null);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${API_URL}/api/auth/me/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Avatar upload failed");
      updateUser(data.user);
      setSaveMsg({ ok: true, text: "Photo updated" });
    } catch (err: any) {
      setSaveMsg({ ok: false, text: err.message || "Avatar upload failed" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const totalSpent = orders
    .filter((o) => o.paymentStatus === "PAID" || o.status === "DELIVERED")
    .reduce((sum, o) => sum + o.total, 0);

  const joinedAt = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-PK", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-8">
      {/* Profile card */}
      <section className="border border-chrome-500 bg-surface p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-6 sm:items-start">
          {/* Avatar */}
          <div className="flex flex-col items-center sm:items-start gap-3 shrink-0">
            <div className="relative">
              <div className="h-24 w-24 rounded-full border border-chrome-400 overflow-hidden flex items-center justify-center bg-background">
                {uploading ? (
                  <Loader2 size={28} className="text-muted animate-spin" />
                ) : user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={user.name || "Profile photo"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-display text-2xl text-muted">
                    {getInitials(user?.name)}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                aria-label="Upload profile photo"
                title="Change photo"
                className="absolute -top-1 -right-1 h-8 w-8 rounded-full border border-chrome-500 bg-surface text-foreground flex items-center justify-center hover:bg-chrome-950 hover:text-white transition-colors disabled:opacity-50"
              >
                <Camera size={14} />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <p className="font-body text-[11px] text-muted text-center sm:text-left">
              {user?.image ? "Tap the camera to change" : "Upload a profile photo"}
            </p>
          </div>

          {/* Editable details */}
          <form onSubmit={handleSaveProfile} className="flex-1 min-w-0 space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h2 className="font-display text-xl text-foreground">
                  {user?.name || "My Account"}
                </h2>
                <p className="font-body text-sm text-muted mt-0.5 break-all">
                  {user?.email}
                </p>
                {joinedAt && (
                  <p className="font-body text-xs text-muted mt-1">
                    Member since {joinedAt}
                  </p>
                )}
              </div>
              <span className="font-body text-[10px] uppercase tracking-wider px-2 py-1 border border-chrome-500 text-muted">
                {user?.role || "CUSTOMER"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-body text-xs text-muted tracking-wider uppercase block mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-chrome-500 bg-background px-3 py-2 font-body text-sm text-foreground focus:outline-none focus:border-chrome-300 transition-colors"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="font-body text-xs text-muted tracking-wider uppercase block mb-1.5">
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-chrome-500 bg-background px-3 py-2 font-body text-sm text-foreground focus:outline-none focus:border-chrome-300 transition-colors"
                  placeholder="03XX-XXXXXXX"
                />
              </div>
            </div>

            {saveMsg && (
              <p
                className={`font-body text-sm ${
                  saveMsg.ok ? "text-green-600" : "text-red-500"
                }`}
              >
                {saveMsg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="font-body text-sm px-6 py-2.5 border border-chrome-950 bg-chrome-950 text-white hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </section>

      {/* Quick stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-chrome-500 bg-surface p-6">
          <p className="font-body text-xs text-muted tracking-wider uppercase mb-1">
            Total Orders
          </p>
          <p className="font-display text-2xl text-foreground">{orders.length}</p>
        </div>
        <div className="border border-chrome-500 bg-surface p-6">
          <p className="font-body text-xs text-muted tracking-wider uppercase mb-1">
            Total Spent
          </p>
          <p className="font-display text-2xl text-foreground">{formatPrice(totalSpent)}</p>
        </div>
      </section>

      {/* Recent orders */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg text-foreground">Recent Orders</h2>
          {orders.length > 0 && (
            <Link
              href="/account/orders"
              className="font-body text-sm text-chrome-200 hover:text-foreground transition-colors"
            >
              View all →
            </Link>
          )}
        </div>

        {!authHydrated || loading ? (
          <div className="border border-chrome-500 bg-surface p-6 text-center">
            <p className="font-body text-sm text-muted">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="border border-chrome-500 bg-surface p-6 text-center">
            <p className="font-body text-sm text-muted mb-4">
              You haven&apos;t placed any orders yet.
            </p>
            <Link
              href="/shop"
              className="inline-block font-body text-sm text-chrome-200 hover:text-foreground transition-colors"
            >
              Start shopping →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.orderNumber}`}
                className="block border border-chrome-500 bg-surface p-4 hover:border-chrome-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-body text-sm text-foreground">
                      {order.orderNumber}
                    </p>
                    <p className="font-body text-xs text-muted mt-1">
                      {formatDate(order.createdAt)} · {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-body text-sm text-foreground">
                      {formatPrice(order.total)}
                    </p>
                    <span className="inline-block font-body text-xs mt-1 px-2 py-0.5 border border-chrome-500 text-muted">
                      {order.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}