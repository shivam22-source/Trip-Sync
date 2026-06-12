<div align="center">

# ✈️ TripSync

**Plan together. Travel together.**

A full-stack MERN travel collaboration platform for creating group trips, splitting expenses, and staying in sync — in real time.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-trip--sync--smoky.vercel.app-black?style=flat-square)](https://trip-sync-smoky.vercel.app/)
![Tech](https://img.shields.io/badge/Stack-MERN-blue?style=flat-square)
![Realtime](https://img.shields.io/badge/Realtime-Socket.io-green?style=flat-square)

</div>

---

## What is TripSync?

TripSync lets you create group trips, control who joins, chat with your travel crew, and keep expenses fair — all in one place.

It's built as a production-style learning project with real authentication, protected trip access, Cloudinary media uploads, Socket.io realtime features, and a clean React + Tailwind frontend.

**Core loop:**
```
Create a trip → Accept members → Chat & plan → Split expenses → Settle up
```

---

## Features

### 🔐 Authentication & Profiles
- JWT-based auth with protected routes
- Profile photo upload via Cloudinary
- Travel preferences (smoking, drinking, gender preference)

### 🗺️ Trip Management
- Create trips with destination, dates, budget range, max members, group rules, and a cover image
- Filter trips by destination, category, budget, and travel preferences
- Delete trips as the admin

### 🚪 Join Request Workflow
```
User requests to join
     ↓
Backend creates a pending record
     ↓
Admin gets a realtime notification
     ↓
Admin accepts or rejects
     ↓
Requester is notified instantly
     ↓
Chat & expenses unlock on acceptance
```
This keeps groups private and gives the trip creator full control over who joins.

### 💬 Realtime Chat
- Message history loads via REST
- New messages delivered via Socket.io
- Online member presence shown live
- Typing indicators

### 💸 Expense Splitter
- Add expenses with receipt image uploads
- Each member sees only their relevant settlement rows
- Two-pointer debtor-creditor algorithm produces a minimal, clean settlement plan
- Settling a payment doesn't rewrite expense history — settlements are stored separately

**Balance logic:**
```
Balance = total expenses paid - settlements received
Positive balance → you are owed money
Negative balance → you owe money
```

### 🔔 Notification Center
Realtime notifications for:
- Join request received
- Request accepted / rejected
- Expense added
- Payment settled

Design principle: MongoDB is the source of truth. Socket.io is the delivery layer. If a socket event is missed, the next REST fetch returns correct data.

### 🖼️ Cloudinary Media Uploads
- Profile photos
- Trip cover images
- Receipt images (ready for future OCR/AI extraction)

Upload flow: `FormData → Multer → Cloudinary → secure URL stored in MongoDB`

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, Tailwind CSS, React Router, Socket.io Client |
| Backend | Node.js, Express, MongoDB, Mongoose |
| Auth | JWT, bcryptjs |
| Validation | Joi |
| Realtime | Socket.io |
| Media | Multer, Cloudinary |
| Analytics | Vercel Analytics |

---

## Project Structure

```
TripSync/
├── backend/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── sockets/
│       ├── app.js
│       └── server.js
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
```
POST /api/auth/register
POST /api/auth/login
```

### Users
```
GET   /api/users/profile
PATCH /api/users/profile
```

### Trips
```
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
```
GET /api/messages/:tripId
```

### Expenses
```
GET  /api/expenses/:tripId
POST /api/expenses/:tripId
POST /api/expenses/:tripId/settle
```

### Notifications
```
GET   /api/notifications
PATCH /api/notifications/read-all
PATCH /api/notifications/:notificationId/read
```

---

## Socket Events

**Client → Server**
| Event | Description |
|---|---|
| `join-trip` | Join a trip room |
| `send-message` | Send a chat message |
| `typing` | Emit typing indicator |

**Server → Client**
| Event | Description |
|---|---|
| `joined-trip` | Confirmed room join |
| `receive-message` | Incoming chat message |
| `trip-presence` | Online member list |
| `notification:new` | New notification trigger |
| `user-typing` | Another user is typing |
| `error-message` | Error event |

---

## Local Setup

### 1. Clone the repo

```bash
git clone https://github.com/your-username/tripsync.git
cd tripsync
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
```

```bash
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

```bash
npm run dev
```

**Default URLs:**
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

---

## Testing the Full Flow

Open two browser sessions (one normal + one incognito) and run through this sequence:

```
[ Account A ] Create a trip
[ Account B ] Request to join
[ Account A ] Receives realtime notification → Accepts
[ Account B ] Receives accepted notification
[ Both      ] Chat unlocks, both appear online
[ Account A ] Adds an expense
[ Account B ] Receives expense notification
[ Both      ] View settlement plan
[ Account A ] Marks a payment as settled
[ Both      ] Balances update
```

---

## Architecture Notes

TripSync is not a basic CRUD app. It combines authenticated access control, an approval-based group model, realtime chat, realtime notifications, media uploads, and expense settlement logic.

The architecture follows one simple principle:

```
REST        → durable data
Socket.io   → realtime updates
MongoDB     → source of truth
Cloudinary  → media storage
React hooks → reusable frontend logic
```

This separation keeps the system debuggable, consistent, and easy to extend — for example, adding AI-based receipt extraction or member compatibility scoring later.

---

## Validation

Joi schemas validate critical write endpoints before data reaches the controller:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/trips`
- `POST /api/expenses/:tripId`
- `POST /api/expenses/:tripId/settle`

Invalid requests return `400` with a clear error message.

---

## Deployment

The frontend is deployed on **Vercel** with Vercel Analytics enabled for tracking:
- Page views and unique visitors
- Route-level usage
- Live traffic

---

<div align="center">

Built with care by [your name] · [Live Demo](https://trip-sync-smoky.vercel.app/)

</div>
