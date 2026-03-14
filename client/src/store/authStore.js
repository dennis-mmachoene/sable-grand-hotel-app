import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

// Lazy-load notificationStore to avoid ESM circular reference at module init time
let _notifStore = null;
const getNotifStore = async () => {
  if (!_notifStore) {
    const mod = await import('./notificationStore');
    _notifStore = mod.default;
  }
  return _notifStore;
};

const useAuthStore = create(
  persist(
    (set, get) => ({
      user:    null,
      token:   null,
      loading: false,
      error:   null,

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          const { user, token } = data;
          set({ user, token, loading: false });
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          const notifStore = await getNotifStore();
          notifStore.getState().initSocket(token);
          await notifStore.getState().fetchNotifications();

          return { success: true };
        } catch (err) {
          const msg = err.response?.data?.message || 'Invalid email or password';
          set({ error: msg, loading: false });
          return { success: false, error: msg };
        }
      },

      register: async (formData) => {
        set({ loading: true, error: null });
        try {
          const { data } = await api.post('/auth/register', formData);
          set({ user: data.user, token: data.token, loading: false });
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
          return { success: true };
        } catch (err) {
          const msg = err.response?.data?.message || 'Registration failed';
          set({ error: msg, loading: false });
          return { success: false, error: msg };
        }
      },

      logout: async () => {
        try {
          const notifStore = await getNotifStore();
          notifStore.getState().disconnectSocket();
        } catch { /* socket may not be connected */ }
        set({ user: null, token: null, error: null });
        delete api.defaults.headers.common['Authorization'];
      },

      updateUser: (userData) => set({ user: { ...get().user, ...userData } }),

      fetchMe: async () => {
        const { token } = get();
        if (!token) return;
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const { data } = await api.get('/auth/me');
          set({ user: data.user });

          const notifStore = await getNotifStore();
          if (!notifStore.getState().connected) {
            notifStore.getState().initSocket(token);
          }
          await notifStore.getState().fetchNotifications();
        } catch {
          set({ user: null, token: null });
        }
      },

      clearError: () => set({ error: null }),

      isAdmin:        () => ['admin'].includes(get().user?.role),
      isAdminOrMgr:   () => ['admin','manager'].includes(get().user?.role),
      isStaff:        () => !['guest'].includes(get().user?.role),
      isReceptionist: () => ['admin','manager','receptionist'].includes(get().user?.role),
      isGuest:        () => get().user?.role === 'guest',
    }),
    {
      name: 'hotelflow-auth',
      partialize: (s) => ({ user: s.user, token: s.token }),
    }
  )
);

export default useAuthStore;
