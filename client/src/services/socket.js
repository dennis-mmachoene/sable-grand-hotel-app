import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    // Re-register any existing listeners
    this.listeners.forEach((handlers, event) => {
      handlers.forEach(handler => this.socket.on(event, handler));
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(handler);
    this.socket?.on(event, handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    this.listeners.get(event)?.delete(handler);
    this.socket?.off(event, handler);
  }

  emit(event, data) {
    this.socket?.emit(event, data);
  }

  get connected() {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
export default socketService;
