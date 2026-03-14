const Booking  = require('../models/Booking');
const Room     = require('../models/Room');
const User     = require('../models/User');
const { ServiceRequest } = require('../models/Other');
const { sendSuccess, asyncHandler } = require('../utils/response');

const getAnalytics = asyncHandler(async (req, res) => {
  const now              = new Date();
  const startOfMonth     = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalRooms, availableRooms, bookedRooms, maintenanceRooms,
    totalGuests, totalBookings, monthlyBookings, lastMonthBookings,
    pendingBookings, activeBookings,
    monthlyRevenue, lastMonthRevenue, totalRevenue,
    pendingServices, recentBookings, upcomingCheckIns, upcomingCheckOuts,
    revenueByMonth, bookingsByType,
  ] = await Promise.all([
    Room.countDocuments({ isActive: true }),
    Room.countDocuments({ status: 'available', isActive: true }),
    Room.countDocuments({ status: 'booked', isActive: true }),
    Room.countDocuments({ status: 'maintenance', isActive: true }),
    User.countDocuments({ role: 'guest', isActive: true }),
    Booking.countDocuments(),
    Booking.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Booking.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
    Booking.countDocuments({ status: 'pending' }),
    Booking.countDocuments({ status: 'checked_in' }),
    Booking.aggregate([
      { $match: { createdAt: { $gte: startOfMonth }, status: { $nin: ['cancelled'] } } },
      { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } },
    ]),
    Booking.aggregate([
      { $match: { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }, status: { $nin: ['cancelled'] } } },
      { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } },
    ]),
    Booking.aggregate([
      { $match: { status: { $nin: ['cancelled'] } } },
      { $group: { _id: null, total: { $sum: '$pricing.paidAmount' } } },
    ]),
    ServiceRequest.countDocuments({ status: 'pending' }),
    Booking.find()
      .populate('guest', 'firstName lastName email')
      .populate('room', 'roomNumber name type')
      .sort({ createdAt: -1 }).limit(8),
    Booking.find({
      checkInDate: { $gte: new Date(now.setHours(0,0,0,0)), $lte: new Date(now.setHours(23,59,59,999)) },
      status: 'confirmed',
    }).populate('guest', 'firstName lastName').populate('room', 'roomNumber name'),
    Booking.find({
      checkOutDate: { $gte: new Date(new Date().setHours(0,0,0,0)), $lte: new Date(new Date().setHours(23,59,59,999)) },
      status: 'checked_in',
    }).populate('guest', 'firstName lastName').populate('room', 'roomNumber name'),
    Booking.aggregate([
      { $match: { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) }, status: { $nin: ['cancelled'] } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$pricing.totalAmount' }, bookings: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Booking.aggregate([
      { $match: { status: { $nin: ['cancelled'] } } },
      { $lookup: { from: 'rooms', localField: 'room', foreignField: '_id', as: 'roomData' } },
      { $unwind: '$roomData' },
      { $group: { _id: '$roomData.type', count: { $sum: 1 }, revenue: { $sum: '$pricing.totalAmount' } } },
    ]),
  ]);

  const occupancyRate       = totalRooms > 0 ? Math.round((bookedRooms / totalRooms) * 100) : 0;
  const currentMonthRevenue = monthlyRevenue[0]?.total || 0;
  const prevMonthRevenue    = lastMonthRevenue[0]?.total || 0;
  const revenueGrowth       = prevMonthRevenue > 0 ? Math.round(((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100) : 0;
  const bookingGrowth       = lastMonthBookings > 0 ? Math.round(((monthlyBookings - lastMonthBookings) / lastMonthBookings) * 100) : 0;

  return sendSuccess(res, {
    overview: { totalRooms, availableRooms, bookedRooms, maintenanceRooms, occupancyRate, totalGuests, totalBookings, activeBookings, pendingBookings, pendingServices },
    revenue:  { total: Math.round((totalRevenue[0]?.total || 0) * 100) / 100, thisMonth: Math.round(currentMonthRevenue * 100) / 100, lastMonth: Math.round(prevMonthRevenue * 100) / 100, growth: revenueGrowth },
    bookings: { thisMonth: monthlyBookings, lastMonth: lastMonthBookings, growth: bookingGrowth },
    revenueByMonth, bookingsByType, recentBookings, upcomingCheckIns, upcomingCheckOuts,
  }, 'Dashboard analytics loaded');
});

const getReceptionDashboard = asyncHandler(async (req, res) => {
  const today      = new Date();
  const startOfDay = new Date(today.setHours(0,0,0,0));
  const endOfDay   = new Date(today.setHours(23,59,59,999));

  const [todayCheckIns, todayCheckOuts, availableRooms, pendingBookings] = await Promise.all([
    Booking.find({ checkInDate: { $gte: startOfDay, $lte: endOfDay }, status: 'confirmed' })
      .populate('guest', 'firstName lastName email phone')
      .populate('room', 'roomNumber name type floor'),
    Booking.find({ checkOutDate: { $gte: startOfDay, $lte: endOfDay }, status: 'checked_in' })
      .populate('guest', 'firstName lastName email phone')
      .populate('room', 'roomNumber name type floor'),
    Room.find({ status: 'available', isActive: true }).sort({ roomNumber: 1 }),
    Booking.find({ status: 'pending' })
      .populate('guest', 'firstName lastName email')
      .populate('room', 'roomNumber name type')
      .sort({ createdAt: -1 }).limit(10),
  ]);

  return sendSuccess(res, {
    todayCheckIns, todayCheckOuts, availableRooms, pendingBookings,
    stats: {
      checkInsToday:   todayCheckIns.length,
      checkOutsToday:  todayCheckOuts.length,
      availableRooms:  availableRooms.length,
      pendingBookings: pendingBookings.length,
    },
  }, 'Reception dashboard loaded');
});

module.exports = { getAnalytics, getReceptionDashboard };
