import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, BedDouble, Users, DollarSign,
  CalendarCheck, ClipboardList, ArrowUpRight, RefreshCw,
  CheckCircle2, Clock, LogIn, LogOut, Wifi, Building2,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { dashboardService } from '../../services/api';
import {
  formatZAR, formatDate, bookingStatusConfig, paymentStatusConfig, MONTHS,
} from '../../utils/helpers';
import { Link } from 'react-router-dom';
import useThemeStore from '../../store/themeStore';

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 shadow-card-md text-xs">
      <p className="font-semibold text-base mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, change, sub, iconBg, iconColor }) => (
  <div className="stat-card">
    <div className="flex-1 min-w-0">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value ?? '—'}</p>
      {sub && <p className="text-xs mt-0.5 text-muted">{sub}</p>}
      {change !== undefined && (
        <div className={`stat-change ${change >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
          {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(change)}% vs last month
        </div>
      )}
    </div>
    <div className={`stat-icon ${iconBg}`}>
      <Icon className={`w-5 h-5 ${iconColor}`} />
    </div>
  </div>
);

const PIE_COLORS = ['#243d87','#C9A84C','#10b981','#f59e0b','#e11d48'];

export default function AdminDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useThemeStore();
  const isDark    = theme === 'dark';

  const gridColor  = isDark ? '#2D3651' : '#EEECE7';
  const axisColor  = isDark ? '#6A6460' : '#A8A29A';

  const load = async () => {
    setLoading(true);
    try {
      const { data: d } = await dashboardService.getAnalytics();
      setData(d);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 h-72 skeleton rounded-2xl" />
        <div className="h-72 skeleton rounded-2xl" />
      </div>
    </div>
  );

  const {
    overview = {}, revenue = {}, bookings: bk = {},
    revenueByMonth = [], bookingsByType = [],
    recentBookings = [], upcomingCheckIns = [], upcomingCheckOuts = [],
  } = data || {};

  const revenueChart = revenueByMonth.map(r => ({
    month: MONTHS[(r._id?.month || 1) - 1],
    revenue: Math.round(r.revenue),
    bookings: r.bookings,
  }));

  const pieData = bookingsByType.map((b, i) => ({
    name: b._id?.charAt(0).toUpperCase() + b._id?.slice(1) || 'Other',
    value: b.count,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="text-xs text-muted mt-0.5">
            All amounts in South African Rand (ZAR) · SAST
          </p>
        </div>
        <button onClick={load} className="btn-secondary btn-sm gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign} label="Monthly Revenue"
          value={formatZAR(revenue.thisMonth)} change={revenue.growth}
          iconBg="bg-gold-50 dark:bg-gold-900/20" iconColor="text-gold-600 dark:text-gold-400"
        />
        <StatCard
          icon={CalendarCheck} label="Bookings This Month"
          value={bk.thisMonth} change={bk.growth}
          iconBg="bg-emerald-50 dark:bg-emerald-900/20" iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          icon={BedDouble} label="Occupancy Rate"
          value={`${overview.occupancyRate ?? 0}%`}
          sub={`${overview.bookedRooms ?? 0} of ${overview.totalRooms ?? 0} rooms`}
          iconBg="bg-blue-50 dark:bg-blue-900/20" iconColor="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          icon={Users} label="Total Guests"
          value={overview.totalGuests?.toLocaleString('en-ZA')}
          iconBg="bg-purple-50 dark:bg-purple-900/20" iconColor="text-purple-600 dark:text-purple-400"
        />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={BedDouble} label="Available Rooms"
          value={overview.availableRooms}
          iconBg="bg-emerald-50 dark:bg-emerald-900/20" iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          icon={Clock} label="Pending Bookings"
          value={overview.pendingBookings}
          iconBg="bg-amber-50 dark:bg-amber-900/20" iconColor="text-amber-600 dark:text-amber-400"
        />
        <StatCard
          icon={CheckCircle2} label="Active Stays"
          value={overview.activeBookings}
          iconBg="bg-blue-50 dark:bg-blue-900/20" iconColor="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          icon={ClipboardList} label="Service Requests"
          value={overview.pendingServices}
          iconBg="bg-rose-50 dark:bg-rose-900/20" iconColor="text-rose-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="xl:col-span-2 card card-body">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="section-title">Revenue Trend</h3>
              <p className="text-xs text-muted mt-0.5">6-month performance</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">Total Revenue</p>
              <p className="font-display text-lg font-bold text-gold-600 dark:text-gold-400">
                {formatZAR(revenue.total)}
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueChart} margin={{ top: 0, right: 4, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#C9A84C" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false}
                tickFormatter={v => `R${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip formatter={formatZAR} />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#C9A84C" strokeWidth={2.5}
                fill="url(#revGrad)" dot={{ r: 4, fill: '#C9A84C', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bookings by Room Type */}
        <div className="card card-body">
          <h3 className="section-title mb-5">By Room Type</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={70}
                    paddingAngle={4} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      <span className="text-sub">{d.name}</span>
                    </div>
                    <span className="font-semibold text-base">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-muted">No data yet</div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="section-title">Recent Bookings</h3>
            <Link to="/admin/bookings" className="text-xs font-semibold text-gold-600 dark:text-gold-400 hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-subtle-t">
            {recentBookings.slice(0, 6).map(b => {
              const sc = bookingStatusConfig[b.status] || {};
              return (
                <div key={b._id} className="px-6 py-3.5 flex items-center gap-3 hover:bg-subtle transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-800 dark:to-primary-900 text-primary-700 dark:text-primary-300 font-semibold text-xs flex items-center justify-center flex-shrink-0">
                    {b.guest?.firstName?.[0]}{b.guest?.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-base">
                      {b.guest?.firstName} {b.guest?.lastName}
                    </p>
                    <p className="text-xs text-muted truncate">{b.room?.name} · {b.bookingReference}</p>
                  </div>
                  <span className={`badge ${sc.className}`}>{sc.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="section-title">Today's Activity</h3>
          </div>
          <div className="card-body space-y-5">
            {/* Arrivals */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                  <LogIn className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-base">Arrivals ({upcomingCheckIns.length})</p>
              </div>
              {upcomingCheckIns.length === 0 ? (
                <p className="text-sm text-muted pl-8">No arrivals scheduled</p>
              ) : upcomingCheckIns.slice(0, 3).map(b => (
                <div key={b._id} className="flex items-center justify-between py-2.5 border-b border-subtle-t last:border-0 pl-8">
                  <div>
                    <p className="text-sm font-medium text-base">{b.guest?.firstName} {b.guest?.lastName}</p>
                    <p className="text-xs text-muted">Room {b.room?.roomNumber}</p>
                  </div>
                  <span className="badge badge-green">Arriving</span>
                </div>
              ))}
            </div>

            {/* Departures */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                  <LogOut className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-sm font-semibold text-base">Departures ({upcomingCheckOuts.length})</p>
              </div>
              {upcomingCheckOuts.length === 0 ? (
                <p className="text-sm text-muted pl-8">No departures scheduled</p>
              ) : upcomingCheckOuts.slice(0, 3).map(b => (
                <div key={b._id} className="flex items-center justify-between py-2.5 border-b border-subtle-t last:border-0 pl-8">
                  <div>
                    <p className="text-sm font-medium text-base">{b.guest?.firstName} {b.guest?.lastName}</p>
                    <p className="text-xs text-muted">Room {b.room?.roomNumber}</p>
                  </div>
                  <span className="badge badge-yellow">Departing</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
