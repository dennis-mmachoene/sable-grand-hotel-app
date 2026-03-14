import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: inject token ────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    try {
      const stored = JSON.parse(localStorage.getItem('hotelflow-auth') || '{}');
      const token  = stored?.state?.token;
      if (token && !config.headers['Authorization']) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {}
    return config;
  },
  (err) => Promise.reject(err)
);

// ── Response: handle 401 globally ───────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      try { localStorage.removeItem('hotelflow-auth'); } catch {}
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authService = {
  login:          (d)  => api.post('/auth/login', d),
  register:       (d)  => api.post('/auth/register', d),
  me:             ()   => api.get('/auth/me'),
  updateProfile:  (d)  => api.put('/auth/me', d),
  changePassword: (d)  => api.put('/auth/change-password', d),
};

// ── Rooms ─────────────────────────────────────────────────────────────────────
export const roomService = {
  getAll:          (p)      => api.get('/rooms', { params: p }),
  getOne:          (id)     => api.get(`/rooms/${id}`),
  checkAvailability:(p)     => api.get('/rooms/availability', { params: p }),
  create:          (d)      => api.post('/rooms', d),
  update:          (id, d)  => api.put(`/rooms/${id}`, d),
  delete:          (id)     => api.delete(`/rooms/${id}`),
  updateStatus:    (id, s)  => api.patch(`/rooms/${id}/status`, { status: s }),
};

// ── Bookings ──────────────────────────────────────────────────────────────────
export const bookingService = {
  getAll:        (p)           => api.get('/bookings', { params: p }),
  getMine:       (p)           => api.get('/bookings/my', { params: p }),
  getOne:        (id)          => api.get(`/bookings/${id}`),
  create:        (d)           => api.post('/bookings', d),
  updateStatus:  (id, status, notes) => api.patch(`/bookings/${id}/status`, { status, notes }),
  cancel:        (id, reason)  => api.patch(`/bookings/${id}/cancel`, { reason }),
  updatePayment: (id, d)       => api.patch(`/bookings/${id}/payment`, d),
};

// ── Users / Staff ─────────────────────────────────────────────────────────────
export const userService = {
  getAll:       (p)     => api.get('/users', { params: p }),
  getOne:       (id)    => api.get(`/users/${id}`),
  create:       (d)     => api.post('/users', d),
  update:       (id, d) => api.put(`/users/${id}`, d),
  delete:       (id)    => api.delete(`/users/${id}`),
  toggleStatus: (id)    => api.patch(`/users/${id}/toggle-status`),
};

// ── Services ──────────────────────────────────────────────────────────────────
export const serviceApi = {
  getAll:          (p)     => api.get('/services', { params: p }),
  create:          (d)     => api.post('/services', d),
  update:          (id, d) => api.put(`/services/${id}`, d),
  delete:          (id)    => api.delete(`/services/${id}`),
  getHotelInfo:    ()      => api.get('/services/hotel-info'),
  updateHotelInfo: (d)     => api.put('/services/hotel-info', d),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardService = {
  getAnalytics: () => api.get('/dashboard/analytics'),
  getReception: () => api.get('/dashboard/reception'),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationService = {
  getAll:      ()   => api.get('/notifications'),
  markRead:    (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: ()   => api.patch('/notifications/read-all'),
  delete:      (id) => api.delete(`/notifications/${id}`),
};

// ── Chatbot ───────────────────────────────────────────────────────────────────
export const chatbotService = {
  sendMessage: (message, sessionId, history) =>
    api.post('/chatbot/message', { message, sessionId, history }),
  getHistory: (sessionId) =>
    api.get(`/chatbot/history/${sessionId}`),
};
