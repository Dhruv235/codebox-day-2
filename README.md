# CodeBox Express API

Small CommonJS JavaScript/Express app with three JSON API routes and a JWT demonstration.

## Start locally

Requires Node.js 22 or newer and npm.

```bash
npm install
cp -n .env.example .env
```

Set `JWT_SECRET` in `.env` to a random secret. To generate and save one without
printing it (run once on a fresh copy with an empty JWT_SECRET):

```bash
node -e 'const fs=require("node:fs"),crypto=require("node:crypto"),dotenv=require("dotenv");const p=".env",s=fs.readFileSync(p,"utf8");if(!dotenv.parse(s).JWT_SECRET){fs.writeFileSync(p,s.replace(/^JWT_SECRET=.*$/m,"JWT_SECRET="+crypto.randomBytes(32).toString("hex")),{mode:0o600});fs.chmodSync(p,0o600)}'
npm run dev
```

The server uses `PORT` from `.env`, defaulting to 3000. Restart it after editing
code or configuration. Existing local secrets should be kept, not replaced.

## Supabase setup

Create a project at https://supabase.com/dashboard. From its Connect dialog copy
the project URL and publishable API key into the local `.env`:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

These are placeholders. A real project and its values are required. See the
[official API key guide](https://supabase.com/docs/guides/getting-started/api-keys).

```bash
npm run db:check
```

This checks access to the Supabase Data API schema endpoint without requiring
any tables. It fails clearly when configuration is missing, the key is rejected,
or the project cannot be reached. The configured client is in `config/supabase.js`.
The API routes still use the temporary array; this step configures database access,
and does not migrate users or implement persistence. The demo JWT is separate
from Supabase Auth and is not sent to Supabase.

Never commit `.env`. `.gitignore` excludes `.env`, environment variants, and
`node_modules/`; `.env.example` contains only placeholders.

## Verify routes

Run these in a second terminal from the project directory:

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

npm test
```

The local token script is a teaching shortcut: it signs for user 1 without
checking credentials. Tokens use HS256 and expire after 15 minutes. There is
no public token-generation endpoint or login UI.

## Structure and request flow

- `server.js`: configuration, middleware/route mounting, and startup.
- `routes/users.js`: public user HTTP handlers.
- `routes/me.js`: protected profile handler.
- `middleware/auth.js`: verifies the Bearer JWT signature, algorithm, and expiry.
- `services/userService.js`: sample array and lookup logic.
- `config/supabase.js`: environment validation and Supabase client creation.
- `scripts/`: local token generation and database connectivity check.
- `test/`: HTTP response and JWT regression checks.

`/api/users/1` enters `server.js`, reaches the users router, calls the user
service, and returns JSON. `/api/me` additionally passes through the auth
middleware before looking up the token's subject.
