import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarCheck, BedDouble, Star, ArrowRight, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { bookingService, roomService } from '../../services/api';
import { formatDate, formatZAR, bookingStatusConfig, paymentStatusConfig } from '../../utils/helpers';
import useAuthStore from '../../store/authStore';

// ─── Guest Dashboard ─────────────────────────────────────────────────────────
export function GuestDashboard() {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    bookingService.getMine({ limit: 5 })
      .then(({ data }) => setBookings(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  const active = bookings.filter(b => ['confirmed','checked_in'].includes(b.status));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #243d87 0%, #0A1628 100%)' }}>
        <div className="absolute inset-0 bg-noise opacity-20" />
        <div className="relative z-10">
          <p className="text-primary-300 text-sm mb-1">Welcome back,</p>
          <h1 className="font-display text-3xl font-semibold mb-5">{user?.firstName} {user?.lastName}</h1>
          <div className="flex gap-3 flex-wrap">
            <Link to="/guest/book" className="btn btn-gold btn-sm">
              Reserve a Room <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link to="/guest/bookings" className="btn btn-sm border border-white/20 text-white hover:bg-white/10 transition-colors">
              My Bookings
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Bookings', value: bookings.length, icon: CalendarCheck, iconBg: 'bg-primary-50 dark:bg-primary-900/20', iconColor: 'text-primary-600 dark:text-primary-400' },
          { label: 'Active Stays',   value: active.length,   icon: BedDouble,     iconBg: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Loyalty Points', value: (user?.loyaltyPoints || 0).toLocaleString('en-ZA'), icon: Star, iconBg: 'bg-gold-50 dark:bg-gold-900/20', iconColor: 'text-gold-600 dark:text-gold-400' },
        ].map(({ label, value, icon: Icon, iconBg, iconColor }) => (
          <div key={label} className="stat-card">
            <div><p className="stat-label">{label}</p><p className="stat-value">{value}</p></div>
            <div className={`stat-icon ${iconBg}`}><Icon className={`w-5 h-5 ${iconColor}`} /></div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="section-title">Recent Bookings</h3>
          <Link to="/guest/bookings" className="text-xs font-semibold text-gold-600 dark:text-gold-400 hover:underline">View all</Link>
        </div>
        <div className="divide-y divide-subtle-t">
          {loading ? [...Array(3)].map((_, i) => <div key={i} className="h-16 mx-6 my-3 skeleton rounded-xl" />) :
          bookings.length === 0 ? (
            <div className="card-body text-center py-12">
              <BedDouble className="w-10 h-10 text-muted mx-auto mb-3 opacity-40" />
              <p className="text-sm text-muted mb-3">No bookings yet</p>
              <Link to="/guest/book" className="btn-gold btn-sm">Reserve a Room</Link>
            </div>
          ) : bookings.map(b => {
            const sc = bookingStatusConfig[b.status] || {};
            return (
              <div key={b._id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'var(--bg-muted)' }}>
                  <img src={b.room?.images?.[0]?.url || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=100'} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-base truncate">{b.room?.name}</p>
                  <p className="text-xs text-muted">{formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)}</p>
                </div>
                <div className="text-right">
                  <span className={`badge ${sc.className}`}>{sc.label}</span>
                  <p className="text-sm font-semibold text-gold-600 dark:text-gold-400 mt-1">{formatZAR(b.pricing?.totalAmount)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── My Bookings ─────────────────────────────────────────────────────────────
export function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [statusFilter, setStatus] = useState('');
  const [modal,    setModal]    = useState(null);
  const [selected, setSel]      = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await bookingService.getMine(params);
      setBookings(data.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleCancel = async () => {
    try {
      await bookingService.cancel(selected._id, 'Cancelled by guest');
      toast.success('Booking cancelled');
      load(); setModal(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Cannot cancel this booking'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">My Bookings</h1>
        <Link to="/guest/book" className="btn-gold btn-sm">New Booking</Link>
      </div>

      <div className="card p-4">
        <select value={statusFilter} onChange={e => setStatus(e.target.value)} className="form-select !py-2 text-sm w-44">
          <option value="">All Bookings</option>
          {Object.entries(bookingStatusConfig).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="space-y-4">
        {loading ? [...Array(3)].map((_, i) => <div key={i} className="h-36 skeleton rounded-2xl" />) :
        bookings.length === 0 ? (
          <div className="card card-body text-center py-16">
            <CalendarCheck className="w-10 h-10 text-muted mx-auto mb-3 opacity-40" />
            <p className="text-muted mb-4">No bookings found</p>
            <Link to="/guest/book" className="btn-gold btn-sm">Reserve a Room</Link>
          </div>
        ) : bookings.map(b => {
          const sc = bookingStatusConfig[b.status] || {};
          const pc = paymentStatusConfig[b.paymentStatus] || {};
          const canCancel = ['pending','confirmed'].includes(b.status);
          return (
            <div key={b._id} className="card card-body">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'var(--bg-muted)' }}>
                  <img src={b.room?.images?.[0]?.url || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=100'} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-display text-lg font-semibold text-base">{b.room?.name}</p>
                      <p className="text-xs font-mono font-bold text-gold-600 dark:text-gold-400">{b.bookingReference}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`badge ${sc.className}`}>{sc.label}</span>
                      <span className={`badge ${pc.className}`}>{pc.label}</span>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-sub">
                    <span>Check-in: <strong className="text-base">{formatDate(b.checkInDate)}</strong></span>
                    <span>Check-out: <strong className="text-base">{formatDate(b.checkOutDate)}</strong></span>
                    <span>Nights: <strong className="text-base">{b.numberOfNights}</strong></span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-display text-lg font-bold text-gold-600 dark:text-gold-400">{formatZAR(b.pricing?.totalAmount)}</span>
                    {canCancel && (
                      <button onClick={() => { setSel(b); setModal('cancel'); }} className="btn-danger btn-sm">
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modal === 'cancel' && selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-panel max-w-sm">
            <div className="modal-body text-center py-8">
              <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-7 h-7 text-rose-500" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2 text-base">Cancel Booking</h3>
              <p className="text-sm text-muted">Are you sure you want to cancel booking <strong className="text-base font-mono">{selected.bookingReference}</strong>?</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setModal(null)} className="btn-secondary">Keep Booking</button>
              <button onClick={handleCancel} className="btn-danger">Cancel Booking</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Book Room ────────────────────────────────────────────────────────────────
export function BookRoom() {
  const [rooms,   setRooms]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState({ roomId: '', checkInDate: '', checkOutDate: '', adults: 1, children: 0, specialRequests: '' });
  const [selRoom, setSelRoom] = useState(null);
  const [submitting, setSub]  = useState(false);
  const [success, setSuccess] = useState(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const rid = searchParams.get('roomId');
    const ci  = searchParams.get('checkIn') || searchParams.get('checkInDate');
    const co  = searchParams.get('checkOut') || searchParams.get('checkOutDate');
    if (rid) setForm(p => ({ ...p, roomId: rid }));
    if (ci)  setForm(p => ({ ...p, checkInDate: ci }));
    if (co)  setForm(p => ({ ...p, checkOutDate: co }));

    roomService.getAll({ status: 'available', limit: 50 })
      .then(({ data }) => {
        const r = data.data || [];
        setRooms(r);
        if (rid) setSelRoom(r.find(x => x._id === rid) || null);
      })
      .finally(() => setLoading(false));
  }, []);

  const nights = form.checkInDate && form.checkOutDate
    ? Math.max(0, Math.ceil((new Date(form.checkOutDate) - new Date(form.checkInDate)) / 86400000)) : 0;
  const subtotal = (selRoom?.price?.base || 0) * nights;
  const vat      = subtotal * 0.15;
  const total    = subtotal + vat;

  const handleSubmit = async () => {
    if (!form.roomId || !form.checkInDate || !form.checkOutDate || nights < 1) {
      toast.error('Please select a room and valid dates'); return;
    }
    setSub(true);
    try {
      const { data } = await bookingService.create({
        roomId: form.roomId, checkInDate: form.checkInDate, checkOutDate: form.checkOutDate,
        guests: { adults: form.adults, children: form.children },
        specialRequests: form.specialRequests,
      });
      setSuccess(data.booking);
    } catch (err) { toast.error(err.response?.data?.message || 'Booking failed'); }
    finally { setSub(false); }
  };

  if (success) return (
    <div className="max-w-lg mx-auto text-center py-12 space-y-5">
      <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
      </div>
      <h2 className="font-display text-2xl font-semibold text-base">Booking Confirmed!</h2>
      <p className="text-muted text-sm">Your booking reference is{' '}
        <strong className="text-gold-600 dark:text-gold-400 font-mono">{success.bookingReference}</strong>
      </p>
      <p className="font-display text-lg text-gold-600 dark:text-gold-400">{formatZAR(success.pricing?.totalAmount)}</p>
      <Link to="/guest/bookings" className="btn-gold inline-flex">View My Bookings</Link>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="page-title">Reserve a Room</h1>

      <div className="card card-body space-y-4">
        <h3 className="section-title text-sm uppercase tracking-wider text-muted">1. Select Dates</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="form-label">Check-in *</label>
            <input type="date" min={new Date().toISOString().split('T')[0]} value={form.checkInDate}
              onChange={e => setForm(p => ({ ...p, checkInDate: e.target.value }))} className="form-input" /></div>
          <div><label className="form-label">Check-out *</label>
            <input type="date" min={form.checkInDate || new Date().toISOString().split('T')[0]} value={form.checkOutDate}
              onChange={e => setForm(p => ({ ...p, checkOutDate: e.target.value }))} className="form-input" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="form-label">Adults</label>
            <select value={form.adults} onChange={e => setForm(p => ({ ...p, adults: +e.target.value }))} className="form-select">
              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
          <div><label className="form-label">Children</label>
            <select value={form.children} onChange={e => setForm(p => ({ ...p, children: +e.target.value }))} className="form-select">
              {[0,1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
        </div>
      </div>

      <div className="card card-body space-y-4">
        <h3 className="section-title text-sm uppercase tracking-wider text-muted">2. Choose Your Room</h3>
        {loading ? <div className="h-24 skeleton rounded-xl" /> : (
          <div className="space-y-2.5 max-h-96 overflow-y-auto scrollbar-thin pr-1">
            {rooms.map(room => (
              <label key={room._id}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  form.roomId === room._id
                    ? 'border-gold-500 bg-gold-50 dark:bg-gold-900/10'
                    : 'border-subtle-t hover:border-gold-300 dark:hover:border-gold-700'
                }`}>
                <input type="radio" name="room" value={room._id} checked={form.roomId === room._id}
                  onChange={() => { setForm(p => ({ ...p, roomId: room._id })); setSelRoom(room); }} className="sr-only" />
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'var(--bg-muted)' }}>
                  <img src={room.images?.[0]?.url || ''} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-base">{room.name}</p>
                  <p className="text-xs text-muted">Floor {room.floor} · Up to {room.capacity?.adults} adults</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-sm text-gold-600 dark:text-gold-400">{formatZAR(room.price?.base)}</p>
                  <p className="text-2xs text-muted">/night</p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {form.roomId && nights > 0 && (
        <div className="card card-body space-y-4">
          <h3 className="section-title text-sm uppercase tracking-wider text-muted">3. Special Requests</h3>
          <textarea rows={3} value={form.specialRequests}
            onChange={e => setForm(p => ({ ...p, specialRequests: e.target.value }))}
            placeholder="Dietary requirements, room preferences, early check-in…"
            className="form-input resize-none" />

          <div className="rounded-xl p-4 space-y-2 text-sm border border-gold-200 dark:border-gold-800/40"
            style={{ background: 'rgb(201 168 76 / 0.06)' }}>
            <div className="flex justify-between text-sub">
              <span>{selRoom?.name}</span>
              <span>{formatZAR(selRoom?.price?.base)} × {nights} night{nights > 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between text-sub">
              <span>VAT (15%)</span><span>{formatZAR(vat)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t border-gold-200 dark:border-gold-800/40 pt-2">
              <span>Total</span>
              <span className="text-gold-600 dark:text-gold-400">{formatZAR(total)}</span>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={submitting} className="btn-gold w-full justify-center btn-lg">
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-surface-900/30 border-t-surface-900 rounded-full animate-spin" />
                Processing…
              </span>
            ) : 'Confirm Reservation'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Guest Profile ────────────────────────────────────────────────────────────
export function GuestProfile() {
  const { user, updateUser } = useAuthStore();
  const [form,   setForm]   = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '', phone: user?.phone || '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async e => {
    e.preventDefault(); setSaving(true);
    try {
      const { authService } = await import('../../services/api');
      const { data } = await authService.updateProfile(form);
      updateUser(data.user);
      toast.success('Profile updated');
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="page-title">My Profile</h1>
      <div className="card card-body space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-surface-900 font-bold text-xl flex items-center justify-center flex-shrink-0">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div>
            <p className="font-display text-xl font-semibold text-base">{user?.firstName} {user?.lastName}</p>
            <p className="text-muted text-sm">{user?.email}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Star className="w-3 h-3 text-gold-500 fill-gold-500" />
              <span className="text-xs text-gold-600 dark:text-gold-400 font-semibold">{user?.loyaltyPoints?.toLocaleString('en-ZA') || 0} Loyalty Points</span>
            </div>
          </div>
        </div>
        <form onSubmit={handleSave} className="space-y-4 border-t border-subtle-t pt-5">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">First Name</label>
              <input value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} className="form-input" /></div>
            <div><label className="form-label">Last Name</label>
              <input value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} className="form-input" /></div>
          </div>
          <div><label className="form-label">Mobile Number</label>
            <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="form-input" placeholder="+27 82 000 0000" /></div>
          <div><label className="form-label">Email Address</label>
            <input value={user?.email} disabled className="form-input opacity-50" /></div>
          <button type="submit" disabled={saving} className="btn-gold">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default GuestDashboard;
