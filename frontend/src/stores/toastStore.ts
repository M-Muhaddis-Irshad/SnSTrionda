// =============================================================================
// Toast Store — transient notifications rendered by <ToastHost />
// =============================================================================

import { create } from "zustand";

export interface Toast {
  id: string;
  title: string;
  message?: string;
  link?: { href: string; label: string };
  createdAt: number;
}

interface ToastState {
  toasts: Toast[];
}

interface ToastActions {
  push: (toast: Omit<Toast, "id" | "createdAt">) => void;
  dismiss: (id: string) => void;
}

let counter = 0;

export const useToastStore = create<ToastState & ToastActions>()((set) => ({
  toasts: [],

  push: (toast) => {
    const id = `toast-${Date.now()}-${counter++}`;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id, createdAt: Date.now() }].slice(-4) }));
    // Auto-dismiss after 7s
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 7000);
  },

  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
