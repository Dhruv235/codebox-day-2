# Bootcamp exercise record

## Day 1 and Day 2

The project runs locally through npm, uses Express JSON routes, separates handlers
and services, loads environment configuration, excludes secrets from Git, and has
a GitHub repository. The original sample API and JWT demonstration are preserved.

## Day 3: a reusable skill

Created `.agents/skills/watchlist-api/SKILL.md` with a specific trigger for changing
watchlist routes, validation, ownership checks, and Supabase queries.
Read and applied it during implementation: mutable-field allowlisting, owner IDs
from verified sessions, owner-scoped queries, safe JSON errors, and security tests.

Its input is a request to change a watchlist endpoint. Its expected output is a
validated endpoint that enforces ownership and includes meaningful tests.

Discovery check for a new Codex session opened in this repository:

> Add a watchlist validation rule and follow the applicable project conventions.

The agent should load `watchlist-api` from its description. Explicit invocation:

> Using $watchlist-api, review PATCH /api/watchlist/:id for ownership validation.

Verified automatic repository discovery through Codex app-server `skills/list`
with this repository as the working directory. The result included `watchlist-api`.
The skill was explicitly read and applied in this task. The prompts above can be
used to practice implicit selection in a fresh project-scoped task.

## Day 3: a real MCP server

Connected the official read-only OpenAI documentation MCP server to Codex:

```bash
codex mcp add openaiDeveloperDocs --url https://developers.openai.com/mcp
codex mcp get openaiDeveloperDocs
```

Verified an MCP initialize response identifying `openai-docs-mcp`, listed its tools,
and called `search_openai_docs` and `fetch_openai_doc`. The plain-language question
was: "Where should a repository skill SKILL.md live in Codex and how is it selected
automatically?"

The fetched documentation explains repository `.agents/skills` discovery and
matching against each skill's description. This server needs no private account
credentials and was used only to read documentation. It is a development tool,
not part of the running website. A new Codex task may be needed to expose the newly
configured tools directly in its tool list.

Source: https://learn.chatgpt.com/docs/build-skills
Setup: https://developers.openai.com/learn/docs-mcp

## Focused review passes

- Logic: checked all CRUD statuses, field validation, missing records, and database failures.
- Security: checked owner scoping, live row-level security, HttpOnly cookies,
  cross-origin write rejection, JSON-only writes, and auth rate limiting.
- Tests: regression and negative tests run with `npm test`. Store-injected tests
  are explicitly labeled; they do not pretend to exercise a real database.
- Style: CommonJS backend, separate routes/services/configuration, and React components.

These were review passes in the current task, not four independent subagents.
Subagents, OAuth, rate limiting, and deployment examples in the lessons are learning
material; not every example is a separate required product feature.

## Optional deployment

Vercel deployment is a bonus in the Day 3 deck. This version runs locally. It has
not been deployed publicly. A production deployment needs HTTPS, appropriate
Supabase Auth URLs, environment variables on the host, and a shared rate-limit
store if multiple server instances are used.
