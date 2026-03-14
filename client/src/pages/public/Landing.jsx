import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Wifi, Car, Utensils, Dumbbell, Waves, Shield, ArrowRight, ChevronRight, MapPin, Award, Users, BedDouble, TrendingUp, Leaf } from 'lucide-react';

const ROOM_HIGHLIGHTS = [
  { type: 'Standard',     price: 'R 1 800', img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600', desc: 'Refined comfort' },
  { type: 'Deluxe',       price: 'R 3 200', img: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600', desc: 'Elevated elegance' },
  { type: 'Suite',        price: 'R 5 500', img: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=600', desc: 'Expansive luxury' },
  { type: 'Presidential', price: 'R 18 000', img: 'https://images.unsplash.com/photo-1601701119533-fde78d59b949?w=600', desc: 'The pinnacle' },
];

const AMENITIES = [
  { icon: Waves,    label: 'Infinity Pool',    desc: 'Open 07:00 – 22:00' },
  { icon: Utensils, label: 'The Acacia',       desc: 'Award-winning restaurant' },
  { icon: Dumbbell, label: 'Fitness Centre',   desc: 'Open 24/7' },
  { icon: Wifi,     label: 'Complimentary Wi-Fi', desc: 'Throughout property' },
  { icon: Car,      label: 'Valet Parking',    desc: 'Included' },
  { icon: Leaf,     label: 'Spa & Wellness',   desc: 'World-class treatments' },
];

const STATS = [
  { icon: BedDouble,  value: '68',     label: 'Luxury Rooms & Suites' },
  { icon: Users,      value: '12k+',   label: 'Guests Hosted' },
  { icon: Award,      value: '5★',     label: 'Star Grading' },
  { icon: TrendingUp, value: '20+',    label: 'Years of Excellence' },
];

export default function Landing() {
  const [searchData, setSearchData] = useState({ checkIn: '', checkOut: '', guests: '1' });
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchData);
    navigate(`/rooms?${params}`);
  };

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-950/75 via-primary-950/45 to-primary-950/75 z-10" />
        <img
          src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1920"
          alt="Sable Grand Hotel"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 w-full">
          <div className="max-w-3xl">
            {/* Location badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-white text-sm mb-8">
              <MapPin className="w-3.5 h-3.5 text-gold-400" />
              <span className="font-medium">Sandton, Johannesburg · South Africa</span>
              <Star className="w-3 h-3 fill-gold-400 text-gold-400 ml-1" />
              <Star className="w-3 h-3 fill-gold-400 text-gold-400" />
              <Star className="w-3 h-3 fill-gold-400 text-gold-400" />
              <Star className="w-3 h-3 fill-gold-400 text-gold-400" />
              <Star className="w-3 h-3 fill-gold-400 text-gold-400" />
            </div>

            <h1 className="font-display text-5xl md:text-7xl font-semibold text-white leading-tight mb-6 text-balance">
              Where Africa's Soul<br />
              <span className="text-gold-400 italic">Meets Luxury</span>
            </h1>

            <p className="text-xl text-white/75 mb-10 leading-relaxed max-w-2xl">
              Experience world-class hospitality at the heart of Sandton. Every stay crafted with the warmth and spirit of South Africa.
            </p>

            {/* Search */}
            <form
              onSubmit={handleSearch}
              className="glass rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-end max-w-2xl"
            >
              <div className="flex-1 min-w-0">
                <label className="form-label !text-surface-700">Check-in</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={searchData.checkIn}
                  onChange={e => setSearchData(p => ({ ...p, checkIn: e.target.value }))}
                  className="form-input !py-2 text-sm"
                />
              </div>
              <div className="flex-1 min-w-0">
                <label className="form-label !text-surface-700">Check-out</label>
                <input
                  type="date"
                  min={searchData.checkIn || new Date().toISOString().split('T')[0]}
                  value={searchData.checkOut}
                  onChange={e => setSearchData(p => ({ ...p, checkOut: e.target.value }))}
                  className="form-input !py-2 text-sm"
                />
              </div>
              <div className="w-28">
                <label className="form-label !text-surface-700">Guests</label>
                <select
                  value={searchData.guests}
                  onChange={e => setSearchData(p => ({ ...p, guests: e.target.value }))}
                  className="form-select !py-2 text-sm"
                >
                  {[1,2,3,4,5,6].map(n => (
                    <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-gold btn-lg whitespace-nowrap flex-shrink-0">
                <ArrowRight className="w-4 h-4" /> Check Availability
              </button>
            </form>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
          <div className="w-5 h-8 border-2 border-white/30 rounded-full flex items-start justify-center p-1">
            <div className="w-1 h-2 bg-white/60 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <section className="bg-primary-950 py-10 border-y border-surface-800">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="text-center">
              <div className="w-11 h-11 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mx-auto mb-3">
                <Icon className="w-5 h-5 text-gold-400" />
              </div>
              <div className="font-display text-3xl font-semibold text-white mb-1">{value}</div>
              <div className="text-xs text-surface-400 tracking-wide">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Rooms ────────────────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: 'var(--bg-base)' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-gold-500 mb-3">Accommodations</p>
            <h2 className="font-display text-4xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Your Private Sanctuary
            </h2>
            <p className="text-sub max-w-xl mx-auto text-sm leading-relaxed">
              From intimate standard rooms to our iconic Presidential Suite — every space is an ode to African luxury.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ROOM_HIGHLIGHTS.map(room => (
              <Link
                key={room.type}
                to="/rooms"
                className="card overflow-hidden group hover:-translate-y-1.5 transition-all duration-300"
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={room.img} alt={room.type}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-950/70 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="font-display text-lg font-semibold text-white">{room.type}</p>
                    <p className="text-white/70 text-xs">{room.desc}</p>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted">From</p>
                    <p className="font-display text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {room.price}
                    </p>
                    <p className="text-xs text-muted">/night</p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-gold-50 dark:bg-gold-900/20 flex items-center justify-center group-hover:bg-gold-100 dark:group-hover:bg-gold-900/40 transition-colors">
                    <ChevronRight className="w-4 h-4 text-gold-600 dark:text-gold-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/rooms" className="btn-gold btn-lg">
              Explore All Rooms <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Amenities ────────────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: 'var(--bg-subtle)' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-gold-500 mb-3">Amenities</p>
            <h2 className="font-display text-4xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Everything, Perfected
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {AMENITIES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="card p-5 text-center hover:shadow-card-md hover:-translate-y-0.5 transition-all">
                <div className="w-11 h-11 rounded-2xl bg-gold-50 dark:bg-gold-900/20 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5 text-gold-600 dark:text-gold-400" />
                </div>
                <p className="font-semibold text-sm text-base">{label}</p>
                <p className="text-xs text-muted mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-primary-800 to-primary-950 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-30" />
        <div className="relative z-10 max-w-2xl mx-auto px-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-4">
            Experience Sable Grand
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-semibold mb-5 text-balance">
            Your Journey to Extraordinary Begins Here
          </h2>
          <p className="text-primary-200 text-base mb-10 leading-relaxed">
            Join thousands of discerning guests who have discovered the finest hospitality in Johannesburg.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-gold btn-lg shadow-glow-gold">
              Reserve Your Stay
            </Link>
            <Link to="/rooms" className="btn btn-lg border-2 border-white/20 text-white hover:bg-white/10 transition-colors">
              View Rooms <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
