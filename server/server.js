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

// ── Allowed origins ───────────────────────────────────────────────────────────
// Supports: localhost dev, Vercel preview URLs (*.vercel.app), and your custom domain
const getAllowedOrigins = () => {
  const origins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:4173', // vite preview
  ];

  // Add production client URL from env (set this in Render dashboard)
  if (process.env.CLIENT_URL) {
    origins.push(process.env.CLIENT_URL);
  }

  // Allow all *.vercel.app subdomains (preview deployments)
  return origins;
};

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // allow non-browser requests (Postman, server-to-server)
  const allowed = getAllowedOrigins();
  if (allowed.includes(origin)) return true;
  // Allow any Vercel preview deployment URL
  if (origin.endsWith('.vercel.app')) return true;
  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// ── Socket.io ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) callback(null, true);
      else callback(new Error(`Socket.io CORS: ${origin} not allowed`));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Support both WebSocket and polling — polling is fallback for Render's free tier
  transports: ['websocket', 'polling'],
  // Increase ping timeout for Render free tier which may spin down
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Authenticate socket connections
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(); // unauthenticated ok (public chatbot)
  try {
    const decoded     = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId     = decoded.id;
    socket.userRole   = decoded.role;
    next();
  } catch {
    next(); // continue without auth rather than blocking connection
  }
});

io.on('connection', (socket) => {
  if (socket.userId) {
    socket.join(`user:${socket.userId}`);
    socket.join(`role:${socket.userRole}`);
  }
  socket.on('disconnect', () => {});
});

// Attach helpers to app so controllers can emit events
app.set('io',           io);
app.set('notifyUser',   (userId, n)  => io.to(`user:${userId}`).emit('notification:new', n));
app.set('notifyRole',   (role, n)    => io.to(`role:${role}`).emit('notification:new', n));
app.set('notifyAdmins', (n)          => io.to('role:admin').to('role:manager').emit('notification:new', n));

// ── Trust proxy (required for Render's reverse proxy) ────────────────────────
app.set('trust proxy', 1);

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(mongoSanitize());

// ── CORS — must come before routes ───────────────────────────────────────────
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // handle preflight for all routes

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 300 : 1000,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/api/health',
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many login attempts. Please wait 15 minutes.' },
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, message: 'Chatbot rate limit reached. Please wait a moment.' },
});

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ── Static uploads ────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Health check (Render uses this to verify the service is alive) ────────────
app.get('/api/health', (req, res) => {
  res.json({
    success:     true,
    message:     'Sable Grand API is running',
    timestamp:   new Date().toISOString(),
    timezone:    'Africa/Johannesburg',
    currency:    'ZAR',
    environment: process.env.NODE_ENV || 'development',
    sockets:     io.engine.clientsCount,
    version:     '2.0.0',
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',          authLimiter,  authRouter);
app.use('/api/rooms',                       roomRouter);
app.use('/api/bookings',                    bookingRouter);
app.use('/api/users',                       userRouter);
app.use('/api/services',                    serviceRouter);
app.use('/api/dashboard',                   dashboardRouter);
app.use('/api/chatbot',       chatLimiter,  chatbotRouter);
app.use('/api/notifications',               notificationRouter);

// ── 404 + Error handling ──────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    await seedDatabase();

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`\n╔═══════════════════════════════════════════╗`);
      console.log(`║  Sable Grand API — v2.0.0                 ║`);
      console.log(`║  Port     : ${String(PORT).padEnd(30)} ║`);
      console.log(`║  Env      : ${String(process.env.NODE_ENV || 'development').padEnd(30)} ║`);
      console.log(`║  Currency : ZAR  │  TZ: Africa/Joburg    ║`);
      console.log(`║  Sockets  : enabled (ws + polling)        ║`);
      console.log(`╚═══════════════════════════════════════════╝\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});

module.exports = { app, io };
