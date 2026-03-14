import React, { useState, useCallback, useEffect } from 'react';
import { Search, Eye, X, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { bookingService } from '../../services/api';
import { formatDate, formatZAR, bookingStatusConfig, paymentStatusConfig } from '../../utils/helpers';

const STATUS_TRANSITIONS = {
  pending:    ['confirmed','cancelled'],
  confirmed:  ['checked_in','cancelled'],
  checked_in: ['completed'],
  completed: [], cancelled: [], no_show: [],
};

const InfoRow = ({ label, value }) => (
  <div>
    <p className="text-2xs font-bold uppercase tracking-wider text-muted">{label}</p>
    <p className="text-sm font-medium mt-0.5 text-base">{value || '—'}</p>
  </div>
);

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [statusFilter, setStatus] = useState('');
  const [page,     setPage]     = useState(1);
  const [modal,    setModal]    = useState(null);
  const [selected, setSelected] = useState(null);
  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await bookingService.getAll(params);
      setBookings(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch { toast.error('Failed to load bookings'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (bookingId, status) => {
    try {
      await bookingService.updateStatus(bookingId, status);
      toast.success(`Booking updated to ${bookingStatusConfig[status]?.label}`);
      load(); setModal(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Booking Management</h1>
          <p className="text-xs text-muted mt-0.5">{total} total bookings</p>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by reference…" className="form-input pl-9 !py-2 text-sm" />
        </div>
        <select value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="form-select !py-2 text-sm w-40">
          <option value="">All Statuses</option>
          {Object.entries(bookingStatusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Reference</th><th>Guest</th><th>Room</th><th>Dates</th>
                <th>Amount (ZAR)</th><th>Payment</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(8)].map((_, i) => (
                <tr key={i}>{[...Array(8)].map((_, j) => <td key={j}><div className="h-4 skeleton rounded" /></td>)}</tr>
              )) : bookings.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted">No bookings found</td></tr>
              ) : bookings.map(b => {
                const sc = bookingStatusConfig[b.status] || {};
                const pc = paymentStatusConfig[b.paymentStatus] || {};
                return (
                  <tr key={b._id}>
                    <td><span className="font-mono text-xs font-bold text-gold-600 dark:text-gold-400">{b.bookingReference}</span></td>
                    <td>
                      <p className="font-medium text-sm text-base">{b.guest?.firstName} {b.guest?.lastName}</p>
                      <p className="text-xs text-muted">{b.guest?.email}</p>
                    </td>
                    <td>
                      <p className="text-sm font-medium text-base">{b.room?.name}</p>
                      <p className="text-xs text-muted">#{b.room?.roomNumber}</p>
                    </td>
                    <td>
                      <p className="text-xs text-sub">{formatDate(b.checkInDate)} →</p>
                      <p className="text-xs text-sub">{formatDate(b.checkOutDate)}</p>
                    </td>
                    <td className="font-semibold text-sm text-base">{formatZAR(b.pricing?.totalAmount)}</td>
                    <td><span className={`badge ${pc.className}`}>{pc.label}</span></td>
                    <td><span className={`badge ${sc.className}`}>{sc.label}</span></td>
                    <td>
                      <button onClick={() => { setSelected(b); setModal('view'); }}
                        className="btn-ghost btn-icon btn-sm">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="p-4 flex items-center justify-between">
            <p className="text-xs text-muted">Page {page} of {pages}</p>
            <div className="flex gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary btn-sm">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {[...Array(Math.min(pages, 7))].map((_, i) => {
                const n = i + 1;
                return (
                  <button key={n} onClick={() => setPage(n)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                      page === n ? 'bg-gradient-to-br from-primary-700 to-primary-900 text-white' : 'btn-secondary'
                    }`}>
                    {n}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="btn-secondary btn-sm">
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {modal === 'view' && selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-panel max-w-xl">
            <div className="modal-header">
              <div>
                <h3 className="font-display text-lg font-semibold text-base">Booking Details</h3>
                <p className="text-xs font-mono font-bold text-gold-600 dark:text-gold-400 mt-0.5">{selected.bookingReference}</p>
              </div>
              <button onClick={() => setModal(null)} className="btn-ghost btn-icon"><X className="w-4 h-4" /></button>
            </div>
            <div className="modal-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Guest" value={`${selected.guest?.firstName} ${selected.guest?.lastName}`} />
                <InfoRow label="Email" value={selected.guest?.email} />
                <InfoRow label="Room" value={selected.room?.name} />
                <InfoRow label="Room Number" value={`#${selected.room?.roomNumber}`} />
                <InfoRow label="Check-in" value={formatDate(selected.checkInDate)} />
                <InfoRow label="Check-out" value={formatDate(selected.checkOutDate)} />
                <InfoRow label="Nights" value={selected.numberOfNights} />
                <InfoRow label="Guests" value={`${selected.guests?.adults} adults, ${selected.guests?.children} children`} />
                <InfoRow label="Room Rate" value={formatZAR(selected.pricing?.roomRate)} />
                <InfoRow label="VAT (15%)" value={formatZAR(selected.pricing?.taxes)} />
                <InfoRow label="Total (incl. VAT)" value={formatZAR(selected.pricing?.totalAmount)} />
                <InfoRow label="Amount Paid" value={formatZAR(selected.pricing?.paidAmount)} />
                <InfoRow label="Balance Due" value={formatZAR(selected.pricing?.balanceDue)} />
                <InfoRow label="Source" value={selected.source?.replace('_',' ')} />
              </div>

              {selected.specialRequests && (
                <div className="rounded-xl p-3 border border-subtle-t" style={{ background: 'var(--bg-subtle)' }}>
                  <p className="text-2xs font-bold uppercase tracking-wider text-muted mb-1">Special Requests</p>
                  <p className="text-sm text-sub">{selected.specialRequests}</p>
                </div>
              )}

              {STATUS_TRANSITIONS[selected.status]?.length > 0 && (
                <div className="border-t border-subtle-t pt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Update Status</p>
                  <div className="flex gap-2 flex-wrap">
                    {STATUS_TRANSITIONS[selected.status].map(s => (
                      <button key={s} onClick={() => handleStatus(selected._id, s)}
                        className={`btn btn-sm ${s === 'cancelled' ? 'btn-danger' : s === 'checked_in' ? 'btn-success' : 'btn-primary'}`}>
                        {bookingStatusConfig[s]?.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
