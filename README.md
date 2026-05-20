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
- Cloudinary-backed image display

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
- Upload profile picture with Cloudinary

Implementation flow:

```txt
Open /profile
Frontend calls GET /api/users/profile
Form is filled with existing user data
User edits fields
If user selects profile picture, frontend sends multipart FormData
Backend uploads profile picture to Cloudinary
Backend stores profilePhoto URL in MongoDB
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
- Upload trip cover image with Cloudinary

Trip form fields:

- title
- destination
- description
- start date
- end date
- category
- budget
- max members
- cover image
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
If cover image exists, request uses multipart FormData
Backend uploads image to Cloudinary
Backend creates trip with current user as admin
Backend stores Cloudinary coverImage URL
Backend stores admin as first member
Frontend navigates to /trips/:id
```

Image upload note:

```txt
Multipart/FormData is used only when a file enters the system.
After Cloudinary returns a URL, MongoDB stores normal JSON-like fields.
GET APIs still return JSON.
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
Backend creates Notification for trip admin
Backend emits notification:new to admin socket room
Admin opens trip detail
Frontend calls GET /api/trips/:tripId/requests
Admin accepts or rejects request
Backend updates Member status
Backend creates accepted/rejected Notification for requester
Backend emits notification:new to requester socket room
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
- online member presence
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
Backend emits trip-presence when members join/leave
Frontend shows online count and online member names
```

### Expense Splitter

The trip detail page includes a backend-connected expense splitter dashboard:

- Balance hero with "You Owe", "You Are Owed", and net balance
- Add expense modal with amount, description, category, receipt screenshot, and split equally toggle
- Recent expenses list with category icon, payer, total amount, receipt name, and date
- Personal settle-up plan that shows only payments involving the logged-in user
- Per-transaction "Mark Paid" button
- Trip-member access control for expense reads and writes

Current implementation:

```txt
frontend/src/components/expenses/ExpenseDashboard.jsx
frontend/src/components/expenses/BalanceHero.jsx
frontend/src/components/expenses/ExpenseCard.jsx
frontend/src/components/expenses/ExpenseModal.jsx
frontend/src/components/expenses/SettlementSummary.jsx

backend/src/models/Expense.js
backend/src/models/Settlement.js
backend/src/controllers/expense.controller.js
backend/src/routes/expense.routes.js
```

API routes:

```txt
GET  /api/expenses/:tripId
POST /api/expenses/:tripId
POST /api/expenses/:tripId/settle
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

Settlement fields:

```txt
tripId
from
to
amount
settledBy
```

Only the trip admin and accepted trip members can view or add expenses. The frontend loads expenses with `GET /api/expenses/:tripId`, saves new expenses with `POST /api/expenses/:tripId`, and marks one payment settled with `POST /api/expenses/:tripId/settle`.

Receipt screenshot flow:

```txt
User selects screenshot in Add Expense modal
Frontend sends receipt metadata/image reference through expense flow
Backend stores receiptName and receiptImage/receipt URL on the Expense document
Future AI/OCR agent can read receipt image URL and auto-fill amount, category, date, and description
```

For production, store receipt images in Cloudinary, S3, or another object store, then save only the hosted receipt URL in MongoDB.

Equal split and settlement flow:

```txt
expenseShare = expense.amount / acceptedMembers.length

For each expense:
  every member gets debited by expenseShare
  payer gets credited by full expense amount

After all expenses:
  positive balance = should receive money
  negative balance = should pay money

Backend matches debtors to creditors:
  debtor pays creditor the minimum remaining amount

Frontend only receives rows involving the logged-in user:
  "You pay Shivam Rs 600"
  "Rahul pays You Rs 400"

When user clicks Mark Paid:
  backend stores a Settlement document
  backend subtracts that payment from future balances
  backend emits payment-settled notification
