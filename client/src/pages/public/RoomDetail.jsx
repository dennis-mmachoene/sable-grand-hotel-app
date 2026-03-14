import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BedDouble, Users, Maximize2, ArrowLeft, Check, ChevronRight, MapPin, Wifi, Wind, Tv, Coffee, Shield, Utensils } from 'lucide-react';
import { roomService } from '../../services/api';
import { formatZAR, roomTypeConfig, capitalize } from '../../utils/helpers';
import useAuthStore from '../../store/authStore';

const AMENITY_MAP = {
  wifi: { icon: Wifi, label: 'Free Wi-Fi' }, ac: { icon: Wind, label: 'Air Conditioning' },
  tv: { icon: Tv, label: 'Smart TV' }, coffee_machine: { icon: Coffee, label: 'Coffee Machine' },
  safe: { icon: Shield, label: 'In-room Safe' }, minibar: { icon: Utensils, label: 'Minibar' },
  bathtub: { label: 'Bathtub' }, shower: { label: 'Rain Shower' }, jacuzzi: { label: 'Jacuzzi' },
  balcony: { label: 'Private Balcony' }, city_view: { label: 'City View' },
  ocean_view: { label: 'Garden View' }, pool_view: { label: 'Pool View' },
  living_room: { label: 'Living Room' }, dining_area: { label: 'Dining Area' },
  kitchen: { label: 'Kitchenette' }, butler_service: { label: '24h Butler' },
  hair_dryer: { label: 'Hair Dryer' }, iron: { label: 'Iron & Board' },
  desk: { label: 'Work Desk' }, sofa: { label: 'Lounge Sofa' },
};

