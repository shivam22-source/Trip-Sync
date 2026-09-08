<div align="center">

# ✈️ TripSync

**Plan together. Travel together.**

A full-stack travel collaboration platform for group trips, realtime chat, shared expenses, and AI-assisted travel planning.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-trip--sync--smoky.vercel.app-black?style=flat-square)](https://trip-sync-smoky.vercel.app/)
[![Stack](https://img.shields.io/badge/Stack-MERN-blue?style=flat-square)](https://github.com/shivam22-source/Trip-Sync)
[![Realtime](https://img.shields.io/badge/Realtime-Socket.io-green?style=flat-square)](https://socket.io/)
[![Tests](https://img.shields.io/badge/Tests-Jest-red?style=flat-square)](https://jestjs.io/)
[![CI](https://img.shields.io/badge/CI-GitHub%20Actions-black?style=flat-square)](https://github.com/shivam22-source/Trip-Sync/actions)

</div>

---

## 🚀 What is TripSync?

TripSync brings the main parts of a group trip into one application:

- Create and manage private trips
- Review and approve join requests
- Chat with trip members in realtime
- Upload receipts and split shared expenses
- Track balances and settle payments
- Generate AI-assisted itineraries and compatibility scores
- Schedule background trip reminders

**Core flow:**

```text
Create trip → Approve members → Chat & plan → Split expenses → Settle up
                                      ↓
                               Trip reminders
                                      ↓
                               BullMQ worker
```

---

## ✨ Why this project is interesting

TripSync is built as a production-style learning project rather than a basic CRUD application.

It combines **authentication, access control, realtime communication, background jobs, caching, media storage, AI integration, validation, testing, and load testing** in one system.

The goal is not to claim massive scale. The goal is to show how real application concerns fit together and how the system behaves when things go wrong.

---

## 🔥 Features

### 🤖 AI-assisted features

- AI itinerary planner for trip admins
- AI compatibility score for pending join requests
- AI receipt extraction for expense creation
- Joi validation for AI-generated data before application use
- Invalid AI JSON/data is rejected instead of silently stored

AI acts as an assistant, not the source of truth. Generated output is validated before it becomes normal application data.

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
Expenses paid ──────────────┐
                            ├→ Balance calculation → Settlement plan
Settlements received ───────┘
```

```text
Positive balance → you are owed money
Negative balance → you owe money
```

### 🔔 Notifications

Realtime notifications for join requests, request decisions, expenses, and settlements.

MongoDB remains the source of truth; Socket.io is the realtime delivery layer.

### 🖼️ Media uploads

```text
FormData → Multer → Cloudinary → URL stored in MongoDB
```

### ⚙️ Background jobs

Trip reminders are handled asynchronously with **BullMQ + Redis** instead of keeping the work inside the request/response cycle.

```text
Schedule reminder
       ↓
BullMQ Queue
       ↓
Redis-backed job
       ↓
BullMQ Worker
       ↓
Fetch trip + members
       ↓
Create notification + send email
```

Reminder jobs support delayed execution, cancellation/rescheduling, retries, and exponential backoff.

---

## 🧩 System architecture

```text
                         ┌──────────────────────┐
                         │     React Frontend   │
                         └──────────┬───────────┘
                                    │
                     REST + Socket.io communication
                                    │
                         ┌──────────▼───────────┐
                         │   Express Backend    │
                         └───────┬──┬──┬────────┘
                                 │  │  │
              ┌──────────────────┘  │  └─────────────────┐
              ▼                     ▼                    ▼
        ┌───────────┐         ┌───────────┐        ┌───────────┐
        │ MongoDB   │         │ Redis     │        │ Cloudinary│
        │ source of │         │ cache +   │        │ media     │
        │ truth     │         │ BullMQ    │        │ storage   │
        └───────────┘         └─────┬─────┘        └───────────┘
                                    │
                                    ▼
                              ┌───────────┐
                              │ BullMQ    │
                              │ Worker    │
                              └─────┬─────┘
                                    │
                             notification/email
                                    │
                        ┌───────────┴───────────┐
                        ▼                       ▼
                   MongoDB                 Mail service

                    Gemini AI ← Express Backend
```

### Design principles

```text
MongoDB   → durable application state
Redis     → cache + job backing store
BullMQ    → asynchronous job processing
Socket.io → realtime delivery
Cloudinary→ media storage
Gemini    → AI assistance
```

This separation keeps the system easier to reason about: durable state is not dependent on realtime delivery, and background work does not have to block the main API request.

---

## 🧠 Architecture details

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

### Background job lifecycle

```text
Trip reminder requested
          │
          ▼
 scheduleTripReminder()
          │
          ▼
    BullMQ Queue
          │
          ▼
         Redis
          │
      delayed job
          │
          ▼
    BullMQ Worker
          │
      ┌───┴────┐
      ▼        ▼
  MongoDB    Email
 notification
```

Jobs are configured with retries and exponential backoff so transient processing failures do not immediately become lost work.

---

## 🛡️ Validation & production hardening

### Request validation

Joi validation is applied to critical write endpoints before data reaches the controller, including authentication, trip creation, expense creation, and settlement requests.

### AI output validation

AI responses are checked against dedicated schemas. Invalid JSON or invalid AI data produces a controlled application error rather than silently entering the database.

### Security middleware

- `helmet()` for security headers
- `express-rate-limit` for rate limiting
- `express-mongo-sanitize` for MongoDB operator injection protection
- `xss-clean` for unsafe input handling

---

## 🧪 Testing & CI

The backend uses Jest for automated tests covering settlement logic and AI output validation.

Run locally:

```bash
cd backend
npm test
```

GitHub Actions runs the backend test suite on pushes and pull requests targeting `main`.

```text
Code change
    ↓
Git push / Pull Request
    ↓
GitHub Actions
    ↓
npm ci
    ↓
npm test
    ↓
✅ pass / ❌ fail
```

---

## 📈 Load testing

Artillery was used to run a spike workload against the deployed backend:

```text
5 req/s → 100 req/s → 5 req/s
```

Observed results:

| Metric | Result |
|---|---:|
| Total HTTP requests | 2,384 |
| Successful HTTP 200 responses | 301 |
| Socket timeouts | 2,083 |
| Average response time | 1.99 s |
| p95 response time | 7.71 s |
| Peak arrival rate | ~104 req/s |

The peak phase caused substantial latency growth and socket timeouts. These are observed measurements from the current deployment, not a claim of 100% success at 100 req/s.

---

## 🛠️ Tech stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, Tailwind CSS, React Router, Socket.io Client |
| Backend | Node.js, Express, MongoDB, Mongoose |
| Authentication | JWT, bcryptjs |
| Validation | Joi |
| Realtime | Socket.io |
| Caching / Jobs | Redis, BullMQ, ioredis |
| Media | Multer, Cloudinary |
| AI | Gemini API |
| Testing | Jest, GitHub Actions |
| Deployment | Vercel, Render |

---

## 📁 Project structure

```text
Trip-Sync/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── jobs/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── queues/
│   │   ├── routes/
│   │   ├── sockets/
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── workers/
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

## 🔌 API reference

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

## 🔌 Socket events

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

## 🗄️ Database indexes

Indexes cover common lookup patterns such as:

- Trips: `admin + createdAt`, `destination + createdAt`, `status + createdAt`
- Users: `email`, `username + createdAt`
- Notifications: `receiver + createdAt`
- Messages: `tripId + createdAt`
- Expenses: `tripId + createdAt`, `tripId + paidBy + createdAt`
- Join requests: `tripId + status`, `tripId + userId`

---

## 🚀 Local setup

### 1. Clone

```bash
git clone https://github.com/shivam22-source/Trip-Sync.git
cd Trip-Sync
```

### 2. Start Redis with Docker

TripSync uses Redis for caching and BullMQ background jobs. For local development, Redis runs as a Docker container so the host machine does not need a separate Redis installation.

Make sure Docker Desktop is running, then from the project root run:

```bash
docker compose up -d redis
```

Check the container:

```bash
docker compose ps
```

Stop Redis when you are finished:

```bash
docker compose stop redis
```

### 3. Backend

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

### 4. Background worker

In a separate terminal, from `backend/`:

```bash
node src/workers/reminder.worker.js
```

### 5. Frontend

In another terminal:

```bash
cd frontend
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
Redis:    localhost:6379
```

---

## 🌐 Deployment

- Frontend: Vercel
- Backend: Render
- Vercel Analytics enabled on the frontend

---

<div align="center">

Built with care by Shivam · [Live Demo](https://trip-sync-smoky.vercel.app/)

</div>