```

Interview explanation:

```txt
I keep expenses immutable and store payments separately as settlements.
The balance is calculated from expenses minus already-settled payments.
This means marking a payment paid does not delete or edit the original expense history.
Each user only sees settlement rows that involve them, so the UI stays personal and private.
```

For unequal splits later, store participant shares per expense instead of using one equal share for every accepted member.

### Notification Center

Notifications cover:

- join request sent to trip admin
- request accepted sent to requester
- request rejected sent to requester
- expense added sent to other trip members
- payment settled sent to the other person in that transaction

Current implementation:

```txt
frontend/src/components/notifications/NotificationBell.jsx
frontend/src/components/notifications/NotificationDropdown.jsx
frontend/src/components/notifications/NotificationItem.jsx
frontend/src/hooks/useNotifications.js
frontend/src/services/notification.service.js

backend/src/models/Notification.js
backend/src/controllers/notification.controller.js
backend/src/routes/notification.routes.js
backend/src/sockets/chat.socket.js
```

API routes:

```txt
GET   /api/notifications
PATCH /api/notifications/read-all
PATCH /api/notifications/:notificationId/read
```

Notification fields:

```txt
receiver
sender
tripId
type
message
isRead
```

Realtime notification flow:

```txt
Backend saves Notification in MongoDB
Backend emits notification:new to receiver's private Socket.io room
Frontend useNotifications hook receives notification:new
Hook calls GET /api/notifications
Bell badge and dropdown update from fresh API data
```

Important design choice:

```txt
REST is the source of truth.
Socket.io is only a refresh signal.
If a socket event is missed, the next API fetch still gives correct data.
```

Interview explanation:

```txt
I did not replace REST with sockets.
When something happens, the backend writes the notification to MongoDB first.
Then it emits notification:new to the receiver.
The frontend listens for that event and refetches notifications using the same REST endpoint.
This keeps realtime behavior simple and avoids duplicated notification state.
```

### Cloudinary Media Uploads

Cloudinary is used for user-facing images:

- profile pictures
- trip cover images
- receipt images / receipt URLs for future AI extraction

Current implementation:

```txt
backend/src/config/cloudinary.js
backend/src/middleware/upload.middleware.js
```

Media upload flow:

```txt
Frontend sends multipart FormData
Multer reads file into memory
Backend uploads file buffer to Cloudinary
Cloudinary returns secure_url
Backend stores secure_url in MongoDB
Frontend renders image from URL
```

Why this design:

```txt
MongoDB stores metadata and URLs, not large image files.
Cloudinary handles image storage and delivery.
The rest of the app continues to use JSON responses.
```

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

Realtime chat UI, socket lifecycle, and online member presence.

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

Also stores:

```txt
profilePhoto
```

```txt
Trip.js
```

Stores trip details, admin, budget range, filters, status, and members.

Also stores:

```txt
coverImage
```

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

```txt
Expense.js
```

Stores trip expenses, payer, amount, category, split mode, and receipt metadata.

```txt
Settlement.js
```

Stores per-transaction payments marked as paid.

```txt
Notification.js
```

Stores join request, approval, rejection, expense, and settlement notifications.

### Middleware

```txt
auth.middleware.js
```

Checks JWT for protected REST APIs.

```txt
socket.middleware.js
```

Checks JWT for Socket.io connections.

```txt
upload.middleware.js
```

Handles multipart image uploads with Multer memory storage.

## API Reference

### Auth

```txt
POST /api/auth/register
POST /api/auth/login
```

### User

```txt
GET   /api/users/profile
PATCH /api/users/profile  multipart supported for profilePhoto
```

### Trips

```txt
GET    /api/trips
POST   /api/trips  multipart supported for coverImage
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

### Expenses

```txt
GET  /api/expenses/:tripId
POST /api/expenses/:tripId
POST /api/expenses/:tripId/settle
```

### Notifications

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
Account A uploads a trip cover image
Account B requests to join
Account A receives realtime notification
Account A accepts Account B
Account B receives accepted notification
Chat unlocks for both accounts
Both accounts appear online in chat
Both accounts send realtime messages
One account adds expense
Other account receives expense notification
Settlement plan shows who needs to pay whom
User marks one payment paid
Balances update
```
