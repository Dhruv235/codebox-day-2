---
name: watchlist-api
description: Implements and reviews NFL Watchlist CRUD endpoints. Use when changing watchlist routes, ownership checks, validation, or Supabase queries in this project.
---

# Watchlist API conventions

1. Keep CommonJS on the server. Put HTTP handling in routes, validation and queries in services, and schema changes in supabase/migrations.
2. Authenticate with Supabase Auth for watchlist operations. Never accept the classroom JWT or an owner ID supplied by the browser.
3. Derive owner_id from the verified user. Scope every query by owner_id and enforce row-level security in Postgres too.
4. Accept only player_name, team, position, notes, and status. Reject unknown fields, oversized strings, empty required strings, and invalid enums.
5. Return JSON: 201 for create, 200 for read/update/delete, 400 for invalid input, 401 for missing authentication, and 404 for absent or another user's record.
6. Never return raw database errors, secrets, password hashes, or access tokens in logs. Store browser sessions in HttpOnly cookies.
7. Test CRUD, invalid input, expired sessions, and cross-user access. Distinguish mocked tests from live database checks.

Example: PATCH /api/watchlist/:id with {"status":"favorite"} updates only that field for the signed-in owner. A submitted owner_id is rejected.
