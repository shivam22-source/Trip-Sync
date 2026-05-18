# Travel Buddy

Travel Buddy is a full-stack travel collaboration MVP. Users can register, log in, create trips, request to join trips, manage member requests, and chat in realtime after joining a trip.

The project is built as a learning-focused production-style MVP with a React frontend, Express backend, MongoDB database, JWT authentication, and Socket.io realtime chat.

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

## Project Structure

```txt
Travel Buddy/
  backend/
    src/
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
      pages/
      services/
      App.jsx
      main.jsx
      index.css
```

## Core Features

### Authentication

- User registration
- User login
- JWT token generation
- Protected backend routes
- Protected frontend routes
- Logout flow
- Auth-aware navbar

Implementation flow:

```txt
User submits login/register form
Backend validates credentials
Backend returns JWT token and user
Frontend stores token in localStorage
Protected API calls send Authorization header
Protected routes check token before rendering
```

### Profile

- View logged-in user profile
- Update name
- Update bio
- Update travel vibe
- Update budget preference
- Update smoking preference
- Update drinking preference

Implementation flow:

```txt
Open /profile
Frontend calls GET /api/users/profile
Form is filled with existing user data
User edits fields
Frontend sends PATCH /api/users/profile
Backend updates MongoDB
Frontend refreshes profile state and localStorage user
```

### Trip Management

- Create trip
- Fetch trips
- View trip details
- Delete trip as admin
- Store trip category
- Store per-person daily budget range
- Store trip access filters

Trip form fields:

- title
- destination
- description
- start date
- end date
- category
- budget
- max members
- smoking allowed
- drinking allowed
- gender preference

Budget ranges:

```txt
low    = Rs 100-800 per person per day
medium = Rs 800-3000 per person per day
high   = Rs 3000+ per person per day
```

Implementation flow:

```txt
User fills create trip form
Frontend sends POST /api/trips
Backend creates trip with current user as admin
Backend stores admin as first member
Frontend navigates to /trips/:id
```

### Trip Search And Filters

Users can filter trips by:

- search text
- category
- budget
- smoking allowed
- drinking allowed
- gender preference

Implementation flow:

```txt
User changes filters
Frontend calls GET /api/trips with query params
Backend builds MongoDB query
Backend returns matching trips
Frontend renders filtered cards
```

Example query:

```txt
GET /api/trips?q=goa&budget=medium&smokingAllowed=true
```

### Join Request Workflow

User side:

- Request to join a trip
- See pending state
- See accepted state
- See rejected state
- Chat unlocks only after acceptance

Admin side:

- View pending requests
- See requester profile summary
- Accept request
- Reject request
- View accepted member profiles

Admin can see basic requester/member profile because the admin needs this information to decide who can join the trip. Sensitive data like password or tokens should never be shown.

Implementation flow:

```txt
User clicks Request to join
Backend creates pending Member document
Admin opens trip detail
Frontend calls GET /api/trips/:tripId/requests
Admin accepts or rejects request
Backend updates Member status
Frontend refreshes trip state
```

### Realtime Chat

Chat is available only for:

- trip admin
- accepted trip members

Chat features:

- fetch previous messages
- connect with Socket.io
- join trip room
- send messages
- receive realtime messages
- own-message styling
- auto-scroll to latest message
- disconnect socket on component cleanup

Implementation flow:

```txt
Accepted user opens trip detail
Frontend fetches old messages using REST
Frontend connects socket with JWT token
Frontend emits join-trip
User sends message
Frontend emits send-message
Backend saves message in MongoDB
Backend emits receive-message to trip room
Frontend appends message to state
```

### Expense Splitter

The trip detail page includes a backend-connected expense splitter dashboard:

- Balance hero with "You Owe", "You Are Owed", and net balance
- Add expense modal with amount, description, category, receipt screenshot, and split equally toggle
- Recent expenses list with category icon, payer, total amount, receipt name, and date
- Trip-member access control for expense reads and writes

