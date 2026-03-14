import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';

// Layouts
import PublicLayout    from './components/layout/PublicLayout';
import DashboardLayout from './components/layout/DashboardLayout';

// Public pages
import Landing    from './pages/public/Landing';
import RoomsPage  from './pages/public/RoomsPage';
import RoomDetail from './pages/public/RoomDetail';
import Login      from './pages/public/Login';
import Register   from './pages/public/Register';
import Contact    from './pages/public/Contact';

// Guest pages
import {
  GuestDashboard, MyBookings, BookRoom, GuestProfile,
} from './pages/guest/index';

// Admin pages
import AdminDashboard    from './pages/admin/AdminDashboard';
import AdminBookings     from './pages/admin/AdminBookings';
import RoomManagement    from './pages/admin/RoomManagement';
import StaffManagement   from './pages/admin/StaffManagement';
import ServiceManagement from './pages/admin/ServiceManagement';

// Reception pages
import {
  ReceptionDashboard, ReceptionBookings, CheckInOut,
} from './pages/reception/index';

// Chatbot
import ChatBot from './components/chatbot/ChatBot';

// ── Route Guards ─────────────────────────────────────────────────────────────
const PrivateRoute = ({ children, roles }) => {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const { user, token } = useAuthStore();
  if (token && user) {
    if (['admin','manager'].includes(user.role)) return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'receptionist')            return <Navigate to="/reception/dashboard" replace />;
    return <Navigate to="/guest/dashboard" replace />;
  }
  return children;
};

// ── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const { fetchMe }    = useAuthStore();
  const { initTheme }  = useThemeStore();

  useEffect(() => {
    initTheme();
    fetchMe();
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'font-sans text-sm',
          duration: 4000,
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-elevated)',
            borderRadius: '12px',
            padding: '12px 16px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#e11d48', secondary: '#fff' } },
        }}
      />

      <Routes>
        {/* ── Public ────────────────────────────────────────────────────── */}
        <Route element={<PublicLayout />}>
          <Route path="/"         element={<Landing />} />
          <Route path="/rooms"    element={<RoomsPage />} />
          <Route path="/rooms/:id" element={<RoomDetail />} />
          <Route path="/contact"  element={<Contact />} />
        </Route>

        <Route path="/login"    element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

        {/* ── Guest Portal ──────────────────────────────────────────────── */}
        <Route element={
          <PrivateRoute roles={['guest']}>
            <DashboardLayout role="guest" />
          </PrivateRoute>
        }>
          <Route path="/guest/dashboard" element={<GuestDashboard />} />
          <Route path="/guest/bookings"  element={<MyBookings />} />
          <Route path="/guest/book"      element={<BookRoom />} />
          <Route path="/guest/profile"   element={<GuestProfile />} />
        </Route>

        {/* ── Admin ─────────────────────────────────────────────────────── */}
        <Route element={
          <PrivateRoute roles={['admin','manager']}>
            <DashboardLayout role="admin" />
          </PrivateRoute>
        }>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/rooms"     element={<RoomManagement />} />
          <Route path="/admin/staff"     element={<StaffManagement />} />
          <Route path="/admin/bookings"  element={<AdminBookings />} />
          <Route path="/admin/services"  element={<ServiceManagement />} />
        </Route>

        {/* ── Reception ─────────────────────────────────────────────────── */}
        <Route element={
          <PrivateRoute roles={['admin','manager','receptionist']}>
            <DashboardLayout role="reception" />
          </PrivateRoute>
        }>
          <Route path="/reception/dashboard"  element={<ReceptionDashboard />} />
          <Route path="/reception/bookings"   element={<ReceptionBookings />} />
          <Route path="/reception/checkinout" element={<CheckInOut />} />
        </Route>

        {/* ── Fallbacks ─────────────────────────────────────────────────── */}
        <Route path="/unauthorized" element={
          <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
            <div className="text-center">
              <h1 className="font-display text-6xl font-semibold text-base mb-3">403</h1>
              <p className="text-muted mb-5">You don't have permission to access this page.</p>
              <a href="/" className="btn-primary">Go Home</a>
            </div>
          </div>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global AI Chatbot */}
      <ChatBot />
    </BrowserRouter>
  );
}
