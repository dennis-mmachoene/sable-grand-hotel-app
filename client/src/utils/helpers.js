import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

// ─── South Africa Configuration ──────────────────────────────────────────────
export const SA_TIMEZONE = 'Africa/Johannesburg';
export const SA_LOCALE   = 'en-ZA';
export const SA_CURRENCY = 'ZAR';

// ─── Date & Time ─────────────────────────────────────────────────────────────
export const toSAST = (date) => {
  if (!date) return null;
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return toZonedTime(d, SA_TIMEZONE);
  } catch { return null; }
};

export const formatDate = (date, fmt = 'dd MMM yyyy') => {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, fmt);
  } catch { return '—'; }
};

export const formatDateTime = (date) => formatDate(date, 'dd MMM yyyy, HH:mm');
export const formatTime     = (date) => formatDate(date, 'HH:mm');
export const formatDateLong = (date) => formatDate(date, 'EEEE, d MMMM yyyy');

export const timeAgo = (date) => {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch { return '—'; }
};

// ─── Currency: ZAR as primary, optional USD conversion ───────────────────────
const ZAR_FORMATTER = new Intl.NumberFormat(SA_LOCALE, {
  style: 'currency',
  currency: 'ZAR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Approximate exchange rate (production would use live API)
export const USD_TO_ZAR = 18.5;

export const formatCurrency = (amount, currency = 'ZAR') => {
  if (amount == null || isNaN(amount)) return '—';
  if (currency === 'USD') return USD_FORMATTER.format(amount);
  return ZAR_FORMATTER.format(amount);
};

export const formatZAR = (amount) => formatCurrency(amount, 'ZAR');
export const formatUSD = (amount) => formatCurrency(amount, 'USD');

// Convert ZAR ↔ USD
export const zarToUsd = (zar) => zar / USD_TO_ZAR;
export const usdToZar = (usd) => usd * USD_TO_ZAR;

// ─── String helpers ───────────────────────────────────────────────────────────
export const capitalize   = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ') : '';
export const truncate     = (str, len = 60) => str && str.length > len ? str.slice(0, len) + '…' : str || '';
export const getInitials  = (firstName, lastName) =>
  `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();
export const slugify      = (str) => str?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || '';

// ─── Status configs (with ZAR-aware labels) ───────────────────────────────────
export const bookingStatusConfig = {
  pending:    { label: 'Pending',    className: 'badge-yellow', dot: '#d97706' },
  confirmed:  { label: 'Confirmed',  className: 'badge-blue',   dot: '#4566bf' },
  checked_in: { label: 'Checked In', className: 'badge-green',  dot: '#059669' },
  completed:  { label: 'Completed',  className: 'badge-gray',   dot: '#857E76' },
  cancelled:  { label: 'Cancelled',  className: 'badge-red',    dot: '#e11d48' },
  no_show:    { label: 'No Show',    className: 'badge-red',    dot: '#e11d48' },
};

export const paymentStatusConfig = {
  unpaid:   { label: 'Unpaid',   className: 'badge-red'    },
  partial:  { label: 'Partial',  className: 'badge-yellow' },
  paid:     { label: 'Paid',     className: 'badge-green'  },
  refunded: { label: 'Refunded', className: 'badge-purple' },
};

export const roomStatusConfig = {
  available:   { label: 'Available',   className: 'badge-green'  },
  booked:      { label: 'Occupied',    className: 'badge-blue'   },
  maintenance: { label: 'Maintenance', className: 'badge-yellow' },
  cleaning:    { label: 'Cleaning',    className: 'badge-purple' },
};

export const roomTypeConfig = {
  standard:     { label: 'Standard',     color: 'badge-gray'   },
  deluxe:       { label: 'Deluxe',       color: 'badge-blue'   },
  suite:        { label: 'Suite',        color: 'badge-purple' },
  presidential: { label: 'Presidential', color: 'badge-gold'   },
};

export const roleConfig = {
  admin:         { label: 'Admin',          className: 'badge-red'    },
  manager:       { label: 'Manager',        className: 'badge-purple' },
  receptionist:  { label: 'Receptionist',   className: 'badge-blue'   },
  housekeeping:  { label: 'Housekeeping',   className: 'badge-green'  },
  service_staff: { label: 'Service Staff',  className: 'badge-yellow' },
  guest:         { label: 'Guest',          className: 'badge-gray'   },
};

export const serviceTypeLabels = {
  room_cleaning:  'Room Cleaning',
  laundry:        'Laundry',
  food_delivery:  'Room Service',
  maintenance:    'Maintenance',
  extra_towels:   'Extra Towels',
  extra_pillows:  'Extra Pillows',
  wake_up_call:   'Wake-up Call',
  transportation: 'Transportation',
  concierge:      'Concierge',
  spa:            'Spa Treatment',
  other:          'Other',
};

export const notificationTypeConfig = {
  booking:      { label: 'Booking',    color: 'badge-blue'   },
  check_in:     { label: 'Check-in',   color: 'badge-green'  },
  check_out:    { label: 'Check-out',  color: 'badge-yellow' },
  payment:      { label: 'Payment',    color: 'badge-gold'   },
  cancellation: { label: 'Cancelled',  color: 'badge-red'    },
  service:      { label: 'Service',    color: 'badge-purple' },
  system:       { label: 'System',     color: 'badge-gray'   },
  alert:        { label: 'Alert',      color: 'badge-red'    },
};

export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── South African phone formatting ──────────────────────────────────────────
export const formatSAPhone = (phone) => {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('27') && digits.length === 11) {
    return `+27 ${digits.slice(2, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 10 && digits.startsWith('0')) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return phone;
};
