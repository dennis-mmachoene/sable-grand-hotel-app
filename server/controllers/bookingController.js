const Booking      = require('../models/Booking');
const Room         = require('../models/Room');
const Notification = require('../models/Notification');
const { sendSuccess, sendError, sendPaginated, asyncHandler, getPaginationOptions, getSortOptions } = require('../utils/response');

const VAT_RATE = 0.15; // South Africa

const createBooking = asyncHandler(async (req, res) => {
  const { roomId, checkInDate, checkOutDate, guests, specialRequests, paymentMethod, source } = req.body;

  const room = await Room.findById(roomId);
  if (!room)                        return sendError(res, 'Room not found', 404);
  if (room.status === 'maintenance') return sendError(res, 'Room is under maintenance', 400);

  const conflict = await Booking.findOne({
    room: roomId,
    status: { $in: ['confirmed','checked_in'] },
    $or: [{ checkInDate: { $lt: new Date(checkOutDate) }, checkOutDate: { $gt: new Date(checkInDate) } }],
  });
  if (conflict) return sendError(res, 'Room is not available for the selected dates', 409);

  const checkIn  = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const nights   = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  if (nights < 1) return sendError(res, 'Check-out must be after check-in', 400);

  const roomRate   = room.price.base * nights;
  const taxes      = Math.round(roomRate * VAT_RATE * 100) / 100;
  const totalAmount = Math.round((roomRate + taxes) * 100) / 100;
  const guestId    = req.body.guestId || req.user._id;

  const booking = await Booking.create({
    guest:          guestId,
    room:           roomId,
    checkInDate,
    checkOutDate,
    guests:         guests || { adults: 1, children: 0 },
    pricing:        { roomRate, taxes, totalAmount },
    specialRequests,
    paymentMethod:  paymentMethod || null,
    source:         source || (req.user.role === 'guest' ? 'website' : 'reception'),
    handledBy:      req.user.role !== 'guest' ? req.user._id : undefined,
    status:         req.user.role === 'guest' ? 'pending' : 'confirmed',
  });

  await Room.findByIdAndUpdate(roomId, { status: 'booked' });

  const populated = await Booking.findById(booking._id)
    .populate('room guest', 'roomNumber name firstName lastName email phone');

  // Notify admins/managers of new booking
  await Notification.createForRole(req.app, {
    role: 'admin',
    type: 'booking',
    title: 'New Booking',
    message: `${req.user.firstName} ${req.user.lastName} booked ${room.name} — ${populated.bookingReference}`,
    link: '/admin/bookings',
    metadata: { bookingId: booking._id },
  });
  await Notification.createForRole(req.app, {
    role: 'manager',
    type: 'booking',
    title: 'New Booking',
    message: `${req.user.firstName} ${req.user.lastName} booked ${room.name} — ${populated.bookingReference}`,
    link: '/admin/bookings',
    metadata: { bookingId: booking._id },
  });

  return sendSuccess(res, { booking: populated }, 'Booking created successfully', 201);
});

const getBookings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);
  const sort   = getSortOptions(req.query, { createdAt: -1 });
  const filter = {};

  if (req.query.status)        filter.status        = req.query.status;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
  if (req.query.dateFrom)      filter.checkInDate   = { $gte: new Date(req.query.dateFrom) };
  if (req.query.dateTo)        filter.checkInDate   = { ...filter.checkInDate, $lte: new Date(req.query.dateTo) };
  if (req.query.search) {
    filter.$or = [{ bookingReference: { $regex: req.query.search, $options: 'i' } }];
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('guest', 'firstName lastName email phone')
      .populate('room', 'roomNumber name type floor')
      .sort(sort).skip(skip).limit(limit),
    Booking.countDocuments(filter),
  ]);
  return sendPaginated(res, bookings, total, page, limit, 'Bookings retrieved');
});

const getMyBookings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);
  const filter = { guest: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('room', 'roomNumber name type floor images price')
      .sort({ createdAt: -1 }).skip(skip).limit(limit),
    Booking.countDocuments(filter),
  ]);
  return sendPaginated(res, bookings, total, page, limit, 'Your bookings retrieved');
});

const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('guest', 'firstName lastName email phone idType')
    .populate('room')
    .populate('handledBy', 'firstName lastName role');

  if (!booking) return sendError(res, 'Booking not found', 404);
  if (req.user.role === 'guest' && booking.guest._id.toString() !== req.user._id.toString()) {
    return sendError(res, 'Not authorised to view this booking', 403);
  }
  return sendSuccess(res, { booking });
});

