// =============================================================================
// Admin API Helper — shared fetch wrapper for admin endpoints
// =============================================================================

import { useAuthStore } from "@/stores/authStore";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export async function adminFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { accessToken } = useAuthStore.getState();

  if (!accessToken) {
    throw new Error("Not authenticated");
  }

  const res = await fetch(`${API_URL}/api/admin${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  // Handle 401 — token expired or invalid
  if (res.status === 401) {
    const { clearAuth } = useAuthStore.getState();
    clearAuth();
    window.location.href = "/admin/login";
    throw new Error("Session expired. Please sign in again.");
  }

  // Handle 403 — not admin
  if (res.status === 403) {
    const { clearAuth } = useAuthStore.getState();
    clearAuth();
    window.location.href = "/admin/login";
    throw new Error("Admin access required.");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Convenience wrappers
// ---------------------------------------------------------------------------

// Dashboard
export function fetchDashboardStats() {
  return adminFetch("/dashboard/stats");
}

// Products
export function fetchAdminProducts(params?: { page?: number; limit?: number; search?: string; includeInactive?: boolean }) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.includeInactive) query.set("includeInactive", "true");
  return adminFetch(`/products?${query.toString()}`);
}

export function fetchAdminProduct(productId: string) {
  return adminFetch(`/products/${productId}`);
}

export function createAdminProduct(data: any) {
  return adminFetch("/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAdminProduct(productId: string, data: any) {
  return adminFetch(`/products/${productId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteAdminProduct(productId: string) {
  return adminFetch(`/products/${productId}`, { method: "DELETE" });
}

// Product images
export async function uploadProductImage(productId: string, file: File, altText?: string) {
  const { accessToken } = useAuthStore.getState();
  if (!accessToken) throw new Error("Not authenticated");

  const formData = new FormData();
  formData.append("image", file);
  if (altText) formData.append("altText", altText);

  const res = await fetch(`${API_URL}/api/products/${productId}/images`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Upload failed");
  }

  return res.json();
}

export function deleteProductImage(productId: string, imageId: string) {
  return adminFetch(`/../../products/${productId}/images/${imageId}`, {
    method: "DELETE",
  });
}

// Categories
export function fetchCategories() {
  return adminFetch("/categories");
}

// Variants
export function createAdminVariant(productId: string, data: any) {
  return adminFetch(`/products/${productId}/variants`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAdminVariant(variantId: string, data: any) {
  return adminFetch(`/variants/${variantId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteAdminVariant(variantId: string) {
  return adminFetch(`/variants/${variantId}`, { method: "DELETE" });
}

// Orders
export function fetchAdminOrders(params?: { page?: number; limit?: number; status?: string; search?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status) query.set("status", params.status);
  if (params?.search) query.set("search", params.search);
  return adminFetch(`/orders?${query.toString()}`);
}

export function fetchAdminOrder(orderId: string) {
  return adminFetch(`/orders/${orderId}`);
}

export function updateAdminOrderStatus(orderId: string, data: { status?: string; paymentStatus?: string }) {
  return adminFetch(`/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
