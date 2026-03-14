require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors           = require('cors');
const helmet         = require('helmet');
const morgan         = require('morgan');
const rateLimit      = require('express-rate-limit');
const mongoSanitize  = require('express-mongo-sanitize');
const path           = require('path');
const jwt            = require('jsonwebtoken');

const connectDB     = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const {
  authRouter, roomRouter, bookingRouter, userRouter,
  serviceRouter, dashboardRouter, chatbotRouter, notificationRouter,
} = require('./routes/index');
const seedDatabase  = require('./scripts/seedDatabase');

const app    = express();
const server = http.createServer(app);

// ── Socket.io setup ──────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Authenticate socket connections
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(); // Allow unauthenticated (public chatbot)
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch {
    next(); // Continue without auth — client gets limited events
  }
});

io.on('connection', (socket) => {
  const userId = socket.userId;
  if (userId) {
    socket.join(`user:${userId}`);
    socket.join(`role:${socket.userRole}`);
  }

  socket.on('disconnect', () => {});
});

// Attach io to app so controllers can emit
app.set('io', io);

// ── Notification helpers ──────────────────────────────────────────────────────
app.set('notifyUser', (userId, notification) => {
  io.to(`user:${userId}`).emit('notification:new', notification);
});

app.set('notifyRole', (role, notification) => {
  io.to(`role:${role}`).emit('notification:new', notification);
});

app.set('notifyAdmins', (notification) => {
  io.to('role:admin').to('role:manager').emit('notification:new', notification);
});

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(mongoSanitize());

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, max: 500,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true, legacyHeaders: false,
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 30,
  message: { success: false, message: 'Too many login attempts, please wait 15 minutes.' },
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000, max: 20,
  message: { success: false, message: 'Chatbot rate limit reached.' },
});

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5174',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ── Static ────────────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Sable Grand API running',
    timestamp: new Date().toISOString(),
    timezone: 'Africa/Johannesburg',
    currency: 'ZAR',
    environment: process.env.NODE_ENV,
    socketConnections: io.engine.clientsCount,
    version: '2.0.0',
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',          authLimiter, authRouter);
app.use('/api/rooms',         roomRouter);
app.use('/api/bookings',      bookingRouter);
app.use('/api/users',         userRouter);
app.use('/api/services',      serviceRouter);
app.use('/api/dashboard',     dashboardRouter);
app.use('/api/chatbot',       chatLimiter, chatbotRouter);
app.use('/api/notifications', notificationRouter);

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    await seedDatabase();

    server.listen(PORT, () => {
      console.log(`\n╔═══════════════════════════════════════════╗`);
      console.log(`║  Sable Grand Management API               ║`);
      console.log(`║  Port: ${PORT}  │  Env: ${(process.env.NODE_ENV || 'development').padEnd(11)} ║`);
      console.log(`║  Currency: ZAR  │  TZ: Africa/Joburg    ║`);
      console.log(`║  WebSocket: enabled                       ║`);
      console.log(`╚═══════════════════════════════════════════╝\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();

process.on('SIGTERM', () => { server.close(() => process.exit(0)); });
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});

module.exports = { app, io };
