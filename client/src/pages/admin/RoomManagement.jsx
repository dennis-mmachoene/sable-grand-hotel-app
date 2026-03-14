import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { roomService } from '../../services/api';
import { formatZAR, roomTypeConfig, roomStatusConfig, capitalize } from '../../utils/helpers';

const ROOM_TYPES    = ['standard','deluxe','suite','presidential'];
const ROOM_STATUSES = ['available','booked','maintenance','cleaning'];
const BED_TYPES     = ['single','double','twin','queen','king','two_queens','two_kings'];
const AMENITIES     = ['wifi','ac','tv','minibar','safe','bathtub','shower','balcony','city_view','ocean_view','pool_view','jacuzzi','kitchen','living_room','dining_area','butler_service','coffee_machine','iron','hair_dryer','telephone','desk','sofa','extra_bed_available'];

const BLANK = {
  roomNumber:'', type:'standard', name:'', description:'', floor:1,
  bedConfiguration:'queen', size:'',
  price:{ base:'', weekend:'', seasonal:'' },
  capacity:{ adults:2, children:0 },
  status:'available', amenities:[],
  images:[{ url:'', caption:'', isPrimary:true }],
};

export default function RoomManagement() {
  const [rooms,   setRooms]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page,    setPage]    = useState(1);
  const [modal,   setModal]   = useState(null);
  const [selected, setSel]    = useState(null);
  const [form,    setForm]    = useState(BLANK);
  const [saving,  setSaving]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      const { data } = await roomService.getAll(params);
      setRooms(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch { toast.error('Failed to load rooms'); }
    finally { setLoading(false); }
  }, [page, search, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(BLANK); setSel(null); setModal('create'); };
  const openEdit   = r => { setSel(r); setForm({ ...r, price: { base: r.price?.base||'', weekend: r.price?.weekend||'', seasonal: r.price?.seasonal||'' } }); setModal('edit'); };
  const openDelete = r => { setSel(r); setModal('delete'); };

  const setField = (path, val) => {
    const keys = path.split('.');
    setForm(p => {
      const copy = { ...p };
      let obj = copy;
      for (let i = 0; i < keys.length - 1; i++) { obj[keys[i]] = { ...obj[keys[i]] }; obj = obj[keys[i]]; }
      obj[keys[keys.length - 1]] = val;
      return copy;
    });
  };

  const toggleAmenity = a => setForm(p => ({
    ...p, amenities: p.amenities.includes(a) ? p.amenities.filter(x => x !== a) : [...p.amenities, a],
  }));

  const handleSave = async e => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal === 'create') { await roomService.create(form); toast.success('Room created'); }
      else { await roomService.update(selected._id, form); toast.success('Room updated'); }
      setModal(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await roomService.delete(selected._id); toast.success('Room deleted'); setModal(null); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const handleStatusChange = async (id, status) => {
    try { await roomService.updateStatus(id, status); toast.success('Status updated'); load(); }
    catch { toast.error('Status update failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Room Management</h1>
          <p className="text-xs text-muted mt-0.5">{total} rooms · All prices in ZAR</p>
        </div>
        <button onClick={openCreate} className="btn-primary gap-1.5">
          <Plus className="w-4 h-4" /> Add Room
        </button>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search rooms…" className="form-input pl-9 !py-2 text-sm" />
        </div>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="form-select !py-2 text-sm w-36">
          <option value="">All Types</option>
          {ROOM_TYPES.map(t => <option key={t} value={t}>{roomTypeConfig[t]?.label}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Room</th><th>Type</th><th>Floor</th><th>Capacity</th><th>Price/Night</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {loading ? [...Array(6)].map((_, i) => (
                <tr key={i}>{[...Array(7)].map((_, j) => <td key={j}><div className="h-4 skeleton rounded w-20" /></td>)}</tr>
              )) : rooms.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted">No rooms found</td></tr>
              ) : rooms.map(room => {
                const tc = roomTypeConfig[room.type] || {};
                const sc = roomStatusConfig[room.status] || {};
                return (
                  <tr key={room._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'var(--bg-muted)' }}>
                          {room.images?.[0]?.url && <img src={room.images[0].url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-base">{room.name}</p>
                          <p className="text-xs text-muted">#{room.roomNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge ${tc.color}`}>{tc.label}</span></td>
                    <td className="text-sub text-sm">{room.floor}</td>
                    <td className="text-sub text-sm">{room.capacity?.adults} adults</td>
                    <td className="font-semibold text-sm text-base">{formatZAR(room.price?.base)}</td>
                    <td>
                      <select value={room.status}
                        onChange={e => handleStatusChange(room._id, e.target.value)}
                        className={`text-xs font-bold border-0 bg-transparent cursor-pointer focus:outline-none rounded-full px-1 ${sc.className}`}>
                        {ROOM_STATUSES.map(s => <option key={s} value={s}>{roomStatusConfig[s]?.label}</option>)}
                      </select>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(room)} className="btn-ghost btn-icon btn-sm"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => openDelete(room)} className="btn-ghost btn-icon btn-sm text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {total > 10 && (
          <div className="p-4 flex justify-center gap-2">
            {[...Array(Math.ceil(total / 10))].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold ${page === i + 1 ? 'bg-gradient-to-br from-primary-700 to-primary-900 text-white' : 'btn-secondary'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-panel max-w-2xl">
            <div className="modal-header">
              <h3 className="font-display text-lg font-semibold text-base">{modal === 'create' ? 'Add New Room' : 'Edit Room'}</h3>
              <button onClick={() => setModal(null)} className="btn-ghost btn-icon"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="form-label">Room Number *</label>
                    <input required value={form.roomNumber} onChange={e => setField('roomNumber', e.target.value)} className="form-input" placeholder="e.g. 101" /></div>
                  <div><label className="form-label">Room Name *</label>
                    <input required value={form.name} onChange={e => setField('name', e.target.value)} className="form-input" placeholder="e.g. Deluxe King" /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="form-label">Type</label>
                    <select value={form.type} onChange={e => setField('type', e.target.value)} className="form-select">
                      {ROOM_TYPES.map(t => <option key={t} value={t}>{roomTypeConfig[t]?.label}</option>)}
                    </select></div>
                  <div><label className="form-label">Bed Configuration</label>
                    <select value={form.bedConfiguration} onChange={e => setField('bedConfiguration', e.target.value)} className="form-select">
                      {BED_TYPES.map(b => <option key={b} value={b}>{capitalize(b)}</option>)}
                    </select></div>
                  <div><label className="form-label">Floor</label>
                    <input type="number" min={1} value={form.floor} onChange={e => setField('floor', +e.target.value)} className="form-input" /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="form-label">Base Price (ZAR) *</label>
                    <input type="number" required min={0} value={form.price.base} onChange={e => setField('price.base', +e.target.value)} className="form-input" placeholder="e.g. 1800" /></div>
                  <div><label className="form-label">Max Adults</label>
                    <input type="number" min={1} max={10} value={form.capacity.adults} onChange={e => setField('capacity.adults', +e.target.value)} className="form-input" /></div>
                  <div><label className="form-label">Size (m²)</label>
                    <input type="number" min={0} value={form.size} onChange={e => setField('size', +e.target.value)} className="form-input" /></div>
                </div>
                <div><label className="form-label">Description *</label>
                  <textarea required rows={3} value={form.description} onChange={e => setField('description', e.target.value)} className="form-input resize-none" /></div>
                <div><label className="form-label">Image URL</label>
                  <input value={form.images?.[0]?.url || ''} onChange={e => setField('images', [{ url: e.target.value, isPrimary: true }])} className="form-input" placeholder="https://…" /></div>
                <div>
                  <label className="form-label">Amenities</label>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {AMENITIES.map(a => (
                      <button key={a} type="button" onClick={() => toggleAmenity(a)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                          form.amenities.includes(a)
                            ? 'bg-gold-50 dark:bg-gold-900/20 text-gold-700 dark:text-gold-400 border-gold-300 dark:border-gold-700'
                            : 'border-subtle-t text-muted hover:border-gold-300'
                        }`}>
                        {capitalize(a)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving…' : modal === 'create' ? 'Create Room' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === 'delete' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-panel max-w-sm">
            <div className="modal-body text-center py-8">
              <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2 text-base">Delete Room</h3>
              <p className="text-sm text-muted">Are you sure you want to delete <strong className="text-base">{selected?.name}</strong>? This cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="btn-danger">Delete Room</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
