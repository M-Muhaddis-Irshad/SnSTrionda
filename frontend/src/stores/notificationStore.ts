// =============================================================================
// Notification Store — live inbox state (badge count + recent items)
// =============================================================================

import { create } from "zustand";
import type { AppNotification } from "@/types/realtime";

interface NotificationState {
  notifications: AppNotification[]; // newest first (capped at 50)
  unreadCount: number;
  lastFetchedAt: string | null;
}

interface NotificationActions {
  hydrate: (list: AppNotification[], unreadCount: number) => void;
  prepend: (n: AppNotification) => void;
  markOneRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState & NotificationActions>()(
  (set) => ({
    notifications: [],
    unreadCount: 0,
    lastFetchedAt: null,

    hydrate: (list, unreadCount) =>
      set({ notifications: list, unreadCount, lastFetchedAt: new Date().toISOString() }),

    prepend: (n) =>
      set((state) => {
        // De-dupe by id (socket push may race the initial fetch)
        if (state.notifications.some((existing) => existing.id === n.id)) {
          return state;
        }
        const inc = n.read ? 0 : 1;
        return {
          notifications: [n, ...state.notifications].slice(0, 50),
          unreadCount: state.unreadCount + inc,
        };
      }),

    markOneRead: (id) =>
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id && !n.read ? { ...n, read: true, readAt: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - (state.notifications.some((n) => n.id === id && !n.read) ? 1 : 0)),
      })),

    markAllRead: () =>
      set((state) => ({
        notifications: state.notifications.map((n) => (n.read ? n : { ...n, read: true, readAt: new Date().toISOString() })),
        unreadCount: 0,
      })),

    remove: (id) =>
      set((state) => {
        const target = state.notifications.find((n) => n.id === id);
        return {
          notifications: state.notifications.filter((n) => n.id !== id),
          unreadCount: Math.max(0, state.unreadCount - (target && !target.read ? 1 : 0)),
        };
      }),

    reset: () => set({ notifications: [], unreadCount: 0, lastFetchedAt: null }),
  })
);
