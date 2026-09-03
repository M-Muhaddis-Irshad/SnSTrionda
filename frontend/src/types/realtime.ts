// =============================================================================
// Realtime — shared frontend types (notifications, chat, admin activity)
// =============================================================================

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export interface AppNotification {
  id: string;
  userId: string;
  type: string; // ORDER_STATUS | REVIEW_STATUS | CHAT_MESSAGE | ADMIN_UPDATE
  title: string;
  message: string;
  data: {
    orderId?: string;
    orderNumber?: string;
    status?: string;
    reviewId?: string;
    productId?: string;
    chatSessionId?: string;
    subject?: string;
  } | null;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export interface ChatMessage {
  id: string;
  chatSessionId: string;
  senderId: string;
  sender?: { id: string; name?: string | null };
  message: string;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface ChatSessionSummary {
  id: string;
  subject: string;
  status: string; // OPEN | RESOLVED | CLOSED
  customer?: { id: string; name?: string | null; email?: string | null; phone?: string | null };
  admin?: { id: string; name?: string | null } | null;
  order?: { id: string; orderNumber: string; status?: string; total?: number } | null;
  messages: ChatMessage[];
  _count?: { messages: number };
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Admin activity
// ---------------------------------------------------------------------------

export interface AdminActivityEntry {
  activityId: string;
  adminId: string;
  adminName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown> | null;
  timestamp: string;
}

export const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  CREATE_PRODUCT: "Created product",
  UPDATE_PRODUCT: "Updated product",
  DELETE_PRODUCT: "Deactivated product",
  CREATE_VARIANT: "Added variant",
  UPDATE_VARIANT: "Updated variant",
  DELETE_VARIANT: "Deleted variant",
  UPDATE_ORDER_STATUS: "Changed order status",
  APPROVE_REVIEW: "Approved review",
  REJECT_REVIEW: "Rejected review",
  UNAPPROVE_REVIEW: "Unapproved review",
  DELETE_REVIEW: "Deleted review",
  CREATE_DELIVERY_ZONE: "Added delivery zone",
  UPDATE_DELIVERY_ZONE: "Updated delivery zone",
  DELETE_DELIVERY_ZONE: "Deleted delivery zone",
};

// ---------------------------------------------------------------------------
// Admin live stats (admin:stats-updated payload)
// ---------------------------------------------------------------------------

export interface AdminLiveStats {
  totalOrders: number;
  totalRevenue: number;
  ordersToday: number;
  revenueToday: number;
  pendingReviews: number;
  activeChats: number;
  connectedAdmins: number;
  timestamp: string;
}