const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  const booking = await Booking.findById(req.params.id).populate('room').populate('guest', 'firstName lastName');
  if (!booking) return sendError(res, 'Booking not found', 404);

  const prevStatus = booking.status;
  booking.status = status;
  if (notes) booking.internalNotes = notes;

  if (status === 'checked_in') {
    booking.actualCheckIn = new Date();
    await Room.findByIdAndUpdate(booking.room._id, { status: 'booked' });

    // Notify guest of check-in
    await Notification.createAndBroadcast(req.app, {
      recipient: booking.guest._id,
      type: 'check_in',
      title: 'Welcome to Sable Grand!',
      message: `Your check-in for ${booking.room.name} is confirmed. Enjoy your stay!`,
      metadata: { bookingId: booking._id },
    });
  }

  if (status === 'completed') {
    booking.actualCheckOut = new Date();
    await Room.findByIdAndUpdate(booking.room._id, { status: 'available' });

    // Notify guest of checkout
    await Notification.createAndBroadcast(req.app, {
      recipient: booking.guest._id,
      type: 'check_out',
      title: 'Thank you for your stay!',
      message: `We hope you enjoyed your stay at Sable Grand. We look forward to welcoming you back.`,
      metadata: { bookingId: booking._id },
    });
  }

  if (status === 'confirmed' && prevStatus === 'pending') {
    await Notification.createAndBroadcast(req.app, {
      recipient: booking.guest._id,
      type: 'booking',
      title: 'Booking Confirmed',
      message: `Your booking ${booking.bookingReference} has been confirmed. Check-in: ${booking.checkInDate?.toDateString()}.`,
      metadata: { bookingId: booking._id },
    });
  }

  await booking.save();
  return sendSuccess(res, { booking }, `Booking status updated to ${status}`);
});

const cancelBooking = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const booking = await Booking.findById(req.params.id).populate('guest', 'firstName lastName');
  if (!booking) return sendError(res, 'Booking not found', 404);
  if (['completed','cancelled'].includes(booking.status)) return sendError(res, 'This booking cannot be cancelled', 400);
  if (req.user.role === 'guest' && booking.guest._id.toString() !== req.user._id.toString()) {
    return sendError(res, 'Not authorised', 403);
  }

  booking.status = 'cancelled';
  booking.cancellation = {
    cancelledAt:  new Date(),
    cancelledBy:  req.user._id,
    reason:       reason || 'Cancelled by user',
    refundAmount: booking.pricing.paidAmount,
    refundStatus: booking.pricing.paidAmount > 0 ? 'pending' : null,
  };
  await booking.save();

  if (['confirmed','checked_in'].includes(booking.status)) {
    await Room.findByIdAndUpdate(booking.room, { status: 'available' });
  }

  // Notify admins
  await Notification.createForRole(req.app, {
    role: 'admin',
    type: 'cancellation',
    title: 'Booking Cancelled',
    message: `${booking.guest?.firstName} ${booking.guest?.lastName} cancelled booking ${booking.bookingReference}.`,
    link: '/admin/bookings',
  });

  return sendSuccess(res, { booking }, 'Booking cancelled successfully');
});

const updatePayment = asyncHandler(async (req, res) => {
  const { paidAmount, paymentMethod, paymentStatus } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) return sendError(res, 'Booking not found', 404);

  if (paidAmount !== undefined) booking.pricing.paidAmount = paidAmount;
  if (paymentMethod) booking.paymentMethod = paymentMethod;
  if (paymentStatus) booking.paymentStatus = paymentStatus;

  if (paidAmount !== undefined) {
    if (paidAmount === 0)                                    booking.paymentStatus = 'unpaid';
    else if (paidAmount >= booking.pricing.totalAmount)      booking.paymentStatus = 'paid';
    else                                                     booking.paymentStatus = 'partial';
  }

  await booking.save();

  if (booking.paymentStatus === 'paid') {
    await Notification.createAndBroadcast(req.app, {
      recipient: booking.guest,
      type: 'payment',
      title: 'Payment Received',
      message: `Payment of R ${paidAmount?.toFixed(2)} received for booking ${booking.bookingReference}. Thank you!`,
      metadata: { bookingId: booking._id },
    });
  }

  return sendSuccess(res, { booking }, 'Payment updated');
});

module.exports = { createBooking, getBookings, getMyBookings, getBooking, updateBookingStatus, cancelBooking, updatePayment };