export default function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [room,       setRoom]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [activeImg,  setActiveImg]  = useState(0);
  const [bookForm,   setBookForm]   = useState({ checkIn: '', checkOut: '', adults: 1, children: 0 });

  useEffect(() => {
    roomService.getOne(id)
      .then(({ data }) => setRoom(data.room))
      .catch(() => navigate('/rooms'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBook = () => {
    if (!token) { navigate('/login'); return; }
    const params = new URLSearchParams({ roomId: id, ...bookForm });
    navigate(`/guest/book?${params}`);
  };

  if (loading) return (
    <div className="min-h-screen pt-20" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-6 animate-pulse">
        <div className="h-96 skeleton rounded-2xl" />
        <div className="h-8 skeleton rounded w-1/2" />
        <div className="h-4 skeleton rounded w-3/4" />
      </div>
    </div>
  );
  if (!room) return null;

  const typeConf = roomTypeConfig[room.type] || {};
  const nights = bookForm.checkIn && bookForm.checkOut
    ? Math.max(0, Math.ceil((new Date(bookForm.checkOut) - new Date(bookForm.checkIn)) / 86400000)) : 0;
  const subtotal = nights * (room.price?.base || 0);
  const vat      = subtotal * 0.15; // 15% VAT (South Africa)
  const total    = subtotal + vat;

  return (
    <div className="min-h-screen pt-20" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link to="/rooms" className="inline-flex items-center gap-2 text-muted hover:text-base text-sm font-medium mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Rooms
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl overflow-hidden h-80 md:h-[440px]" style={{ background: 'var(--bg-muted)' }}>
              <img
                src={room.images?.[activeImg]?.url || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'}
                alt={room.name} className="w-full h-full object-cover"
              />
            </div>
            {room.images?.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {room.images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`w-20 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                      activeImg === i ? 'border-gold-500' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}>
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="card card-body">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <span className={`badge ${typeConf.color} mb-2`}>{typeConf.label}</span>
                  <h1 className="font-display text-3xl font-semibold text-base">{room.name}</h1>
                  <div className="flex items-center gap-2 text-muted text-sm mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>Floor {room.floor} · Room {room.roomNumber}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-display text-2xl font-bold text-gold-600 dark:text-gold-400">{formatZAR(room.price?.base)}</p>
                  <p className="text-xs text-muted">per night · excl. VAT</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-4 border-y border-subtle-t mb-5">
                <div className="text-center">
                  <BedDouble className="w-5 h-5 text-gold-500 mx-auto mb-1" />
                  <p className="text-2xs text-muted uppercase tracking-wide">Bed</p>
                  <p className="text-sm font-semibold text-base capitalize">{room.bedConfiguration?.replace(/_/g, ' ')}</p>
                </div>
                <div className="text-center">
                  <Users className="w-5 h-5 text-gold-500 mx-auto mb-1" />
                  <p className="text-2xs text-muted uppercase tracking-wide">Capacity</p>
                  <p className="text-sm font-semibold text-base">{room.capacity?.adults} adults</p>
                </div>
                {room.size && (
                  <div className="text-center">
                    <Maximize2 className="w-5 h-5 text-gold-500 mx-auto mb-1" />
                    <p className="text-2xs text-muted uppercase tracking-wide">Size</p>
                    <p className="text-sm font-semibold text-base">{room.size} m²</p>
                  </div>
                )}
              </div>

              <p className="text-sub text-sm leading-relaxed mb-6">{room.description}</p>

              {room.amenities?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted mb-3">Amenities</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {room.amenities.map(a => {
                      const conf = AMENITY_MAP[a] || { label: capitalize(a) };
                      const Icon = conf.icon;
                      return (
                        <div key={a} className="flex items-center gap-2 text-sm text-sub">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          {Icon && <Icon className="w-3.5 h-3.5 text-muted" />}
                          <span>{conf.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Booking widget */}
          <div className="lg:col-span-1">
            <div className="card card-body sticky top-24">
              <h3 className="font-display text-xl font-semibold mb-5 text-base">Reserve This Room</h3>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Check-in Date</label>
                  <input type="date" min={new Date().toISOString().split('T')[0]}
                    value={bookForm.checkIn}
                    onChange={e => setBookForm(p => ({ ...p, checkIn: e.target.value }))}
                    className="form-input" />
                </div>
                <div>
                  <label className="form-label">Check-out Date</label>
                  <input type="date" min={bookForm.checkIn || new Date().toISOString().split('T')[0]}
                    value={bookForm.checkOut}
                    onChange={e => setBookForm(p => ({ ...p, checkOut: e.target.value }))}
                    className="form-input" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Adults</label>
                    <select value={bookForm.adults}
                      onChange={e => setBookForm(p => ({ ...p, adults: +e.target.value }))}
                      className="form-select">
                      {[...Array(room.capacity?.adults || 2)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Children</label>
                    <select value={bookForm.children}
                      onChange={e => setBookForm(p => ({ ...p, children: +e.target.value }))}
                      className="form-select">
                      {[0,1,2,3].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>

                {nights > 0 && (
                  <div className="rounded-xl p-4 space-y-2 text-sm border border-gold-200 dark:border-gold-800/40"
                    style={{ background: 'rgb(201 168 76 / 0.06)' }}>
                    <div className="flex justify-between text-sub">
                      <span>{formatZAR(room.price?.base)} × {nights} night{nights > 1 ? 's' : ''}</span>
                      <span>{formatZAR(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sub">
                      <span>VAT (15%)</span>
                      <span>{formatZAR(vat)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base border-t border-gold-200 dark:border-gold-800/40 pt-2">
                      <span>Total</span>
                      <span className="text-gold-600 dark:text-gold-400">{formatZAR(total)}</span>
                    </div>
                  </div>
                )}

                <button onClick={handleBook} disabled={room.status !== 'available'}
                  className="btn-gold w-full justify-center btn-lg">
                  {room.status !== 'available' ? 'Not Available' : 'Reserve Now'}
                  <ChevronRight className="w-4 h-4" />
                </button>

                {!token && (
                  <p className="text-xs text-center text-muted">
                    <Link to="/login" className="text-gold-600 dark:text-gold-400 font-semibold hover:underline">Sign in</Link>
                    {' '}to complete your reservation
                  </p>
                )}
              </div>

              <div className="mt-5 pt-5 border-t border-subtle-t space-y-2">
                {['Free cancellation up to 48hrs before arrival', 'No hidden fees', 'Best rate guaranteed'].map(item => (
                  <div key={item} className="flex items-center gap-2 text-xs text-muted">
                    <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
