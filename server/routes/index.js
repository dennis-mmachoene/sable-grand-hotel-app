const express = require('express');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

// ─── Auth ─────────────────────────────────────────────────────────────────────
const { register, login, getMe, updateProfile, changePassword } = require('../controllers/authController');
const authRouter = express.Router();
authRouter.post('/register', register);
authRouter.post('/login',    login);
authRouter.get('/me',        protect, getMe);
authRouter.put('/me',        protect, updateProfile);
authRouter.put('/change-password', protect, changePassword);

// ─── Rooms ────────────────────────────────────────────────────────────────────
const { getRooms, getRoom, createRoom, updateRoom, deleteRoom, checkAvailability, updateRoomStatus } = require('../controllers/roomController');
const roomRouter = express.Router();
roomRouter.get('/availability',    checkAvailability);
roomRouter.get('/',                getRooms);
roomRouter.get('/:id',             getRoom);
roomRouter.post('/',               protect, authorize('admin','manager'), createRoom);
roomRouter.put('/:id',             protect, authorize('admin','manager'), updateRoom);
roomRouter.delete('/:id',          protect, authorize('admin'), deleteRoom);
roomRouter.patch('/:id/status',    protect, authorize('admin','manager','receptionist'), updateRoomStatus);

// ─── Bookings ─────────────────────────────────────────────────────────────────
const { createBooking, getBookings, getMyBookings, getBooking, updateBookingStatus, cancelBooking, updatePayment } = require('../controllers/bookingController');
const bookingRouter = express.Router();
bookingRouter.use(protect);
bookingRouter.get('/my',           getMyBookings);
bookingRouter.post('/',            createBooking);
bookingRouter.get('/',             authorize('admin','manager','receptionist'), getBookings);
bookingRouter.get('/:id',          getBooking);
bookingRouter.patch('/:id/status', authorize('admin','manager','receptionist'), updateBookingStatus);
bookingRouter.patch('/:id/cancel', cancelBooking);
bookingRouter.patch('/:id/payment',authorize('admin','manager','receptionist'), updatePayment);

// ─── Users ────────────────────────────────────────────────────────────────────
const { getUsers, getUser, createUser, updateUser, deleteUser, toggleUserStatus } = require('../controllers/userController');
const userRouter = express.Router();
userRouter.use(protect);
userRouter.get('/',                   authorize('admin','manager'), getUsers);
userRouter.get('/:id',                authorize('admin','manager'), getUser);
userRouter.post('/',                  authorize('admin','manager'), createUser);
userRouter.put('/:id',                authorize('admin','manager'), updateUser);
userRouter.delete('/:id',             authorize('admin'), deleteUser);
userRouter.patch('/:id/toggle-status',authorize('admin','manager'), toggleUserStatus);

// ─── Services ─────────────────────────────────────────────────────────────────
const { getServiceRequests, createServiceRequest, updateServiceRequest, deleteServiceRequest, getHotelInfo, updateHotelInfo } = require('../controllers/serviceController');
const serviceRouter = express.Router();
serviceRouter.get('/hotel-info',     getHotelInfo);
serviceRouter.put('/hotel-info',     protect, authorize('admin','manager'), updateHotelInfo);
serviceRouter.get('/',               protect, getServiceRequests);
serviceRouter.post('/',              protect, createServiceRequest);
serviceRouter.put('/:id',            protect, authorize('admin','manager','receptionist','housekeeping','service_staff'), updateServiceRequest);
serviceRouter.delete('/:id',         protect, authorize('admin','manager'), deleteServiceRequest);

// ─── Dashboard ────────────────────────────────────────────────────────────────
const { getAnalytics, getReceptionDashboard } = require('../controllers/dashboardController');
const dashboardRouter = express.Router();
dashboardRouter.use(protect);
dashboardRouter.get('/analytics',    authorize('admin','manager'), getAnalytics);
dashboardRouter.get('/reception',    authorize('admin','manager','receptionist'), getReceptionDashboard);

// ─── Chatbot ──────────────────────────────────────────────────────────────────
const { sendMessage, getChatHistory } = require('../controllers/chatbotController');
const chatbotRouter = express.Router();
chatbotRouter.post('/message',       optionalAuth, sendMessage);
chatbotRouter.get('/history/:sessionId', getChatHistory);

// ─── Notifications ────────────────────────────────────────────────────────────
const { getNotifications, markRead, markAllRead, deleteNotification } = require('../controllers/notificationController');
const notificationRouter = express.Router();
notificationRouter.use(protect);
notificationRouter.get('/',                getNotifications);
notificationRouter.patch('/read-all',      markAllRead);
notificationRouter.patch('/:id/read',      markRead);
notificationRouter.delete('/:id',          deleteNotification);

module.exports = { authRouter, roomRouter, bookingRouter, userRouter, serviceRouter, dashboardRouter, chatbotRouter, notificationRouter };
