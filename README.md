<div align="center">

# ✈️ TripSync

**Plan together. Travel together.**

A full-stack travel collaboration platform for group trips, realtime chat, shared expenses, and AI-assisted travel planning.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-trip--sync--smoky.vercel.app-black?style=flat-square)](https://trip-sync-smoky.vercel.app/)
![Stack](https://img.shields.io/badge/Stack-MERN-blue?style=flat-square)
![Realtime](https://img.shields.io/badge/Realtime-Socket.io-green?style=flat-square)
![Tests](https://img.shields.io/badge/Tests-Jest-red?style=flat-square)

</div>

---

## Overview

TripSync brings the main parts of a group trip into one application:

- Create and manage private trips
- Review and approve join requests
- Chat with trip members in realtime
- Upload receipts and split shared expenses
- Track balances and settle payments
- Generate AI-assisted itineraries and compatibility scores

**Core flow:**

```text
Create trip → Approve members → Chat & plan → Split expenses → Settle up
```

---

## Features

### 🤖 AI-assisted features

- AI itinerary planner for trip admins
- AI compatibility score for pending join requests
- AI receipt extraction for expense creation
- Joi validation for AI-generated data before it is used by the application

AI is an assistant, not the source of truth. Generated output is validated before being converted into normal application data.

### 🔐 Authentication & access control

- JWT-based authentication
- Protected routes and trip-level access control
- Profile photo uploads through Cloudinary
- Travel preferences for trip matching

### 🗺️ Trip management

- Create trips with destination, dates, budget range, member limit, rules, and cover image
- Filter trips by destination, category, budget, and preferences
- Admin-controlled member approval
- Admin-only trip deletion and itinerary generation

### 🚪 Join requests

```text
User requests to join
        ↓
Pending request stored
        ↓
Admin receives notification
        ↓
Admin accepts or rejects
        ↓
Requester is notified
        ↓
Accepted member gets access
```

### 💬 Realtime chat

- REST API loads message history
- Socket.io delivers new messages
- Online member presence
- Typing indicators

### 💸 Expense splitting

- Add shared expenses with optional receipt images
- Extract receipt details with Gemini
- Calculate member balances for equal-split expenses
- Generate a debtor → creditor settlement plan
- Store settlements separately from expense history

```text
Balance = expenses paid - settlements received

Positive → you are owed money
Negative → you owe money
```

### 🔔 Notifications

Realtime notifications for join requests, request decisions, expenses, and settlements.

MongoDB remains the source of truth; Socket.io is the realtime delivery layer.

### 🖼️ Media uploads

- Profile photos
- Trip cover images
- Receipt images

```text
FormData → Multer → Cloudinary → URL stored in MongoDB
```

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, Tailwind CSS, React Router, Socket.io Client |
| Backend | Node.js, Express, MongoDB, Mongoose |
| Authentication | JWT, bcryptjs |
| Validation | Joi |
| Realtime | Socket.io |
| Caching / Jobs | Redis, BullMQ |
| Media | Multer, Cloudinary |
| AI | Gemini API |
| Testing | Jest |
| Deployment | Vercel, Render |

---

## Project Structure

```text
Trip-Sync/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── sockets/
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── app.js
│   │   └── server.js
│   └── tests/
│
└── frontend/
    └── src/
        ├── components/
        ├── hooks/
        ├── pages/
        ├── services/
        ├── App.jsx
        ├── main.jsx
        └── index.css
```

---

## API Reference

### Auth

```text
POST /api/auth/register
POST /api/auth/login
```

### Users

```text
GET   /api/users/profile
PATCH /api/users/profile
```

### Trips

```text
GET    /api/trips
POST   /api/trips
GET    /api/trips/:id
POST   /api/trips/:id/join
GET    /api/trips/:tripId/requests
PATCH  /api/trips/:tripId/accept/:memberId
PATCH  /api/trips/:tripId/reject/:memberId
DELETE /api/trips/:id
```

### Messages

```text
GET /api/messages/:tripId
```

### Expenses

```text
GET  /api/expenses/:tripId
POST /api/expenses/:tripId
POST /api/expenses/:tripId/settle
```

### AI

```text
POST /api/ai/plan-trip
POST /api/expenses/:tripId/extract-receipt
```

### Notifications

```text
GET   /api/notifications
PATCH /api/notifications/read-all
PATCH /api/notifications/:notificationId/read
```

---

## Socket Events

| Client → Server | Description |
|---|---|
| `join-trip` | Join a trip room |
| `send-message` | Send a chat message |
| `typing` | Emit typing status |

| Server → Client | Description |
|---|---|
| `joined-trip` | Confirm room join |
| `receive-message` | Incoming chat message |
| `trip-presence` | Online member list |
| `notification:new` | New notification trigger |
| `user-typing` | Another user is typing |
| `error-message` | Error event |

---

## Architecture

TripSync separates durable application state from realtime delivery and external services:

```text
React
  ↓
Express REST API ─────→ MongoDB
  │
  ├──────────────→ Redis / BullMQ
  ├──────────────→ Cloudinary
  ├──────────────→ Gemini
  └──────────────→ Socket.io
```

### Redis cache

Trip details use a Redis cache with keys such as `trip:<tripId>`:

```text
GET /api/trips/:id
       ↓
   Redis GET
   ├─ HIT  → return cached data
   └─ MISS → MongoDB → Redis SET
```

When trip data changes, the relevant cache entry is invalidated so the next read uses fresh MongoDB data.

### Production hardening

- `helmet()` for security headers
- `express-rate-limit` for rate limiting
- `express-mongo-sanitize` for MongoDB operator injection protection
- `xss-clean` for unsafe input handling

---

## Validation

Joi validation is applied to critical write endpoints before data reaches the controller, including authentication, trip creation, expense creation, and settlement requests.

AI responses are also validated against dedicated schemas. Invalid AI JSON or invalid AI data is rejected rather than silently stored as application data.

---

## Testing

The backend uses Jest for automated tests covering settlement logic and AI output validation.

Run locally:

```bash
cd backend
npm test
```

GitHub Actions runs the backend test suite on pushes and pull requests targeting `main`.

---

## Load Testing

Artillery was used to run a spike workload against the deployed backend:

```text
5 req/s → 100 req/s → 5 req/s
```

The test produced **301 successful HTTP 200 responses from 2,384 total HTTP requests**. At the peak 100+ req/s phase, response times increased substantially and socket timeouts appeared, identifying the current deployment's capacity limit under this workload.

Key observed results:

| Metric | Result |
|---|---:|
| Total HTTP requests | 2,384 |
| Successful HTTP 200 responses | 301 |
| Socket timeouts | 2,083 |
| Average response time | 1.99 s |
| p95 response time | 7.71 s |
| Peak arrival rate | ~104 req/s |

These results are reported as observed measurements, not as a claim that the application supports 100 req/s at 100% success.

---

## Database Indexes

Indexes cover common lookup patterns such as:

- Trips: `admin + createdAt`, `destination + createdAt`, `status + createdAt`
- Users: `email`, `username + createdAt`
- Notifications: `receiver + createdAt`
- Messages: `tripId + createdAt`
- Expenses: `tripId + createdAt`, `tripId + paidBy + createdAt`
- Join requests: `tripId + status`, `tripId + userId`

---

## Local Setup

### 1. Clone

```bash
git clone https://github.com/shivam22-source/Trip-Sync.git
cd Trip-Sync
```

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_gemini_model
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

Run the backend:

```bash
npm run dev
```

### 3. Frontend

```bash
cd ../frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Run the frontend:

```bash
npm run dev
```

Default local URLs:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:5000
```

---

## Deployment

- Frontend: Vercel
- Backend: Render
- Vercel Analytics is enabled on the frontend

---

<div align="center">

Built with care by Shivam · [Live Demo](https://trip-sync-smoky.vercel.app/)

</div>
