# Sideline — NFL Watchlist

A personal NFL scouting board built with React, Node.js/Express, Supabase Auth,
and Supabase Postgres. Sign in, create player entries, search/filter your board,
edit scouting notes or favorites, and delete entries. Data persists across refreshes.
Player information is entered manually; this project does not provide live NFL statistics.

## Run

Requires Node.js 22.12+ and npm.

```bash
npm install
cp -n .env.example .env
npm run dev
```

Open **http://localhost:3000/app/**. `npm run dev` builds React before starting
Express. Restart it after code changes. To use the demo deck's port:

```bash
PORT=3001 npm run dev
```

The original `/` response remains `Hello from CodeBox!`.

## Configuration and database

Local `.env` entries:

```dotenv
PORT=3000
JWT_SECRET=your-random-classroom-demo-secret
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Never commit real values. `.env`, `.env.*`, `node_modules/`, and generated `dist/`
are ignored; `.env.example` is tracked with blank placeholders.

For a new Supabase project, run `supabase/migrations/20260930_watchlist.sql` once
in its SQL Editor. The current project already has this table and policies.
The migration creates the table, constraints, owner index, and four row-level
security policies. Anonymous users cannot access the table. Authenticated users
can only access records where `owner_id` matches their verified user ID.

```bash
npm run db:check
npm test
```

The connection check validates the publishable key against Auth settings, then
checks that the watchlist table is reachable and anonymous access is denied.
It does not use the Data API schema root, which requires a secret key.

Create your app account through **Create account**. Confirm your email if prompted,
then sign in. This app account is separate from your Supabase dashboard login.
Configure the Supabase Auth Site URL to your chosen localhost URL when setting up
another project. Sessions expire according to Supabase's settings; sign in again
when prompted. This teaching app intentionally does not implement refresh sessions
or password recovery yet.

## Request flow

The React UI sends same-origin requests to Express. The server validates inputs,
verifies the user's access token through Supabase Auth, and sends that token with
database queries. Postgres applies row-level security. The browser never receives
a service-role key. Its session is in an HttpOnly, SameSite=Strict cookie; production
cookies also require HTTPS.

- `server.js`: middleware, routes, static frontend, JSON errors, and startup.
- `frontend/src/`: React UI and responsive styling.
- `routes/session.js`: sign-up, sign-in, session lookup, and browser sign-out.
- `routes/watchlist.js`: CRUD HTTP handlers.
- `middleware/session.js`: real Supabase user verification.
- `services/watchlistService.js`: validation and owner-scoped database queries.
- `config/supabase.js`: configured, per-request Supabase clients.
- `supabase/migrations/`: database schema and ownership policies.
- `test/`: API regression, session, validation, and security checks.
- `.agents/skills/watchlist-api/`: reusable project API conventions.
- `docs/`: bootcamp exercises and demo runbook.

## API

All `/api/watchlist` routes require a Supabase session cookie:

- `GET /api/watchlist` returns `{ data: [...] }` (200).
- `POST /api/watchlist` creates an entry (201).
- `GET /api/watchlist/:id` returns one owned entry (200).
- `PATCH /api/watchlist/:id` updates supplied fields (200).
- `DELETE /api/watchlist/:id` deletes an owned entry and returns its ID (200).

The mutable fields are `player_name`, `team`, `position`, `notes`, and `status`.
Status is `watching` or `favorite`. Invalid input returns 400, missing/expired
sessions 401, and missing or unowned records 404. Database failures return a
safe 503 response rather than raw infrastructure details.

## Original classroom checks

These public/example routes retain their previous bodies and status codes:

```bash
curl -i http://localhost:3000/
# 200: Hello from CodeBox!
curl -i http://localhost:3000/api/users
# 200: [{"id":1,"name":"Alex"},{"id":2,"name":"Sam"}]
curl -i http://localhost:3000/api/users/1
# 200: {"id":1,"name":"Alex"}
curl -i http://localhost:3000/api/users/999
# 404: {"error":"User not found"}
curl -i http://localhost:3000/api/me
# 401: {"error":"Unauthorized"}
TOKEN=$(npm run --silent token)
curl -i http://localhost:3000/api/me -H "Authorization: Bearer $TOKEN"
# 200: {"id":1,"name":"Alex"}
curl -i http://localhost:3000/api/me -H "Authorization: Bearer x${TOKEN}"
# 401: {"error":"Unauthorized"}
```

The classroom token is a teaching shortcut with a 15-minute expiry. It does not
check credentials and does not authorize watchlist operations. The actual website
uses Supabase Auth. Alex and Sam remain in memory only for the original exercise.