Current implementation:

```txt
frontend/src/components/expenses/ExpenseDashboard.jsx
frontend/src/components/expenses/BalanceHero.jsx
frontend/src/components/expenses/ExpenseCard.jsx
frontend/src/components/expenses/ExpenseModal.jsx

backend/src/models/Expense.js
backend/src/controllers/expense.controller.js
backend/src/routes/expense.routes.js
```

API routes:

```txt
GET  /api/expenses/:tripId
POST /api/expenses/:tripId
```

Expense fields:

```txt
tripId
paidBy
amount
description
category
splitEqually
receiptName
receiptImage
```

Only the trip admin and accepted trip members can view or add expenses. The frontend loads expenses with `GET /api/expenses/:tripId` and saves new expenses with `POST /api/expenses/:tripId`.

Receipt screenshot flow:

```txt
User selects screenshot in Add Expense modal
Frontend converts image to a base64 data URL
Backend stores receiptName and receiptImage on the Expense document
Future AI/OCR agent can read receiptImage and auto-fill amount, category, date, and description
```

For production, store receipt images in Cloudinary, S3, or another object store, then save only the hosted receipt URL in MongoDB.

Suggested split logic:

```txt
expenseShare = expense.amount / acceptedMembers.length

If current user paid:
  user is owed expenseShare from every other member

If another member paid:
  current user owes that payer expenseShare

Net balance:
  totalOwedToUser - totalUserOwes
```

For unequal splits later, store participant shares per expense instead of using one equal share for every accepted member.

## Frontend Architecture

### Routing

Routes are defined in:

```txt
frontend/src/App.jsx
```

Protected routes:

```txt
/trips
/trips/:id
/profile
```

Protection is handled by:

```txt
frontend/src/components/ProtectedRoute.jsx
```

### API Layer

All frontend API calls are centralized in:

```txt
frontend/src/services/api.js
```

This file handles:

- base API URL
- token storage
- token reading
- auth headers
- JSON parsing
- error handling
- query string creation

### Important Frontend Components

```txt
Navbar.jsx
```

Shows different UI for logged-in and logged-out users.

```txt
TripCard.jsx
```

Reusable trip preview card.

```txt
TripChat.jsx
```

Realtime chat UI and socket lifecycle.

```txt
ProtectedRoute.jsx
```

Redirects unauthenticated users to login.

## Backend Architecture

### Express App

Main backend app:

```txt
backend/src/app.js
```

Server and Socket.io setup:

```txt
backend/src/server.js
```

### Models

```txt
User.js
```

Stores user auth data and travel preferences.

```txt
Trip.js
```

Stores trip details, admin, budget range, filters, status, and members.

```txt
Member.js
```

Stores join request status:

```txt
pending
accepted
rejected
```

```txt
Message.js
```

Stores trip chat messages.

### Middleware

```txt
auth.middleware.js
```

Checks JWT for protected REST APIs.

```txt
socket.middleware.js
```

Checks JWT for Socket.io connections.

## API Reference

### Auth

```txt
POST /api/auth/register
POST /api/auth/login
```

### User

```txt
GET   /api/users/profile
PATCH /api/users/profile
```

### Trips

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

### Messages

```txt
GET   /api/messages/:tripId
PATCH /api/messages/read/:tripId
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
user-typing
error-message
```

## Environment Variables

Backend `.env`:

```bash
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Frontend `.env`:

```bash
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

For deployment, replace the frontend URLs with the deployed backend URL.

## Local Setup

### Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on:

```txt
http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend usually runs on:

```txt
http://localhost:5173
```

## Testing Two Accounts

Use two separate browser sessions:

```txt
Normal browser window = Account A
Incognito window      = Account B
```

Suggested test flow:

```txt
Account A creates a trip
Account B requests to join
Account A accepts Account B
Account B refreshes trip detail
Chat unlocks for both accounts
Both accounts send realtime messages
```

