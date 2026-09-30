# Verification on September 30, 2026

- `npm run build`: React production assets built successfully.
- `npm test`: 11 automated tests passed, covering original routes, classroom JWTs,
  session cookies, malformed input, owner-scoped queries, CRUD through injected
  stores, JSON errors, and cross-origin write rejection.
- `npm run db:check`: actual Supabase key accepted and watchlist table reached;
  anonymous SELECT denied as intended.
- Browser against the real Supabase project: account sign-in, create a clearly
  labeled Demo Quarterback, reload and read it, edit its notes, mark as favorite,
  reload, use Favorites filter, and check search empty state.
- Live Postgres policy checks: a different authenticated subject saw 0 rows and
  updated 0 rows. All checks used transactions rolled back afterward.
- Live Postgres Delete check: the owner could delete the temporary demo record
  (1 returned row); rollback restored it. The entry is retained for the demo.
  The browser's final permanent-delete confirmation was not exercised.
- Codex discovered the project `watchlist-api` skill through `skills/list`.
- Official docs MCP initialization, tool discovery, search, and fetch succeeded.
- Two-slide presentation exported and visually checked; the demo is live, not an
  embedded recording. An 80-second presenter runbook accompanies it.

The application is local, not publicly deployed. Deployment was optional in the
slides. A real multi-user production release would need broader operational
hardening, including a shared rate-limit store and account recovery/session refresh.
