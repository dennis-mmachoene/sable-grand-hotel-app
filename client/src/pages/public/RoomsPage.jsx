import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, BedDouble, Users, ChevronRight, Wifi, Wind, Tv, Coffee, X, SlidersHorizontal } from 'lucide-react';
import { roomService } from '../../services/api';
import { formatZAR, roomTypeConfig, roomStatusConfig } from '../../utils/helpers';

export default function RoomsPage() {
  const [rooms,   setRooms]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [searchParams]        = useSearchParams();

  const [filters, setFilters] = useState({
    type: '', minPrice: '', maxPrice: '', capacity: '', search: '', status: 'available',
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, ...filters };
      Object.keys(params).forEach(k => { if (!params[k] && params[k] !== 0) delete params[k]; });
      const { data } = await roomService.getAll(params);
      setRooms(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const clearFilters = () => {
    setFilters({ type: '', minPrice: '', maxPrice: '', capacity: '', search: '', status: 'available' });
    setPage(1);
  };
  const hasFilters = Object.entries(filters).some(([k, v]) => v && !(k === 'status' && v === 'available'));

  const SKELETON = [...Array(6)].map((_, i) => (
    <div key={i} className="card overflow-hidden">
      <div className="h-52 skeleton" />
      <div className="p-5 space-y-3">
        <div className="h-4 skeleton rounded w-3/4" />
        <div className="h-3 skeleton rounded w-1/2" />
        <div className="h-8 skeleton rounded" />
      </div>
    </div>
  ));

  return (
    <div className="min-h-screen pt-20" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div className="border-b border-subtle-t py-10" style={{ background: 'var(--bg-elevated)' }}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-gold-500 mb-3">Accommodations</p>
          <h1 className="font-display text-4xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
            Rooms & Suites
          </h1>
          <p className="text-sub text-sm max-w-xl mx-auto">
            {total} accommodation{total !== 1 ? 's' : ''} available · All prices in South African Rand (ZAR)
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filter bar */}
        <div className="card p-4 mb-8">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <label className="form-label">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input value={filters.search}
                  onChange={e => { setFilters(p => ({ ...p, search: e.target.value })); setPage(1); }}
                  placeholder="Room name or number…" className="form-input pl-9 !py-2 text-sm" />
              </div>
            </div>
            <div className="w-36">
              <label className="form-label">Room Type</label>
              <select value={filters.type}
                onChange={e => { setFilters(p => ({ ...p, type: e.target.value })); setPage(1); }}
                className="form-select !py-2 text-sm">
                <option value="">All Types</option>
                {Object.entries(roomTypeConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>

            <button onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary btn-sm gap-1.5 self-end ${showFilters ? 'border-gold-400' : ''}`}>
              <SlidersHorizontal className="w-3.5 h-3.5" /> More Filters
            </button>

            {hasFilters && (
              <button onClick={clearFilters} className="btn-ghost btn-sm gap-1 self-end text-rose-400">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-subtle-t">
              <div className="w-32">
                <label className="form-label">Min Price (ZAR)</label>
                <input type="number" placeholder="R 0" value={filters.minPrice}
                  onChange={e => setFilters(p => ({ ...p, minPrice: e.target.value }))}
                  className="form-input !py-2 text-sm" />
              </div>
              <div className="w-32">
                <label className="form-label">Max Price (ZAR)</label>
                <input type="number" placeholder="Any" value={filters.maxPrice}
                  onChange={e => setFilters(p => ({ ...p, maxPrice: e.target.value }))}
                  className="form-input !py-2 text-sm" />
              </div>
              <div className="w-28">
                <label className="form-label">Guests</label>
                <select value={filters.capacity}
                  onChange={e => setFilters(p => ({ ...p, capacity: e.target.value }))}
                  className="form-select !py-2 text-sm">
                  <option value="">Any</option>
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}+</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{SKELETON}</div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20">
            <BedDouble className="w-12 h-12 text-muted mx-auto mb-3 opacity-40" />
            <p className="font-semibold text-base mb-1">No rooms match your search</p>
            <p className="text-sm text-muted mb-4">Try adjusting your filters</p>
            <button onClick={clearFilters} className="btn-secondary btn-sm">Clear Filters</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map(room => {
                const typeConf   = roomTypeConfig[room.type] || {};
                const statusConf = roomStatusConfig[room.status] || {};
                return (
                  <Link key={room._id} to={`/rooms/${room._id}`}
                    className="card overflow-hidden hover:shadow-card-lg hover:-translate-y-1 transition-all duration-300 group">
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={room.images?.[0]?.url || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600'}
                        alt={room.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className={`badge ${typeConf.color}`}>{typeConf.label}</span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className={`badge ${statusConf.className}`}>{statusConf.label}</span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-display text-lg font-semibold mb-1 text-base">{room.name}</h3>
                      <p className="text-sub text-sm mb-3 line-clamp-2 leading-relaxed">{room.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted mb-4">
                        <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> Floor {room.floor}</span>
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Up to {room.capacity?.adults}</span>
                        {room.size && <span>{room.size} m²</span>}
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-display text-xl font-semibold text-base">{formatZAR(room.price?.base)}</span>
                          <span className="text-xs text-muted">/night</span>
                        </div>
                        <span className="btn-gold btn-sm">
                          Book Now <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {total > 12 && (
              <div className="flex justify-center gap-2 mt-10">
                {[...Array(Math.ceil(total / 12))].map((_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)}
                    className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                      page === i + 1
                        ? 'bg-gradient-to-br from-primary-700 to-primary-900 text-white shadow-sm'
                        : 'btn-secondary'
                    }`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
