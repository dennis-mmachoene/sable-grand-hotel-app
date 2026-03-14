import React, { useState, useEffect, useCallback } from 'react';
import { Wrench, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { serviceApi } from '../../services/api';
import { serviceTypeLabels, capitalize, timeAgo } from '../../utils/helpers';

const PRIORITY_BADGE = { low:'badge-gray', normal:'badge-blue', high:'badge-yellow', urgent:'badge-red' };
const STATUS_BADGE   = { pending:'badge-yellow', assigned:'badge-blue', in_progress:'badge-indigo', completed:'badge-green', cancelled:'badge-red' };
const STATUSES       = ['pending','assigned','in_progress','completed','cancelled'];

export default function ServiceManagement() {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [statusFilter, setStatus] = useState('');
  const [typeFilter,   setType]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter)   params.serviceType = typeFilter;
      const { data } = await serviceApi.getAll(params);
      setRequests(data.data || []);
    } catch { toast.error('Failed to load requests'); }
    finally { setLoading(false); }
  }, [statusFilter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id, status) => {
    try { await serviceApi.update(id, { status }); toast.success('Request updated'); load(); }
    catch { toast.error('Update failed'); }
  };

  const stats = {
    pending:    requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => r.status === 'in_progress').length,
    completed:  requests.filter(r => r.status === 'completed').length,
    urgent:     requests.filter(r => r.priority === 'urgent').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Service Requests</h1>
        <p className="text-xs text-muted mt-0.5">Guest service & maintenance management</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Pending',     value: stats.pending,    icon: Clock,        iconBg: 'bg-amber-50 dark:bg-amber-900/20',   iconColor: 'text-amber-600 dark:text-amber-400' },
          { label:'In Progress', value: stats.inProgress, icon: Wrench,       iconBg: 'bg-blue-50 dark:bg-blue-900/20',     iconColor: 'text-blue-600 dark:text-blue-400' },
          { label:'Completed',   value: stats.completed,  icon: CheckCircle2, iconBg: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: 'text-emerald-600 dark:text-emerald-400' },
          { label:'Urgent',      value: stats.urgent,     icon: AlertTriangle, iconBg: 'bg-rose-50 dark:bg-rose-900/20',    iconColor: 'text-rose-500' },
        ].map(({ label, value, icon: Icon, iconBg, iconColor }) => (
          <div key={label} className="stat-card">
            <div><p className="stat-label">{label}</p><p className="stat-value">{value}</p></div>
            <div className={`stat-icon ${iconBg}`}><Icon className={`w-5 h-5 ${iconColor}`} /></div>
          </div>
        ))}
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <select value={statusFilter} onChange={e => setStatus(e.target.value)} className="form-select !py-2 text-sm w-40">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{capitalize(s.replace('_',' '))}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setType(e.target.value)} className="form-select !py-2 text-sm w-44">
          <option value="">All Types</option>
          {Object.entries(serviceTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-36 skeleton rounded-2xl" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="card card-body text-center py-16">
          <CheckCircle2 className="w-10 h-10 text-muted mx-auto mb-3 opacity-40" />
          <p className="text-muted">No service requests match your filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map(r => (
            <div key={r._id} className="card card-body space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-base">{r.title}</p>
                  <p className="text-xs text-muted mt-0.5">{r.requestNumber} · Room {r.roomNumber}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <span className={`badge ${PRIORITY_BADGE[r.priority] || 'badge-gray'}`}>{capitalize(r.priority)}</span>
                  <span className={`badge ${STATUS_BADGE[r.status] || 'badge-gray'}`}>{capitalize(r.status?.replace('_',' '))}</span>
                </div>
              </div>
              {r.description && <p className="text-sm text-sub leading-relaxed">{r.description}</p>}
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{r.guest?.firstName} {r.guest?.lastName} · {serviceTypeLabels[r.serviceType]}</span>
                <span>{timeAgo(r.createdAt)}</span>
              </div>
              {r.status !== 'completed' && r.status !== 'cancelled' && (
                <div className="pt-2 border-t border-subtle-t flex gap-2 flex-wrap">
                  {STATUSES.filter(s => s !== r.status && s !== 'pending').map(s => (
                    <button key={s} onClick={() => handleStatusChange(r._id, s)}
                      className={`btn btn-sm ${s === 'completed' ? 'btn-success' : s === 'cancelled' ? 'btn-danger' : 'btn-secondary'}`}>
                      {capitalize(s.replace('_',' '))}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
