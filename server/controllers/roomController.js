const Room    = require('../models/Room');
const Booking = require('../models/Booking');
const { sendSuccess, sendError, sendPaginated, asyncHandler, getPaginationOptions, getSortOptions } = require('../utils/response');

const getRooms = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);
  const sort  = getSortOptions(req.query, { 'price.base': 1 });
  const filter = { isActive: true };

  if (req.query.type)   filter.type   = req.query.type;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.minPrice || req.query.maxPrice) {
    filter['price.base'] = {};
    if (req.query.minPrice) filter['price.base'].$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) filter['price.base'].$lte = Number(req.query.maxPrice);
  }
  if (req.query.capacity) filter['capacity.adults'] = { $gte: Number(req.query.capacity) };
  if (req.query.amenities) filter.amenities = { $all: req.query.amenities.split(',') };
  if (req.query.search) {
    filter.$or = [
      { name:       { $regex: req.query.search, $options: 'i' } },
      { roomNumber: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [rooms, total] = await Promise.all([
    Room.find(filter).sort(sort).skip(skip).limit(limit),
    Room.countDocuments(filter),
  ]);
  return sendPaginated(res, rooms, total, page, limit, 'Rooms retrieved');
});

const getRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return sendError(res, 'Room not found', 404);
  return sendSuccess(res, { room });
});

const createRoom = asyncHandler(async (req, res) => {
  const room = await Room.create(req.body);
  return sendSuccess(res, { room }, 'Room created successfully', 201);
});

const updateRoom = asyncHandler(async (req, res) => {
  const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!room) return sendError(res, 'Room not found', 404);
  return sendSuccess(res, { room }, 'Room updated successfully');
});

const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return sendError(res, 'Room not found', 404);

  const active = await Booking.findOne({ room: req.params.id, status: { $in: ['confirmed','checked_in'] } });
  if (active) return sendError(res, 'Cannot delete a room with active bookings', 400);

  await room.deleteOne();
  return sendSuccess(res, {}, 'Room deleted successfully');
});

const checkAvailability = asyncHandler(async (req, res) => {
  const { checkIn, checkOut, type } = req.query;
  if (!checkIn || !checkOut) return sendError(res, 'Check-in and check-out dates are required', 400);

  const bookedIds = await Booking.distinct('room', {
    status: { $in: ['confirmed','checked_in'] },
    $or: [{ checkInDate: { $lt: new Date(checkOut) }, checkOutDate: { $gt: new Date(checkIn) } }],
  });

  const filter = { _id: { $nin: bookedIds }, status: { $ne: 'maintenance' }, isActive: true };
  if (type) filter.type = type;

  const rooms = await Room.find(filter).sort({ 'price.base': 1 });
  return sendSuccess(res, { rooms, count: rooms.length }, 'Available rooms retrieved');
});

const updateRoomStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const room = await Room.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!room) return sendError(res, 'Room not found', 404);
  return sendSuccess(res, { room }, 'Room status updated');
});

module.exports = { getRooms, getRoom, createRoom, updateRoom, deleteRoom, checkAvailability, updateRoomStatus };
