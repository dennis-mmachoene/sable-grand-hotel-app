import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Hotel, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import ThemeToggle from '../ui/ThemeToggle';

export default function PublicLayout() {
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, token, logout }     = useAuthStore();
  const { theme }                   = useThemeStore();
  const navigate  = useNavigate();
  const location  = useLocation();
  const isLanding = location.pathname === '/';

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = async () => { await logout(); navigate('/'); };

  const dashPath = user
    ? ['admin','manager'].includes(user.role) ? '/admin/dashboard'
    : user.role === 'receptionist'            ? '/reception/dashboard'
    : '/guest/dashboard'
    : '/login';

  const navLinks = [
    { to: '/',        label: 'Home'    },
    { to: '/rooms',   label: 'Rooms'   },
    { to: '/contact', label: 'Contact' },
  ];

  const transparent = isLanding && !scrolled;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-400 ${
          transparent
            ? 'bg-transparent border-transparent'
            : 'border-b border-subtle-t shadow-card'
        }`}
        style={transparent ? {} : { background: 'var(--bg-elevated)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                transparent ? 'bg-white/15 border border-white/20' : 'bg-gradient-to-br from-primary-700 to-primary-900'
              }`}>
                <Hotel className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <p className={`font-display text-xl font-semibold leading-tight transition-colors ${
                  transparent ? 'text-white' : ''
                }`} style={transparent ? {} : { color: 'var(--text-primary)' }}>
                  Sable Grand
                </p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(link => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      transparent
                        ? `text-white/85 hover:text-white hover:bg-white/10 ${isActive ? 'text-white font-semibold' : ''}`
                        : `hover:bg-subtle ${isActive ? 'font-semibold' : ''}`
                    }`}
                    style={transparent ? {} : { color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Auth + Theme */}
            <div className="hidden md:flex items-center gap-2">
              {!transparent && <ThemeToggle />}

              {token && user ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(dashPath)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                      transparent
                        ? 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
                        : 'btn-secondary'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      transparent
                        ? 'text-white/70 hover:text-white hover:bg-white/10'
                        : 'btn-ghost text-rose-400'
                    }`}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      transparent
                        ? 'text-white/80 hover:text-white hover:bg-white/10'
                        : 'btn-ghost'
                    }`}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className={transparent ? 'btn btn-gold' : 'btn-primary btn'}
                  >
                    Book Now
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              className={`md:hidden btn-ghost btn-icon ${transparent ? 'text-white hover:bg-white/10' : ''}`}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="md:hidden border-t border-subtle-t animate-slide-down"
            style={{ background: 'var(--bg-elevated)' }}
          >
            <div className="p-4 space-y-1">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="block px-4 py-3 rounded-xl text-sm font-medium nav-item"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-subtle-t flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs text-muted">Theme</span>
                  <ThemeToggle />
                </div>
                {token ? (
                  <>
                    <Link to={dashPath} className="btn-primary justify-center">Dashboard</Link>
                    <button onClick={handleLogout} className="btn-secondary justify-center">Sign Out</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="btn-secondary justify-center">Sign In</Link>
                    <Link to="/register" className="btn-gold justify-center">Book Now</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-primary-950 text-surface-400 py-14 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gold-500/20 flex items-center justify-center">
                <Hotel className="w-4 h-4 text-gold-400" />
              </div>
              <span className="font-display text-lg font-semibold text-white">Sable Grand</span>
            </div>
            <p className="text-sm text-surface-500 leading-relaxed">
              Where luxury meets the spirit of South Africa. An unparalleled experience awaits.
            </p>
            <div className="divider-gold mt-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-surface-400 mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              {[['/', 'Home'], ['/rooms', 'Rooms & Suites'], ['/contact', 'Contact Us']].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="text-surface-500 hover:text-gold-400 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-surface-400 mb-4">Services</h4>
            <ul className="space-y-2.5 text-sm">
              {['Fine Dining', 'Spa & Wellness', 'Fitness Centre', 'Business Centre', 'Concierge'].map(s => (
                <li key={s} className="text-surface-500">{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-surface-400 mb-4">Contact</h4>
            <ul className="space-y-2.5 text-sm text-surface-500">
              <li>1 Sable Drive, Sandton</li>
              <li>Johannesburg, 2196</li>
              <li className="pt-1">+27 11 555 0100</li>
              <li>info@sablegrand.co.za</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-surface-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-surface-600">
          <p>© {new Date().getFullYear()} Sable Grand Hotel. All rights reserved.</p>
          <p>VAT Reg: 4150123456 · South Africa</p>
        </div>
      </footer>
    </div>
  );
}
