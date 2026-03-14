import { create } from 'zustand';
import socketService from '../services/socket';
import api from '../services/api';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  connected: false,
  panelOpen: false,

  // ── Socket setup ────────────────────────────────────────────────────────
  initSocket: (token) => {
    socketService.connect(token);

    socketService.on('connect', () => {
      set({ connected: true });
    });

    socketService.on('disconnect', () => {
      set({ connected: false });
    });

    // Real-time notification events
    socketService.on('notification:new', (notification) => {
      set(state => ({
        notifications: [notification, ...state.notifications].slice(0, 50),
        unreadCount: state.unreadCount + 1,
      }));

      // Browser notification (if permission granted)
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.svg',
          silent: false,
        });
      }
    });

    // Bulk notification load on connect
    socketService.on('notifications:init', ({ notifications, unreadCount }) => {
      set({ notifications, unreadCount });
    });
  },

  disconnectSocket: () => {
    socketService.disconnect();
    set({ connected: false });
  },

  // ── Fetch from API ──────────────────────────────────────────────────────
  fetchNotifications: async () => {
    try {
      const { data } = await api.get('/notifications');
      set({
        notifications: data.notifications || [],
        unreadCount: data.unreadCount || 0,
      });
    } catch { /* silent */ }
  },

  // ── Mark read ───────────────────────────────────────────────────────────
  markRead: async (id) => {
    set(state => ({
      notifications: state.notifications.map(n =>
        n._id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - (
        state.notifications.find(n => n._id === id && !n.read) ? 1 : 0
      )),
    }));
    try { await api.patch(`/notifications/${id}/read`); } catch { /* silent */ }
  },

  markAllRead: async () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
    }));
    try { await api.patch('/notifications/read-all'); } catch { /* silent */ }
  },

  // ── UI ──────────────────────────────────────────────────────────────────
  togglePanel: () => set(state => ({ panelOpen: !state.panelOpen })),
  closePanel: () => set({ panelOpen: false }),

  // ── Local push (for instant optimistic UI) ──────────────────────────────
  addLocal: (notification) => {
    set(state => ({
      notifications: [{
        _id: Date.now().toString(),
        read: false,
        createdAt: new Date().toISOString(),
        ...notification,
      }, ...state.notifications].slice(0, 50),
      unreadCount: state.unreadCount + 1,
    }));
  },
}));

export default useNotificationStore;
