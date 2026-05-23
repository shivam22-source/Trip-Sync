# TripSync Frontend Guide

This guide explains the Phase 5 frontend in simple language so you can understand it, debug it, and explain it in an interview.

Phase 5 goal:

```txt
Make TripSync feel like a real usable MVP, not only static React screens.
```

## Big Picture

The frontend is responsible for:

- showing pages
- protecting private pages
- storing the login token
- sending API requests to the backend
- showing loading, error, empty, and success states
- updating the UI after user actions
- connecting to Socket.io for realtime chat

The backend is responsible for:

- validating users
- saving data in MongoDB
- checking authorization
- sending API responses
- handling Socket.io rooms and messages

## Important Files

```txt
src/App.jsx
```

Defines all frontend routes.

```txt
src/components/ProtectedRoute.jsx
```

Blocks private pages when no token exists.

```txt
src/services/api.js
```

Central place for API calls, token reading, token saving, and request headers.

```txt
src/pages/LoginPage.jsx
```

Login and register form.

```txt
src/pages/TripsPage.jsx
```

Fetch trips, filter trips, and create a new trip.

```txt
src/pages/TripDetailsPage.jsx
```

Show one trip, join request status, admin request controls, and chat section.

```txt
src/components/TripChat.jsx
```

Fetch old messages, connect socket, send messages, receive realtime messages, and auto-scroll.

```txt
src/pages/ProfilePage.jsx
```

Fetch profile and update name, bio, vibe, budget, smoking, and drinking.

## Environment Variables

Local defaults:

```txt
API:    http://localhost:5000/api
Socket: http://localhost:5000
```

For deployment:

```bash
VITE_API_URL=https://your-backend-url.com/api
VITE_SOCKET_URL=https://your-backend-url.com
```

## Auth Flow

When user logs in or registers:

```txt
form submit
↓
POST /api/auth/login or /api/auth/register
↓
backend returns token and user
↓
frontend saves token in localStorage
↓
user goes to /trips
```

The token is saved with this key:

```txt
tripSyncToken
```

For protected backend APIs, the frontend sends:

```http
Authorization: Bearer <token>
```

Interview explanation:

```txt
I implemented JWT persistence on the frontend. After login, the token is stored in localStorage. A reusable API helper reads that token and attaches it to protected requests using the Authorization header.
```

## Protected Routes

Protected pages:

```txt
/trips
/trips/:id
/profile
```

Flow:

```txt
open protected route
↓
ProtectedRoute checks localStorage token
↓
token exists: render page
↓
token missing: redirect to /login
```

Code idea:

```jsx
if (!token) {
  return <Navigate to="/login" replace />;
}
```

Interview explanation:

```txt
I protected private frontend routes with a wrapper component. It checks if a JWT exists. If the user is not logged in, React Router redirects them to the login page.
```

## Logout Flow

Flow:

```txt
click logout
↓
remove token and user from localStorage
↓
navigate to /login
```

This is handled in:

```txt
src/components/Navbar.jsx
```

Interview explanation:

```txt
Logout clears the persisted auth data and redirects the user. Because protected routes depend on the token, private pages become unavailable after logout.
```

## Profile Update Flow

Editable fields:

- name
- bio
- vibe
- budget
- smoking
- drinking

Flow:

```txt
open /profile
↓
GET /api/users/profile
↓
fill form state with existing user data
↓
user edits form
↓
PATCH /api/users/profile
↓
backend updates MongoDB
↓
frontend updates local UI and stored user
```

Concepts learned:

- controlled inputs
- prefilled form state
- PATCH requests
- loading and saving states
- keeping localStorage in sync after update

Interview explanation:

```txt
The profile page uses controlled form inputs. First I fetch the user profile, then I populate form state. On submit I send a PATCH request and update both React state and localStorage with the returned user.
```

## Trip Creation Flow

Fields:

- title
- destination
- description
- start date
- end date
- category
- budget
- max members

