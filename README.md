# Sable Grand — Luxury Hotel Management Platform

> *Where Africa's Soul Meets Luxury* — A production-grade, full-stack hotel management system built for South Africa.

---

## What's New in v2.0

| Feature | Details |
|---|---|
| **Dark / Light Mode** | Full system-wide theme toggle with smooth transitions, persisted per user |
| **Real-time Notifications** | Socket.io WebSockets — instant booking, check-in, payment, cancellation alerts |
| **ZAR Localisation** | All prices, invoices, dashboards in South African Rand (R). 15% VAT applied. SAST timezone throughout |
| **AI Concierge (Aria)** | Google Gemini-powered chatbot with SA-specific context, ZAR pricing, SA hotel policies |
| **Premium Design System** | Cormorant Garamond + Plus Jakarta Sans, gold/navy palette, luxury hospitality aesthetic |
| **Clean Architecture** | Complete rebuild — no legacy code, every button works, no broken routes |

---

## Architecture

```
sable-grand/
├── client/                     # React 18 + Vite frontend
│   └── src/
│       ├── components/
│       │   ├── chatbot/        # AI Concierge widget
│       │   ├── layout/         # DashboardLayout, PublicLayout
│       │   └── ui/             # ThemeToggle, NotificationPanel
│       ├── pages/
│       │   ├── admin/          # Dashboard, Rooms, Bookings, Staff, Services
│       │   ├── guest/          # Dashboard, MyBookings, BookRoom, Profile
│       │   ├── public/         # Landing, Rooms, RoomDetail, Login, Register, Contact
│       │   └── reception/      # Dashboard, Bookings, CheckInOut
│       ├── services/           # api.js (Axios), socket.js (Socket.io client)
│       ├── store/              # authStore, themeStore, notificationStore (Zustand)
│       └── utils/              # helpers.js (ZAR, SAST formatting)
│
└── server/                     # Express + MongoDB backend
    ├── config/                 # database.js
    ├── controllers/            # auth, booking, chatbot, dashboard, notification, room, service, user
    ├── middleware/             # auth.js, errorHandler.js
    ├── models/                 # User, Room, Booking, Notification, Other (ServiceRequest, HotelInfo, ChatLog)
    ├── routes/                 # index.js (all routers)
    ├── scripts/                # seedDatabase.js
    ├── utils/                  # response.js
    └── server.js               # Express + Socket.io server
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas cluster (or local MongoDB)
- Google Gemini API key (for AI chatbot)

### 1. Install dependencies
```bash
# From project root
npm run install:all
```

### 2. Configure environment
Edit `server/.env`:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_secret
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:5173
```

### 3. Seed the database
```bash
npm run seed
# To reset and re-seed:
npm run seed:reset
```

### 4. Start development
```bash
npm run dev
# Client: http://localhost:5173
# Server: http://localhost:5000
```

---

## 🔑 Demo Credentials

### Staff
| Role | Email | Password |
|---|---|---|
| Admin | victoria.harrington@sablegrand.co.za | Admin@SableGrand2024! |
| Manager | marcus.wellington@sablegrand.co.za | Manager@SableGrand2024! |
| Receptionist | sophia.chambers@sablegrand.co.za | Reception@SableGrand2024! |
| Housekeeping | amara.osei@sablegrand.co.za | Housekeeping@SableGrand2024! |

### Guests
| Name | Email | Password |
|---|---|---|
| Eleanor Whitfield | eleanor.whitfield@email.com | Guest@2024! |
| Liam Nakamura | liam.nakamura@email.com | Guest@2024! |
| Isabella Fontaine | isabella.fontaine@email.com | Guest@2024! |

---

## South African Localisation

- **Currency**: South African Rand (ZAR / R) — all prices, invoices, and dashboards
- **VAT**: 15% applied to all room rates (South African standard rate)
- **Timezone**: Africa/Johannesburg (SAST, UTC+2) — all timestamps displayed in SAST
- **Booking reference format**: `SG24-XXXXXX` (Sable Grand + year)
- **Phone format**: +27 (South African international prefix)
- **Currency conversion**: Approximate USD display available (R 18.50 per $1)

---

## Real-time Notification Events

| Event | Recipients |
|---|---|
| New booking created | Admin, Manager |
| Booking confirmed | Guest |
| Guest checked in | Guest |
| Guest checked out | Guest |
| Payment received | Guest |
| Booking cancelled | Admin, Manager |
| New service request | Housekeeping staff |

---

## Role Permissions

| Role | Access |
|---|---|
| **Admin** | Full access — analytics, rooms, bookings, staff, services |
| **Manager** | Analytics, bookings, rooms, services (no staff deletion) |
| **Receptionist** | Front desk, bookings, check-in/out |
| **Housekeeping** | Service requests |
| **Guest** | Own bookings, room browsing, profile, chatbot |

---

## AI Chatbot (Aria)

Powered by Google Gemini 1.5 Pro. Aria is aware of:
- All Sable Grand room types and ZAR pricing
- Check-in/out times in SAST
- Hotel amenities, dining hours, policies
- South African context (VAT, airport transfers to OR Tambo/Lanseria)
- Cancellation policies, parking, Wi-Fi

The chatbot is accessible from any page via the gold sparkle button (bottom-right).

---

## Tech Stack

**Frontend**
- React 18, React Router 6, Vite
- Tailwind CSS 3 (custom design system — no component library)
- Zustand (auth, theme, notifications state)
- Socket.io-client (real-time)
- Recharts (analytics charts)
- Lucide React (icons)
- date-fns + date-fns-tz (SAST formatting)

**Backend**
- Node.js + Express 4
- MongoDB + Mongoose 8
- Socket.io 4 (WebSocket server)
- JWT authentication (30-day tokens)
- bcryptjs (password hashing, 12 rounds)
- Google Generative AI (@google/generative-ai)
- express-rate-limit, helmet, express-mongo-sanitize

---

## API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/me

GET    /api/rooms
GET    /api/rooms/:id
POST   /api/rooms          [admin, manager]
PUT    /api/rooms/:id      [admin, manager]
DELETE /api/rooms/:id      [admin]
PATCH  /api/rooms/:id/status

GET    /api/bookings        [admin, manager, receptionist]
GET    /api/bookings/my    [guest]
POST   /api/bookings
PATCH  /api/bookings/:id/status
PATCH  /api/bookings/:id/cancel
PATCH  /api/bookings/:id/payment

GET    /api/users          [admin, manager]
POST   /api/users          [admin, manager]
PUT    /api/users/:id      [admin, manager]
PATCH  /api/users/:id/toggle-status

GET    /api/dashboard/analytics   [admin, manager]
GET    /api/dashboard/reception   [admin, manager, receptionist]

GET    /api/services
POST   /api/services
PUT    /api/services/:id

POST   /api/chatbot/message
GET    /api/chatbot/history/:sessionId

GET    /api/notifications
PATCH  /api/notifications/read-all
PATCH  /api/notifications/:id/read

GET    /api/health
```

---

## Design System

- **Display font**: Cormorant Garamond (luxury serif — headings, prices, hero text)
- **Body font**: Plus Jakarta Sans (modern geometric sans-serif)
- **Primary palette**: Deep navy (#243d87 → #0A1628)
- **Accent**: Krugerrand gold (#C9A84C)
- **Neutral**: Warm ivory/linen surface tones
- **Dark mode**: Slate-navy backgrounds (#0F1117 → #161B26) with gold accent preserved

---

*Built with ❤️ for South African hospitality*
