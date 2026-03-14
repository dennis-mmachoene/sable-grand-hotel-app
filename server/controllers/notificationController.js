const Notification = require('../models/Notification');
const { sendSuccess, asyncHandler, getPaginationOptions } = require('../utils/response');

const getNotifications = asyncHandler(async (req, res) => {
  const { limit } = getPaginationOptions(req.query);
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 50));
  const unreadCount = await Notification.countDocuments({ recipient: req.user._id, read: false });
  return sendSuccess(res, { notifications, unreadCount });
});

const markRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { read: true }
  );
  return sendSuccess(res, {}, 'Notification marked as read');
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
  return sendSuccess(res, {}, 'All notifications marked as read');
});

const deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
  return sendSuccess(res, {}, 'Notification deleted');
});

module.exports = { getNotifications, markRead, markAllRead, deleteNotification };
