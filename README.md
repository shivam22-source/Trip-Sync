# Travel Buddy

Travel Buddy is a full-stack MERN travel collaboration app where users can create group trips, request to join trips, chat with accepted members, split expenses, and receive realtime updates.

It is built as a production-style learning project with authentication, protected trip access, Cloudinary media uploads, Socket.io realtime features, and a clean React + Tailwind frontend.

## Highlights

- Secure auth with JWT and protected routes
- Trip creation with destination, dates, budget, group rules, and cover image
- Join request workflow with admin accept/reject controls
- Realtime trip chat with online member presence
- Realtime notification center for requests, approvals, expenses, and settlements
- Expense splitter with personal balances and per-transaction settle-up
- Cloudinary uploads for profile photos, trip covers, and receipt images
- Modular frontend structure with services, hooks, and reusable components

## Tech Stack

Frontend:

- React
- Vite
- Tailwind CSS
- React Router
- Socket.io Client

Backend:

- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- bcryptjs
- Socket.io
- Multer
- Cloudinary

## Project Structure

```txt
Travel Buddy/
  backend/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      sockets/
      app.js
      server.js

  frontend/
    src/
      components/
      hooks/
      pages/
      services/
      App.jsx
      main.jsx
      index.css
```

## Main Features

### Authentication And Profile

Users can register, log in, update their profile, choose travel preferences, and upload a profile photo. The frontend stores the logged-in session and sends the token with protected API calls.

### Trip Management

Users can create trips with title, destination, description, dates, category, daily budget range, maximum members, group rules, and an optional cover image. Trip images are uploaded to Cloudinary and stored in MongoDB as URLs.

### Search And Filters

Trips can be filtered by destination/search text, category, budget, smoking preference, drinking preference, and gender preference.

Example:

```txt
GET /api/trips?q=goa&budget=medium&smokingAllowed=true
```

### Join Request Workflow

Travel Buddy uses an approval-based group model:

```txt
User requests to join a trip
Backend creates a pending member record
Trip admin receives a realtime notification
Admin accepts or rejects the request
Requester receives a realtime status notification
Chat and expense access unlock only after acceptance
```

This keeps group access private and gives the trip creator control over who joins.

### Realtime Chat

Accepted members can chat inside the trip. Old messages load through REST, while new messages are delivered through Socket.io. The chat also shows online member presence.

```txt
REST = message history
Socket.io = live messages, typing, and online presence
```

### Expense Splitter

Accepted trip members can add expenses and settle payments. Each user only sees settlement rows that involve them, such as:

```txt
You pay Shivam Rs 600
Rahul pays You Rs 400
```

Expense logic:

```txt
Each expense is stored as history
Each settlement is stored separately
Balance = expenses - settled payments
```

This avoids deleting or rewriting original expenses when someone marks a payment as paid.

### Notification Center

Notifications are created for:

- join request received
- request accepted
- request rejected
- expense added
- payment settled

Design choice:

```txt
MongoDB is the source of truth.
Socket.io is used as a realtime refresh signal.
If a socket event is missed, the next REST fetch still returns correct data.
```

### Cloudinary Media Uploads

Cloudinary is used for:

- profile photos
- trip cover images
- receipt images for future AI/OCR expense extraction

Upload flow:

```txt
Frontend sends multipart FormData
Multer reads the file
Backend uploads it to Cloudinary
Cloudinary returns a secure URL
MongoDB stores the URL, not the image file
```

## Important API Routes

Auth:

```txt
POST /api/auth/register
POST /api/auth/login
```

Users:

```txt
GET   /api/users/profile
PATCH /api/users/profile
```

Trips:

```txt
GET    /api/trips
POST   /api/trips
GET    /api/trips/:id
POST   /api/trips/:id/join
GET    /api/trips/:tripId/requests
PATCH  /api/trips/:tripId/accept/:memberId
PATCH  /api/trips/:tripId/reject/:memberId
DELETE /api/trips/:id
```

Messages:

```txt
GET /api/messages/:tripId
```

Expenses:

```txt
GET  /api/expenses/:tripId
POST /api/expenses/:tripId
POST /api/expenses/:tripId/settle
```

Notifications:

```txt
GET   /api/notifications
PATCH /api/notifications/read-all
PATCH /api/notifications/:notificationId/read
```

## Socket Events

Client emits:

```txt
join-trip
send-message
typing
```

Server emits:

```txt
joined-trip
receive-message
trip-presence
notification:new
user-typing
error-message
```

## Environment Variables

Backend `.env`:

```bash
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Frontend `.env`:

```bash
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Local Setup

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Default URLs:

```txt
Backend:  http://localhost:5000
Frontend: http://localhost:5173
```

## Testing Flow

Use two browser sessions:

```txt
Normal browser window = Account A
Incognito window      = Account B
```

Suggested flow:

```txt
Account A creates a trip
Account B requests to join
Account A receives a realtime notification
Account A accepts Account B
Account B receives an accepted notification
Chat unlocks for both users
Both users appear online in chat
One user adds an expense
The other user receives an expense notification
Settlement plan shows who needs to pay whom
User marks one payment as paid
Balances update
```

## Interview Summary

Travel Buddy is not just a CRUD app. It combines authenticated access, group approval, realtime chat, realtime notifications, Cloudinary uploads, and expense settlement logic.

The key architecture idea is simple:

```txt
REST handles durable data.
Socket.io handles realtime updates.
MongoDB remains the source of truth.
Cloudinary stores media.
React services and hooks keep frontend logic reusable.
```

This makes the app easier to explain, extend, and scale later with AI-based receipt extraction or compatibility scoring.
