# TripSync Voice Agent — Day 1 Setup

This is a reversible setup note for the Bolna AI voice-agent experiment. It does not change the existing TripSync runtime, routes, database schema, or CI/CD configuration.

## Current TripSync integration points

- Existing itinerary endpoint: `POST /api/ai/plan-trip`
- Itinerary route already uses JWT authentication and Joi request validation.
- The controller checks that the authenticated user is the trip admin, validates Gemini output, saves the itinerary, and invalidates `trip:<tripId>` in Redis.
- The current endpoint saves the generated itinerary as part of the request. Do not let a voice agent call it until the user has explicitly confirmed the action, or until a separate preview-only flow exists.

Relevant files:
- `backend/src/routes/ai.routes.js`
- `backend/src/controllers/ai.controller.js`
- `backend/src/validations/request.schemas.js`
- `frontend/src/components/TripAiPlanner.jsx`
- `frontend/src/services/api.js`

## Day 1: create and test the agent in Bolna

1. Sign in at https://platform.bolna.ai.
2. Create a new agent named `TripSync Voice Copilot - Dev` in Agent Studio.
3. Configure a short welcome message and a system prompt that gathers destination, trip duration, budget, and travel style.
4. Keep the first version conversational only. Do not configure tools that can create trips, alter expenses, approve members, or write to TripSync.
5. Test it in Bolna's own test/playground flow with English and Hindi/Hinglish examples.
6. Record the resulting agent ID in your private local environment file. Never commit API keys or tokens.

Suggested initial prompt:

> You are TripSync's travel-planning voice assistant. Speak naturally in Hindi, Hinglish, or English based on the user's language. Collect destination, number of days, budget in INR, and travel style. Ask follow-up questions when required information is missing. Summarize the details and ask for confirmation before any action that could save or change data. In this first version, do not claim to have created a trip, searched TripSync's database, or saved an itinerary.

## Environment configuration

Copy `backend/.env.example` to `backend/.env` and fill values locally. Keep `backend/.env` untracked.

- `BOLNA_API_KEY`: secret API key from the Bolna dashboard.
- `BOLNA_AGENT_ID`: ID of the test agent created above.
- `BOLNA_API_BASE_URL`: API origin documented by Bolna. Verify the current API version and endpoint before writing a client; older agent API pages are marked deprecated.

Do not put the Bolna key in the Vite frontend, browser storage, a public repo, logs, or client-side requests. Any later Bolna API call must be made from Express.

## Not implemented yet

- No Bolna API client or webhook endpoint has been added.
- No voice UI has been added to React.
- No TripSync API is exposed as a Bolna tool.
- No live call or account-level agent test has been run from this repository.
- No CI/CD or GitHub Actions configuration was changed.

## Safe next step

After the dashboard agent is tested and its ID is available locally, inspect Bolna's current API v2/tool-calling contract and implement one narrow, authenticated preview workflow. Only save an itinerary after an explicit confirmation, with authorization enforced by TripSync's backend.

## Undo

All Day 1 changes should live on branch `feat/tripsync-bolna-voice-day1`, not `main`. To discard the experiment, delete that feature branch. If the branch is merged later, revert its commit rather than rewriting shared history. No CI/CD files should be touched.
