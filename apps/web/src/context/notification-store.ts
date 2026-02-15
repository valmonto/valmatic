import { create } from "zustand";

// ─── Why Zustand for notifications? ─────────────────────────────────────────
//
// 1. No Provider needed — The store lives outside the React tree, so any
//    component can import and use it without being wrapped in a Provider.
//
// 2. Callable outside React — An axios interceptor, a websocket handler, or
//    any plain JS module can call `useNotificationStore.getState().addNotification()`
//    without access to a React context.
//
// 3. Selective subscriptions — Zustand lets consumers pick exactly the slice
//    they need via a selector (e.g. `useNotificationStore(s => s.notifications)`).
//    Only the components that read that slice re-render when it changes.
//
// 4. No re-render cascade — Unlike Context, updating one field doesn't force
//    every subscriber to re-render. This matters for notifications because they
//    update frequently (toasts appearing / dismissing).
//
// ─── Tradeoff ───────────────────────────────────────────────────────────────
//
// Zustand is an extra dependency and a different mental model from built-in
// React primitives. For state that changes rarely and scopes to a subtree
// (like auth), plain Context is simpler. Reach for Zustand when you need
// global, high-frequency, or out-of-React access.
// ─────────────────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  createdAt: Date;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (type: Notification["type"], message: string) => void;
  dismissNotification: (id: string) => void;
  clearAll: () => void;
}

const AUTO_DISMISS_MS = 5_000;

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  addNotification: (type, message) => {
    const id = crypto.randomUUID();

    set((state) => ({
      notifications: [
        ...state.notifications,
        { id, type, message, createdAt: new Date() },
      ],
    }));

    // Auto-dismiss after a timeout. Because `set` is available outside React,
    // this plain setTimeout works without useEffect or cleanup gymnastics.
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, AUTO_DISMISS_MS);
  },

  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearAll: () => set({ notifications: [] }),
}));

// ─── Usage examples ─────────────────────────────────────────────────────────
//
// Inside a React component (with a selector to avoid unnecessary re-renders):
//
//   const notifications = useNotificationStore((s) => s.notifications);
//   const addNotification = useNotificationStore((s) => s.addNotification);
//
// Outside React (e.g. an axios interceptor):
//
//   import { useNotificationStore } from "@/context/notification-store";
//   useNotificationStore.getState().addNotification("error", "Request failed");
// ─────────────────────────────────────────────────────────────────────────────
