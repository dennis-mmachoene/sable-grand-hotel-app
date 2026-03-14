import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Hotel, LayoutDashboard, BedDouble, CalendarCheck, Users, Wrench,
  LogOut, Menu, X, ChevronRight, ArrowLeftRight, Home, User,
  ClipboardList, Settings,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import { getInitials } from '../../utils/helpers';
import ThemeToggle from '../ui/ThemeToggle';
import { NotificationBell, NotificationPanel } from '../ui/NotificationPanel';

const NAV_CONFIG = {
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard',    to: '/admin/dashboard' },
    { icon: BedDouble,       label: 'Rooms',         to: '/admin/rooms'     },
    { icon: CalendarCheck,   label: 'Bookings',      to: '/admin/bookings'  },
    { icon: Users,           label: 'Staff',         to: '/admin/staff'     },
    { icon: Wrench,          label: 'Services',      to: '/admin/services'  },
  ],
  reception: [
    { icon: LayoutDashboard, label: 'Front Desk',    to: '/reception/dashboard'  },
    { icon: CalendarCheck,   label: 'Bookings',      to: '/reception/bookings'   },
    { icon: ArrowLeftRight,  label: 'Check In/Out',  to: '/reception/checkinout' },
  ],
  guest: [
    { icon: LayoutDashboard, label: 'Overview',      to: '/guest/dashboard' },
    { icon: CalendarCheck,   label: 'My Bookings',   to: '/guest/bookings'  },
    { icon: BedDouble,       label: 'Book a Room',   to: '/guest/book'      },
    { icon: User,            label: 'My Profile',    to: '/guest/profile'   },
  ],
};

const ROLE_LABEL = { admin: 'Administrator', manager: 'Manager', receptionist: 'Receptionist', guest: 'Guest' };

export default function DashboardLayout({ role }) {
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const { user, logout }  = useAuthStore();
  const { theme }         = useThemeStore();
  const navigate          = useNavigate();
  const location          = useLocation();
  const navItems          = NAV_CONFIG[role] || [];

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const activeItem = navItems.find(n =>
    location.pathname === n.to || (n.to !== '/' && location.pathname.startsWith(n.to))
  );

  const SidebarContent = ({ mobile = false }) => (
    <aside
      className={`
        ${mobile ? 'w-72' : sidebarOpen ? 'w-60' : 'w-[60px]'}
        transition-all duration-300 ease-in-out
        flex flex-col h-full flex-shrink-0 border-r border-subtle-t
      `}
      style={{ background: 'var(--bg-elevated)' }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-subtle-t flex-shrink-0">
        {(sidebarOpen || mobile) ? (
          <Link to="/" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-700 to-primary-900 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Hotel className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-base font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                Sable Grand
              </p>
              <p className="text-2xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)' }}>
                Management
              </p>
            </div>
          </Link>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-700 to-primary-900 flex items-center justify-center mx-auto">
            <Hotel className="w-4 h-4 text-white" />
          </div>
        )}
        {!mobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn-ghost btn-icon w-7 h-7 p-0 ml-auto flex-shrink-0"
          >
            <ChevronRight
              className="w-3.5 h-3.5 transition-transform duration-300"
              style={{
                color: 'var(--text-muted)',
                transform: sidebarOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map(item => {
          const isActive = location.pathname === item.to ||
            (item.to !== '/' && location.pathname.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => mobile && setMobileSidebar(false)}
              title={!sidebarOpen && !mobile ? item.label : undefined}
              className={`nav-item ${isActive ? 'active' : ''} ${
                !sidebarOpen && !mobile ? 'justify-center' : ''
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {(sidebarOpen || mobile) && <span>{item.label}</span>}
            </Link>
          );
        })}

        <div className="pt-2 mt-2 border-t border-subtle-t">
          <Link
            to="/"
            className={`nav-item ${!sidebarOpen && !mobile ? 'justify-center' : ''}`}
          >
            <Home className="w-4 h-4 flex-shrink-0" />
            {(sidebarOpen || mobile) && <span>Back to Website</span>}
          </Link>
        </div>
      </nav>

      {/* User block */}
      <div className="p-3 border-t border-subtle-t flex-shrink-0">
        <div className={`flex items-center gap-2.5 ${!sidebarOpen && !mobile ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-surface-900 font-bold text-xs flex items-center justify-center flex-shrink-0">
            {getInitials(user?.firstName, user?.lastName)}
          </div>
          {(sidebarOpen || mobile) && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-2xs capitalize" style={{ color: 'var(--text-muted)' }}>
                  {ROLE_LABEL[user?.role] || user?.role}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="btn-ghost btn-icon w-7 h-7 p-0 flex-shrink-0"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      {mobileSidebar && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileSidebar(false)}
          />
          <div className="relative z-10 h-full animate-slide-up">
            <SidebarContent mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header
          className="h-16 flex items-center px-4 gap-3 flex-shrink-0 border-b border-subtle-t"
          style={{ background: 'var(--bg-elevated)' }}
        >
          <button
            className="lg:hidden btn-ghost btn-icon"
            onClick={() => setMobileSidebar(true)}
          >
            <Menu className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          </button>

          {/* Breadcrumb */}
          <div className="flex-1 min-w-0">
            <h2
              className="text-sm font-semibold truncate hidden sm:block"
              style={{ color: 'var(--text-muted)' }}
            >
              {activeItem?.label || 'Dashboard'}
            </h2>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1.5">
            <ThemeToggle />

            {/* Notification bell + panel */}
            <div className="relative">
              <NotificationBell />
              <NotificationPanel />
            </div>

            {/* User pill (desktop) */}
            <div
              className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-subtle-t ml-1"
              style={{ background: 'var(--bg-subtle)' }}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-surface-900 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                {getInitials(user?.firstName, user?.lastName)}
              </div>
              <div>
                <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {user?.firstName}
                </p>
                <p className="text-2xs capitalize leading-tight" style={{ color: 'var(--text-muted)' }}>
                  {ROLE_LABEL[user?.role] || user?.role}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="btn-ghost btn-icon text-rose-400"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
