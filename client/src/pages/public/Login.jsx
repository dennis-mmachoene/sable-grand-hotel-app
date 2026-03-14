import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Hotel, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import ThemeToggle from '../../components/ui/ThemeToggle';

const QUICK_LOGINS = [
  { label: 'Admin',        email: 'victoria.harrington@sablegrand.co.za',  password: 'Admin@SableGrand2024!',       role: 'admin' },
  { label: 'Manager',      email: 'marcus.wellington@sablegrand.co.za',    password: 'Manager@SableGrand2024!',     role: 'manager' },
  { label: 'Receptionist', email: 'sophia.chambers@sablegrand.co.za',      password: 'Reception@SableGrand2024!',   role: 'receptionist' },
  { label: 'Guest',        email: 'eleanor.whitfield@email.com',           password: 'Guest@2024!',                 role: 'guest' },
];

export default function Login() {
  const [form,   setForm]   = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const { login, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    clearError();
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const redirect = (user) => {
    if (['admin','manager'].includes(user?.role)) navigate('/admin/dashboard');
    else if (user?.role === 'receptionist')       navigate('/reception/dashboard');
    else                                          navigate('/guest/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(form.email, form.password);
    if (result.success) {
      toast.success('Welcome back!');
      redirect(useAuthStore.getState().user);
    }
  };

  const quickLogin = async ({ email, password }) => {
    clearError();
    const result = await login(email, password);
    if (result.success) {
      toast.success('Signed in');
      redirect(useAuthStore.getState().user);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgb(36 61 135 / 0.12) 0%, var(--bg-base) 65%)',
      }}
    >
      {/* Theme toggle top right */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-700 to-primary-950 flex items-center justify-center shadow-glow-primary">
              <Hotel className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="font-display text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                Sable Grand
              </p>
              <p className="text-xs tracking-widest uppercase text-muted mt-0.5">
                Management Portal
              </p>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className="card card-body shadow-card-lg">
          {error && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 mb-6">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <p className="text-rose-700 dark:text-rose-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="form-label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  name="email" type="email" required autoComplete="email"
                  value={form.email} onChange={handleChange}
                  placeholder="you@example.com"
                  className="form-input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  name="password" type={showPw ? 'text' : 'password'} required
                  value={form.password} onChange={handleChange}
                  placeholder="••••••••"
                  className="form-input pl-10 pr-10"
                />
                <button
                  type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-sub transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center btn-lg">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-6">
            New guest?{' '}
            <Link to="/register" className="text-gold-600 dark:text-gold-400 font-semibold hover:underline">
              Create account
            </Link>
          </p>
        </div>

        {/* Quick Access */}
        <div
          className="mt-4 rounded-2xl border border-subtle-t p-4"
          style={{ background: 'var(--bg-elevated)' }}
        >
          <p className="text-2xs font-bold uppercase tracking-widest text-muted text-center mb-3 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-gold-500" />
            Quick Access (Demo)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_LOGINS.map(q => (
              <button
                key={q.label}
                onClick={() => quickLogin(q)}
                disabled={loading}
                className="px-3 py-2.5 rounded-xl border border-subtle-t hover:border-gold-400/40 text-left transition-all group"
                style={{ background: 'var(--bg-subtle)' }}
              >
                <p className="text-xs font-bold group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                  {q.label}
                </p>
                <p className="text-2xs text-muted truncate mt-0.5">{q.email.split('@')[0]}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
