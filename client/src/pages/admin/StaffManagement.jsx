import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { userService } from '../../services/api';
import { roleConfig, getInitials } from '../../utils/helpers';

const ROLES  = ['admin','manager','receptionist','housekeeping','service_staff'];
const DEPTS  = ['front_desk','housekeeping','food_beverage','maintenance','management'];
const SHIFTS = ['morning','afternoon','night'];
const BLANK  = { firstName:'', lastName:'', email:'', password:'', phone:'', role:'receptionist', department:'front_desk', shift:'morning', employeeId:'' };

export default function StaffManagement() {
  const [users,   setUsers]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modal,   setModal]   = useState(null);
  const [selected, setSel]    = useState(null);
  const [form,    setForm]    = useState(BLANK);
  const [saving,  setSaving]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 25 };
      if (search) params.search = search;
      params.role = roleFilter || ROLES.join(',');
      const { data } = await userService.getAll(params);
      setUsers(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch { toast.error('Failed to load staff'); }
    finally { setLoading(false); }
  }, [search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(BLANK); setSel(null); setModal('create'); };
  const openEdit   = u => { setSel(u); setForm({ ...u, password: '' }); setModal('edit'); };
  const sf         = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSave = async e => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal === 'create') { await userService.create(form); toast.success('Staff account created'); }
      else { const p = { ...form }; delete p.password; await userService.update(selected._id, p); toast.success('Staff updated'); }
      setModal(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleToggle = async u => {
    try { await userService.toggleStatus(u._id); toast.success(`Account ${u.isActive ? 'deactivated' : 'activated'}`); load(); }
    catch { toast.error('Failed to update status'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Staff Management</h1>
          <p className="text-xs text-muted mt-0.5">{total} staff members</p>
        </div>
        <button onClick={openCreate} className="btn-primary gap-1.5"><Plus className="w-4 h-4" /> Add Staff</button>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff…" className="form-input pl-9 !py-2 text-sm" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="form-select !py-2 text-sm w-40">
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{roleConfig[r]?.label}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Staff Member</th><th>Role</th><th>Department</th><th>Shift</th><th>Employee ID</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {loading ? [...Array(5)].map((_, i) => <tr key={i}>{[...Array(7)].map((_, j) => <td key={j}><div className="h-4 skeleton rounded" /></td>)}</tr>)
              : users.map(u => {
                const rc = roleConfig[u.role] || {};
                return (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-300 to-gold-500 text-surface-900 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {getInitials(u.firstName, u.lastName)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-base">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge ${rc.className}`}>{rc.label}</span></td>
                    <td className="text-sm text-sub capitalize">{u.department?.replace('_',' ') || '—'}</td>
                    <td className="text-sm text-sub capitalize">{u.shift || '—'}</td>
                    <td className="text-sm text-muted font-mono">{u.employeeId || '—'}</td>
                    <td><span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(u)} className="btn-ghost btn-icon btn-sm"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleToggle(u)} className={`btn-ghost btn-icon btn-sm ${u.isActive ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {u.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-panel">
            <div className="modal-header">
              <h3 className="font-display text-lg font-semibold text-base">{modal === 'create' ? 'Add Staff Member' : 'Edit Staff Member'}</h3>
              <button onClick={() => setModal(null)} className="btn-ghost btn-icon"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="form-label">First Name *</label><input required value={form.firstName} onChange={sf('firstName')} className="form-input" /></div>
                  <div><label className="form-label">Last Name *</label><input required value={form.lastName} onChange={sf('lastName')} className="form-input" /></div>
                </div>
                <div><label className="form-label">Email *</label><input required type="email" value={form.email} onChange={sf('email')} className="form-input" /></div>
                {modal === 'create' && <div><label className="form-label">Password *</label><input required type="password" value={form.password} onChange={sf('password')} className="form-input" placeholder="Min. 8 characters" /></div>}
                <div><label className="form-label">Mobile Number</label><input value={form.phone} onChange={sf('phone')} className="form-input" placeholder="+27 82 000 0000" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="form-label">Role</label>
                    <select value={form.role} onChange={sf('role')} className="form-select">
                      {ROLES.map(r => <option key={r} value={r}>{roleConfig[r]?.label}</option>)}
                    </select></div>
                  <div><label className="form-label">Department</label>
                    <select value={form.department} onChange={sf('department')} className="form-select">
                      {DEPTS.map(d => <option key={d} value={d}>{d.replace('_',' ')}</option>)}
                    </select></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="form-label">Shift</label>
                    <select value={form.shift} onChange={sf('shift')} className="form-select">
                      {SHIFTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select></div>
                  <div><label className="form-label">Employee ID</label><input value={form.employeeId} onChange={sf('employeeId')} className="form-input" placeholder="EMP-XXX" /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
