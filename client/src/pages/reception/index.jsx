import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, BedDouble, Clock, Search, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { dashboardService, bookingService } from '../../services/api';
import { formatDate, formatZAR, bookingStatusConfig } from '../../utils/helpers';
import { Link } from 'react-router-dom';

// ─── Reception Dashboard ──────────────────────────────────────────────────────
export function ReceptionDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getReception()
      .then(({ data: d }) => setData(d))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-32 skeleton rounded-2xl" />)}
    </div>
  );

  const { stats = {}, todayCheckIns = [], todayCheckOuts = [], availableRooms = [] } = data || {};

  return (
    <div className="space-y-6">
      <h1 className="page-title">Front Desk</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Check-ins Today',  value: stats.checkInsToday,   iconBg: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: 'text-emerald-600 dark:text-emerald-400', icon: LogIn },
          { label: 'Check-outs Today', value: stats.checkOutsToday,  iconBg: 'bg-amber-50 dark:bg-amber-900/20',     iconColor: 'text-amber-600 dark:text-amber-400',    icon: LogOut },
          { label: 'Available Rooms',  value: stats.availableRooms,  iconBg: 'bg-blue-50 dark:bg-blue-900/20',       iconColor: 'text-blue-600 dark:text-blue-400',      icon: BedDouble },
          { label: 'Pending Bookings', value: stats.pendingBookings, iconBg: 'bg-purple-50 dark:bg-purple-900/20',   iconColor: 'text-purple-600 dark:text-purple-400',  icon: Clock },
        ].map(({ label, value, iconBg, iconColor, icon: Icon }) => (
          <div key={label} className="stat-card">
            <div><p className="stat-label">{label}</p><p className="stat-value">{value ?? 0}</p></div>
            <div className={`stat-icon ${iconBg}`}><Icon className={`w-5 h-5 ${iconColor}`} /></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[
          { title: "Today's Arrivals", items: todayCheckIns, badge: 'badge-green', badgeLabel: 'Arriving', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', textColor: 'text-emerald-700 dark:text-emerald-400', icon: LogIn, iconColor: 'text-emerald-500' },
          { title: "Today's Departures", items: todayCheckOuts, badge: 'badge-yellow', badgeLabel: 'Departing', bgColor: 'bg-amber-100 dark:bg-amber-900/30', textColor: 'text-amber-700 dark:text-amber-400', icon: LogOut, iconColor: 'text-amber-500' },
        ].map(({ title, items, badge, badgeLabel, bgColor, textColor, icon: Icon, iconColor }) => (
          <div key={title} className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="section-title flex items-center gap-2">
                <Icon className={`w-4 h-4 ${iconColor}`} /> {title}
              </h3>
              <Link to="/reception/checkinout" className="text-xs font-semibold text-gold-600 dark:text-gold-400 hover:underline">Manage</Link>
            </div>
            <div className="divide-y divide-subtle-t">
              {items.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted">None scheduled today</div>
              ) : items.map(b => (
                <div key={b._id} className="px-6 py-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${bgColor} ${textColor} font-bold text-xs flex items-center justify-center flex-shrink-0`}>
                    {b.guest?.firstName?.[0]}{b.guest?.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-base">{b.guest?.firstName} {b.guest?.lastName}</p>
                    <p className="text-xs text-muted">Room {b.room?.roomNumber} · {b.bookingReference}</p>
                  </div>
                  <span className={`badge ${badge}`}>{badgeLabel}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="section-title flex items-center gap-2">
            <BedDouble className="w-4 h-4 text-blue-500" /> Available Rooms
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {availableRooms.slice(0, 18).map(r => (
              <div key={r._id} className="rounded-xl p-3 text-center border border-emerald-200 dark:border-emerald-800/40"
                style={{ background: 'rgb(16 185 129 / 0.05)' }}>
                <p className="font-bold text-lg text-emerald-700 dark:text-emerald-400">{r.roomNumber}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500 capitalize">{r.type}</p>
                <p className="text-2xs text-muted">Floor {r.floor}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Reception Bookings ───────────────────────────────────────────────────────
export function ReceptionBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('confirmed');

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit: 25 };
      if (search) params.search = search;
      if (status) params.status = status;
      const { data } = await bookingService.getAll(params);
      setBookings(data.data || []);
    } catch { toast.error('Failed to load bookings'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, status]);

  const handleStatus = async (id, s) => {
    try { await bookingService.updateStatus(id, s); toast.success(`Updated to ${bookingStatusConfig[s]?.label}`); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="space-y-6">
      <h1 className="page-title">Bookings</h1>
      <div className="card p-4 flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reference…" className="form-input pl-9 !py-2 text-sm" />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)} className="form-select !py-2 text-sm w-40">
          <option value="">All</option>
          <option value="confirmed">Confirmed</option>
          <option value="checked_in">Checked In</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Reference</th><th>Guest</th><th>Room</th><th>Check-in</th><th>Check-out</th><th>Amount</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {loading ? [...Array(6)].map((_, i) => <tr key={i}>{[...Array(8)].map((_, j) => <td key={j}><div className="h-4 skeleton rounded" /></td>)}</tr>) :
              bookings.map(b => {
                const sc = bookingStatusConfig[b.status] || {};
                return (
                  <tr key={b._id}>
                    <td><span className="font-mono text-xs font-bold text-gold-600 dark:text-gold-400">{b.bookingReference}</span></td>
                    <td><p className="text-sm font-medium text-base">{b.guest?.firstName} {b.guest?.lastName}</p><p className="text-xs text-muted">{b.guest?.phone}</p></td>
                    <td><p className="text-sm text-base">{b.room?.name}</p><p className="text-xs text-muted">#{b.room?.roomNumber}</p></td>
                    <td className="text-sm text-sub">{formatDate(b.checkInDate)}</td>
                    <td className="text-sm text-sub">{formatDate(b.checkOutDate)}</td>
                    <td className="text-sm font-semibold text-gold-600 dark:text-gold-400">{formatZAR(b.pricing?.totalAmount)}</td>
                    <td><span className={`badge ${sc.className}`}>{sc.label}</span></td>
                    <td>
                      <div className="flex gap-1">
                        {b.status === 'confirmed'  && <button onClick={() => handleStatus(b._id, 'checked_in')} className="btn-success btn-sm">Check In</button>}
                        {b.status === 'checked_in' && <button onClick={() => handleStatus(b._id, 'completed')} className="btn-primary btn-sm">Check Out</button>}
                        {b.status === 'pending'    && <button onClick={() => handleStatus(b._id, 'confirmed')} className="btn-secondary btn-sm">Confirm</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Check In / Out ───────────────────────────────────────────────────────────
export function CheckInOut() {
  const [search,  setSearch]  = useState('');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [acting,  setActing]  = useState(false);

  const handleSearch = async e => {
    e.preventDefault();
    if (!search.trim()) return;
    setLoading(true);
    try {
      const { data } = await bookingService.getAll({ search, limit: 1 });
      const result = data.data?.[0] || null;
      setBooking(result);
      if (!result) toast.error('Booking not found');
    } catch { toast.error('Search failed'); }
    finally { setLoading(false); }
  };

  const handleAction = async action => {
    setActing(true);
    try {
      await bookingService.updateStatus(booking._id, action);
      toast.success(action === 'checked_in' ? 'Guest checked in successfully!' : 'Guest checked out successfully!');
      setBooking(null); setSearch('');
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
    finally { setActing(false); }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="page-title">Check In / Check Out</h1>
      <div className="card card-body">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Enter booking reference (SG24-XXXX)…" className="form-input pl-9" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Search'}
          </button>
        </form>
      </div>

      {booking && (
        <div className="card card-body space-y-5 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-surface-900 font-bold text-lg flex items-center justify-center flex-shrink-0">
              {booking.guest?.firstName?.[0]}{booking.guest?.lastName?.[0]}
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-base">{booking.guest?.firstName} {booking.guest?.lastName}</p>
              <p className="text-sm text-muted">{booking.bookingReference} · {booking.guest?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Room',       booking.room?.name],
              ['Room No.',   `#${booking.room?.roomNumber}`],
              ['Check-in',   formatDate(booking.checkInDate)],
              ['Check-out',  formatDate(booking.checkOutDate)],
              ['Nights',     booking.numberOfNights],
              ['Total',      formatZAR(booking.pricing?.totalAmount)],
            ].map(([l, v]) => (
              <div key={l} className="rounded-xl p-3 border border-subtle-t" style={{ background: 'var(--bg-subtle)' }}>
                <p className="text-2xs text-muted uppercase tracking-wide">{l}</p>
                <p className="font-semibold text-base mt-0.5">{v}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            {booking.status === 'confirmed' && (
              <button onClick={() => handleAction('checked_in')} disabled={acting}
                className="btn-success flex-1 justify-center btn-lg">
                <LogIn className="w-4 h-4" /> Check In Guest
              </button>
            )}
            {booking.status === 'checked_in' && (
              <button onClick={() => handleAction('completed')} disabled={acting}
                className="btn-primary flex-1 justify-center btn-lg">
                <LogOut className="w-4 h-4" /> Check Out Guest
              </button>
            )}
            {!['confirmed','checked_in'].includes(booking.status) && (
              <div className={`flex-1 p-3 rounded-xl text-center text-sm font-semibold badge ${bookingStatusConfig[booking.status]?.className}`}>
                Booking is {bookingStatusConfig[booking.status]?.label}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ReceptionDashboard;
