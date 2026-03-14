import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Hotel, Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import ThemeToggle from '../../components/ui/ThemeToggle';

// ── Field MUST live outside Register so React never remounts it on re-render.
// Defining a component inside another component causes React to treat it as a
// new type every render → input unmounts → keyboard dismisses on mobile.
const Field = ({ name, label, type = 'text', icon: Icon, placeholder, autoComplete, value, onChange, showPw, setShowPw, error }) => (
  <div>
    <label className="form-label">{label}</label>
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
      <input
        name={name}
        type={name === 'password' ? (showPw ? 'text' : 'password') : type}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`form-input pl-10 ${error ? 'border-rose-400 focus:border-rose-500' : ''}`}
      />
      {name === 'password' && (
        <button
          type="button"
          onClick={() => setShowPw(p => !p)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-sub transition-colors"
        >
          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
    {error && <p className="form-error">{error}</p>}
  </div>
);

export default function Register() {
  const [form,   setForm]   = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const { register, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.firstName.trim())     e.firstName = 'First name is required';
    if (!form.lastName.trim())      e.lastName  = 'Last name is required';
    if (!form.email.trim())         e.email     = 'Email is required';
    if (form.password.length < 8)   e.password  = 'Minimum 8 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    clearError();
    setErrors(p => ({ ...p, [e.target.name]: undefined }));
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await register({
      firstName: form.firstName,
      lastName:  form.lastName,
      email:     form.email,
      phone:     form.phone,
      password:  form.password,
    });
    if (result.success) {
      toast.success('Welcome to Sable Grand!');
      navigate('/guest/dashboard');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 py-12"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgb(36 61 135 / 0.12) 0%, var(--bg-base) 65%)' }}
    >
      <div className="absolute top-4 right-4"><ThemeToggle /></div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-700 to-primary-950 flex items-center justify-center shadow-glow-primary">
              <Hotel className="w-7 h-7 text-white" />
            </div>
            <p className="font-display text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Sable Grand
            </p>
          </Link>
          <p className="text-sm text-muted mt-2">Create your guest account</p>
        </div>

        <div className="card card-body shadow-card-lg">
          {error && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 mb-5">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <p className="text-rose-700 dark:text-rose-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field
                name="firstName" label="First Name" icon={User}
                placeholder="Sipho" autoComplete="given-name"
                value={form.firstName} onChange={handleChange} error={errors.firstName}
              />
              <Field
                name="lastName" label="Last Name" icon={User}
                placeholder="Dlamini" autoComplete="family-name"
                value={form.lastName} onChange={handleChange} error={errors.lastName}
              />
            </div>

            <Field
              name="email" label="Email Address" type="email" icon={Mail}
              placeholder="you@example.co.za" autoComplete="email"
              value={form.email} onChange={handleChange} error={errors.email}
            />

            <Field
              name="phone" label="Mobile Number" type="tel" icon={Phone}
              placeholder="+27 82 000 0000" autoComplete="tel"
              value={form.phone} onChange={handleChange} error={errors.phone}
            />

            <Field
              name="password" label="Password" icon={Lock}
              placeholder="Min. 8 characters" autoComplete="new-password"
              value={form.password} onChange={handleChange} error={errors.password}
              showPw={showPw} setShowPw={setShowPw}
            />

            {/* Confirm password — inlined to avoid needing showPw logic in Field twice */}
            <div>
              <label className="form-label">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  name="confirm"
                  type="password"
                  value={form.confirm}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className={`form-input pl-10 ${errors.confirm ? 'border-rose-400 focus:border-rose-500' : ''}`}
                />
              </div>
              {errors.confirm && <p className="form-error">{errors.confirm}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center btn-lg mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account…
                </span>
              ) : (
                <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-gold-600 dark:text-gold-400 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