Flow:

```txt
fill trip form
↓
POST /api/trips
↓
backend creates trip
↓
frontend navigates to /trips/:id
```

Important idea:

```txt
After creation, redirecting to the detail page makes the workflow feel complete.
```

Interview explanation:

```txt
Trip creation is a controlled form. After a successful POST request, I use the trip id returned from the backend to navigate directly to the new trip detail page.
```

## Join Request Workflow

User side states:

```txt
none     → show Request to join button
pending  → show Request pending badge
accepted → show accepted badge and unlock chat
rejected → show rejected badge
```

Admin side:

```txt
admin opens trip
↓
GET /api/trips/:tripId/requests
↓
admin sees pending requests
↓
admin clicks accept or reject
↓
PATCH accept/reject endpoint
↓
UI refreshes
```

Concepts learned:

- role-based rendering
- conditional UI
- state refresh after action
- backend authorization

Interview explanation:

```txt
The trip detail page renders different controls based on the current user's role and request status. Normal users see join state, while admins see pending requests with accept and reject actions.
```

## Chat Flow

Chat is allowed for:

```txt
trip admin
accepted trip members
```

Flow:

```txt
open trip detail
↓
check if user can chat
↓
fetch previous messages with REST API
↓
connect socket using JWT
↓
emit join-trip event
↓
send-message emits new message
↓
receive-message updates React state realtime
↓
auto-scroll moves to latest message
```

Socket events used:

```txt
Client emits: join-trip
Client emits: send-message
Server emits: receive-message
Server emits: error-message
```

Important lifecycle idea:

```txt
useEffect creates the socket when chat opens.
The cleanup function disconnects the socket when the component unmounts.
```

Interview explanation:

```txt
I separated realtime chat into a TripChat component. It fetches old messages through REST, then opens a Socket.io connection with the JWT token. Incoming messages are appended to React state, and cleanup disconnects the socket to avoid duplicate listeners.
```

## Loading, Error, Empty, Success States

Loading examples:

- loading trips
- creating trip
- loading profile
- saving profile
- connecting socket

Error examples:

- invalid login
- unauthorized route
- trip full
- backend down
- socket connection error

Empty examples:

- no trips found
- no pending requests
- no messages yet

Success examples:

- profile updated
- join request sent
- request accepted
- request rejected

Interview explanation:

```txt
I added user feedback for async work. Each workflow has loading, error, empty, and success states so the user understands what is happening.
```

## APIs Used By Frontend

```txt
POST   /api/auth/register
POST   /api/auth/login
GET    /api/users/profile
PATCH  /api/users/profile
GET    /api/trips
POST   /api/trips
GET    /api/trips/:id
POST   /api/trips/:id/join
GET    /api/trips/:tripId/requests
PATCH  /api/trips/:tripId/accept/:memberId
PATCH  /api/trips/:tripId/reject/:memberId
DELETE /api/trips/:id
GET    /api/messages/:tripId
PATCH  /api/messages/read/:tripId
```

## How To Run

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

Open:

```txt
http://localhost:5173
```

## How To Explain Project In Interview

Short answer:

```txt
TripSync is a full-stack trip collaboration MVP. Users can register, login, create trips, request to join trips, admins can approve or reject members, and accepted members can chat in realtime.
```

Frontend answer:

```txt
On the frontend I used React Router for navigation and protected routes, a reusable API service for fetch calls and JWT headers, controlled forms for login/profile/trip creation, conditional rendering for admin/member states, and Socket.io client for realtime chat.
```

Backend answer:

```txt
The backend uses Express, MongoDB, JWT auth middleware, protected REST routes, and Socket.io rooms for trip chat. MongoDB stores users, trips, members, and messages.
```

Best learning answer:

```txt
The biggest learning was moving from static UI to real product workflows: auth persistence, protected routes, async loading/error states, role-based rendering, form updates, and realtime state synchronization.
```
