# Sideline live demo (80 seconds)

Prepare before presenting:

1. Run `PORT=3001 npm run dev` and open http://localhost:3001/app/.
2. Sign in and keep the browser open. Confirm `npm run db:check` succeeds.
3. Open the two-slide Sideline demo deck. Use a disposable demo entry for deletion.
4. Verify the browser can access Supabase and close unrelated tabs.

## Slide 1: architecture (25 seconds)

"Sideline is my personal NFL watchlist. React sends JSON requests to an Express
server. Supabase Auth verifies the user, and Postgres stores the players and
scouting notes. The database also enforces ownership, so every user has a private
watchlist."

## Slide 2: live demo (55 seconds)

Switch to the signed-in browser:

1. Add a demo player, team, position, and one scouting note (Create).
2. Refresh and show that the entry remains (Read and persistence).
3. Edit the note and mark the player as a favorite (Update).
4. Filter favorites, then remove the disposable demo player (Delete).

Close: "All four operations go through authenticated routes and persist in
Supabase. The original CodeBox exercise endpoints still work."

This deck supports a live demo; there is no prerecorded video embedded.
If using the default server port instead, open http://localhost:3000/app/.
