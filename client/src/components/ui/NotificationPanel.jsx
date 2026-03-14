import React, { useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, AlertCircle, CreditCard, CalendarCheck, LogIn, LogOut, Settings, Wrench } from 'lucide-react';
import useNotificationStore from '../../store/notificationStore';
import { timeAgo } from '../../utils/helpers';

const TYPE_ICONS = {
  booking:      { icon: CalendarCheck, bg: 'bg-blue-500/10 dark:bg-blue-500/20',   color: 'text-primary-500 dark:text-primary-400' },
  check_in:     { icon: LogIn,         bg: 'bg-emerald-500/10',                    color: 'text-emerald-600 dark:text-emerald-400' },
  check_out:    { icon: LogOut,        bg: 'bg-amber-500/10',                      color: 'text-amber-600 dark:text-amber-400' },
  payment:      { icon: CreditCard,    bg: 'bg-gold-500/10',                       color: 'text-gold-600 dark:text-gold-400' },
  cancellation: { icon: X,             bg: 'bg-rose-500/10',                       color: 'text-rose-600 dark:text-rose-400' },
  service:      { icon: Wrench,        bg: 'bg-purple-500/10',                     color: 'text-purple-600 dark:text-purple-400' },
  alert:        { icon: AlertCircle,   bg: 'bg-rose-500/10',                       color: 'text-rose-600' },
  system:       { icon: Settings,      bg: 'bg-surface-500/10',                    color: 'text-surface-500' },
};

function NotificationItem({ notif, onRead }) {
  const typeConf = TYPE_ICONS[notif.type] || TYPE_ICONS.system;
  const Icon = typeConf.icon;

  return (
    <div
      className={`flex gap-3 p-4 cursor-pointer transition-colors hover:bg-subtle border-b border-subtle-t last:border-0 ${
        !notif.read ? 'bg-gold-50/50 dark:bg-gold-900/10' : ''
      }`}
      onClick={() => !notif.read && onRead(notif._id)}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${typeConf.bg}`}>
        <Icon className={`w-4 h-4 ${typeConf.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm leading-snug ${!notif.read ? 'font-semibold text-base' : 'text-sub'}`}>
            {notif.title}
          </p>
          {!notif.read && (
            <span className="w-2 h-2 bg-gold-500 rounded-full flex-shrink-0 mt-1" />
          )}
        </div>
        <p className="text-xs text-muted mt-0.5 line-clamp-2">{notif.message}</p>
        <p className="text-2xs text-muted mt-1">{timeAgo(notif.createdAt)}</p>
      </div>
    </div>
  );
}

export function NotificationBell() {
  const { unreadCount, panelOpen, togglePanel } = useNotificationStore();

  return (
    <button
      onClick={togglePanel}
      className={`relative btn-ghost btn-icon transition-all ${
        panelOpen ? 'bg-subtle' : ''
      }`}
      aria-label="Notifications"
    >
      <Bell className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-scale-in border-2 border-elevated">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}

export function NotificationPanel() {
  const { notifications, panelOpen, closePanel, markRead, markAllRead } = useNotificationStore();
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) closePanel();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [panelOpen, closePanel]);

  if (!panelOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 card shadow-card-lg z-50 overflow-hidden animate-slide-down"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-subtle-t">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gold" />
          <h3 className="section-title text-sm">Notifications</h3>
        </div>
        <div className="flex items-center gap-1">
          {notifications.some(n => !n.read) && (
            <button
              onClick={markAllRead}
              className="btn-ghost btn-sm gap-1 text-xs"
              title="Mark all read"
            >
              <CheckCheck className="w-3 h-3" />
              All read
            </button>
          )}
          <button onClick={closePanel} className="btn-ghost btn-icon p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto scrollbar-thin">
        {notifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="w-8 h-8 text-muted mx-auto mb-2 opacity-40" />
            <p className="text-sm text-muted">No notifications yet</p>
          </div>
        ) : (
          notifications.map(n => (
            <NotificationItem key={n._id} notif={n} onRead={markRead} />
          ))
        )}
      </div>
    </div>
  );
}

export default NotificationBell;
