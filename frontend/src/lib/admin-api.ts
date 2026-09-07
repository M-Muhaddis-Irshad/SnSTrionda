// =============================================================================
// Admin API Helper — shared fetch wrapper for admin endpoints
// =============================================================================

import { useAuthStore } from "@/stores/authStore";
import { refreshAccessToken } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

function sessionExpired(): never {
  const { clearAuth } = useAuthStore.getState();
  clearAuth();
  window.location.href = "/admin/login";
  throw new Error("Session expired. Please sign in again.");
}

export async function adminFetch<T = any>(
  path: string,
  options: RequestInit = {},
  isRetry = false
): Promise<T> {
  const { accessToken } = useAuthStore.getState();

  if (!accessToken) {
    // Try one silent refresh before giving up
    if (!isRetry && (await refreshAccessToken())) {
      return adminFetch<T>(path, options, true);
    }
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

  // Handle 401 — token expired or invalid: refresh once, then retry
  if (res.status === 401) {
    if (!isRetry && (await refreshAccessToken())) {
      return adminFetch<T>(path, options, true);
    }
    sessionExpired();
  }

  // Handle 403 — not admin
  if (res.status === 403) {
    sessionExpired();
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

export async function deleteProductImage(productId: string, imageId: string) {
  const { accessToken } = useAuthStore.getState();
  if (!accessToken) throw new Error("Not authenticated");

  const res = await fetch(`${API_URL}/api/products/${productId}/images/${imageId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Image delete failed");
  }

  return res.json();
}

// Categories
export function fetchCategories() {
  return adminFetch("/categories");
}

export function createAdminCategory(data: any) {
  return adminFetch("/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAdminCategory(categoryId: string, data: any) {
  return adminFetch(`/categories/${categoryId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteAdminCategory(categoryId: string) {
  return adminFetch(`/categories/${categoryId}`, { method: "DELETE" });
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

// Users (admin user management)
export function fetchAdminUsers(params?: { page?: number; limit?: number; role?: string; search?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.role) query.set("role", params.role);
  if (params?.search) query.set("search", params.search);
  return adminFetch(`/users?${query.toString()}`);
}

export function fetchAdminUser(userId: string) {
  return adminFetch(`/users/${userId}`);
}

export function updateAdminUserRole(userId: string, role: string) {
  return adminFetch(`/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
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

// ---------------------------------------------------------------------------
// Site media — images
// ---------------------------------------------------------------------------

export function fetchAdminImages(params?: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.category) query.set("category", params.category);
  if (params?.search) query.set("search", params.search);
  return adminFetch(`/images?${query.toString()}`);
}

export async function createAdminImage(formData: FormData) {
  const { accessToken } = useAuthStore.getState();
  if (!accessToken) throw new Error("Not authenticated");

  const res = await fetch(`${API_URL}/api/admin/images`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Image creation failed");
  }
  return res.json();
}

export function updateAdminImage(imageId: string, data: any) {
  return adminFetch(`/images/${imageId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteAdminImage(imageId: string) {
  return adminFetch(`/images/${imageId}`, { method: "DELETE" });
}

export function fetchAdminImageUsage(imageId: string) {
  return adminFetch(`/images/${imageId}/usage`);
}

// ---------------------------------------------------------------------------
// Site media — campaigns
// ---------------------------------------------------------------------------

export function fetchAdminCampaigns(params?: { page?: number; limit?: number; search?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  return adminFetch(`/campaigns?${query.toString()}`);
}

export function createAdminCampaign(data: any) {
  return adminFetch("/campaigns", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAdminCampaign(campaignId: string, data: any) {
  return adminFetch(`/campaigns/${campaignId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteAdminCampaign(campaignId: string) {
  return adminFetch(`/campaigns/${campaignId}`, { method: "DELETE" });
}

export function bulkUpdateCampaigns(ids: string[], active: boolean) {
  return adminFetch("/campaigns/bulk-status", {
    method: "PATCH",
    body: JSON.stringify({ ids, active }),
  });
}

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------

export function fetchAdminCoupons() {
  return adminFetch("/coupons");
}

export function createAdminCoupon(data: any) {
  return adminFetch("/coupons", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAdminCoupon(couponId: string, data: any) {
  return adminFetch(`/coupons/${couponId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteAdminCoupon(couponId: string) {
  return adminFetch(`/coupons/${couponId}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Discounts
// ---------------------------------------------------------------------------

export function fetchAdminDiscounts() {
  return adminFetch("/discounts");
}

export function createAdminDiscount(data: any) {
  return adminFetch("/discounts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAdminDiscount(discountId: string, data: any) {
  return adminFetch(`/discounts/${discountId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteAdminDiscount(discountId: string) {
  return adminFetch(`/discounts/${discountId}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

export function fetchAdminCollections() {
  return adminFetch("/collections");
}

export function createAdminCollection(data: any) {
  return adminFetch("/collections", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAdminCollection(collectionId: string, data: any) {
  return adminFetch(`/collections/${collectionId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteAdminCollection(collectionId: string) {
  return adminFetch(`/collections/${collectionId}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Store Settings
// ---------------------------------------------------------------------------

export function fetchAdminSettings() {
  return adminFetch("/settings");
}

export function updateAdminSettings(data: any) {
  return adminFetch("/settings", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ---------------------------------------------------------------------------
// Landing page — hero slides/banners
// ---------------------------------------------------------------------------

export function fetchAdminSlides() {
  return adminFetch("/landing");
}

export async function createAdminSlide(formData: FormData) {
  const { accessToken } = useAuthStore.getState();
  if (!accessToken) throw new Error("Not authenticated");

  const res = await fetch(`${API_URL}/api/admin/landing`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Slide creation failed");
  }
  return res.json();
}

export async function updateAdminSlide(slideId: string, formData: FormData) {
  const { accessToken } = useAuthStore.getState();
  if (!accessToken) throw new Error("Not authenticated");

  const res = await fetch(`${API_URL}/api/admin/landing/${slideId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Slide update failed");
  }
  return res.json();
}

export function deleteAdminSlide(slideId: string) {
  return adminFetch(`/landing/${slideId}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Brand Story — “Our Story” section on the homepage
// ---------------------------------------------------------------------------

export function fetchAdminBrandStory() {
  return adminFetch("/brand-story");
}

export async function createAdminBrandStory(formData: FormData) {
  const { accessToken } = useAuthStore.getState();
  if (!accessToken) throw new Error("Not authenticated");

  const res = await fetch(`${API_URL}/api/admin/brand-story`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Brand story creation failed");
  }
  return res.json();
}

export async function updateAdminBrandStory(storyId: string, formData: FormData) {
  const { accessToken } = useAuthStore.getState();
  if (!accessToken) throw new Error("Not authenticated");

  const res = await fetch(`${API_URL}/api/admin/brand-story/${storyId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Brand story update failed");
  }
  return res.json();
}

export function deleteAdminBrandStory(storyId: string) {
  return adminFetch(`/brand-story/${storyId}`, { method: "DELETE" });
}
