const { ServiceRequest, HotelInfo } = require('../models/Other');
const Notification = require('../models/Notification');
const { sendSuccess, sendError, sendPaginated, asyncHandler, getPaginationOptions } = require('../utils/response');

const getServiceRequests = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);
  const filter = {};
  if (req.query.status)      filter.status      = req.query.status;
  if (req.query.serviceType) filter.serviceType = req.query.serviceType;
  if (req.query.priority)    filter.priority    = req.query.priority;
  if (req.user.role === 'guest') filter.guest = req.user._id;

  const [requests, total] = await Promise.all([
    ServiceRequest.find(filter)
      .populate('guest', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName role')
      .sort({ createdAt: -1 }).skip(skip).limit(limit),
    ServiceRequest.countDocuments(filter),
  ]);
  return sendPaginated(res, requests, total, page, limit, 'Service requests retrieved');
});

const createServiceRequest = asyncHandler(async (req, res) => {
  const { serviceType, title, description, roomNumber, priority, scheduledFor } = req.body;
  const request = await ServiceRequest.create({
    guest: req.user._id, serviceType, title, description,
    roomNumber, priority: priority || 'normal', scheduledFor, status: 'pending',
  });

  // Notify service staff
  await Notification.createForRole(req.app, {
    role: 'housekeeping',
    type: 'service',
    title: 'New Service Request',
    message: `${title} — Room ${roomNumber} — Priority: ${priority || 'normal'}`,
    link: '/admin/services',
  });

  return sendSuccess(res, { request }, 'Service request submitted', 201);
});

const updateServiceRequest = asyncHandler(async (req, res) => {
  const request = await ServiceRequest.findByIdAndUpdate(
    req.params.id, req.body, { new: true, runValidators: true }
  ).populate('assignedTo', 'firstName lastName');
  if (!request) return sendError(res, 'Service request not found', 404);
  if (req.body.status === 'completed') { request.completedAt = new Date(); await request.save(); }
  return sendSuccess(res, { request }, 'Service request updated');
});

const deleteServiceRequest = asyncHandler(async (req, res) => {
  const request = await ServiceRequest.findByIdAndDelete(req.params.id);
  if (!request) return sendError(res, 'Service request not found', 404);
  return sendSuccess(res, {}, 'Service request deleted');
});

const getHotelInfo = asyncHandler(async (req, res) => {
  let info = await HotelInfo.findOne({ isActive: true });
  if (!info) info = await HotelInfo.create({ name: 'Sable Grand' });
  return sendSuccess(res, { hotelInfo: info });
});

const updateHotelInfo = asyncHandler(async (req, res) => {
  let info = await HotelInfo.findOne({ isActive: true });
  if (!info) info = await HotelInfo.create(req.body);
  else { Object.assign(info, req.body); await info.save(); }
  return sendSuccess(res, { hotelInfo: info }, 'Hotel information updated');
});

module.exports = { getServiceRequests, createServiceRequest, updateServiceRequest, deleteServiceRequest, getHotelInfo, updateHotelInfo };
