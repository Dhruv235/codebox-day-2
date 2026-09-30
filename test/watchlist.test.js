const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const cookieParser = require('cookie-parser');
const { randomUUID } = require('node:crypto');
const createWatchlistRouter = require('../routes/watchlist');
const createSessionRouter = require('../routes/session');
const { requireSession } = require('../middleware/session');
const { validateEntry, service } = require('../services/watchlistService');

async function withServer(app, run) {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve => server.close(resolve)); }
}

test('validation rejects ownership injection and malformed fields', () => {
  const valid = { player_name: ' Test Player ', team: 'Test Team', position: 'QB' };
  assert.deepEqual(validateEntry(valid), { player_name: 'Test Player', team: 'Test Team', position: 'QB', notes: '', status: 'watching' });
  for (const input of [null, [], {}, { ...valid, owner_id: randomUUID() }, { ...valid, player_name: ' ' },
    { ...valid, notes: 'a'.repeat(1001) }, { ...valid, position: 'INVALID' }, { ...valid, status: 'admin' }]) {
    assert.throws(() => validateEntry(input), { status: 400 });
  }
  assert.throws(() => validateEntry({}, true), { status: 400 });
  assert.deepEqual(validateEntry({ status: 'favorite' }, true), { status: 'favorite' });
});

test('HTTP CRUD round trip, 404, invalid IDs, and validation (injected store)', async () => {
  const records = new Map();
  const store = {
    list: async () => [...records.values()],
    create: async (db, owner, input) => { const row = { ...input, id: randomUUID(), owner_id: owner }; records.set(row.id, row); return row; },
    read: async (db, owner, id) => records.get(id),
    update: async (db, owner, id, input) => { if (!records.has(id)) return null; const row = { ...records.get(id), ...input }; records.set(id, row); return row; },
    remove: async (db, owner, id) => { if (!records.has(id)) return null; records.delete(id); return { id }; },
  };
  const app = express(); app.use(express.json());
  app.use('/api/watchlist', createWatchlistRouter({ store, authenticate: (req, res, next) => { req.user = { id: 'owner-1' }; next(); } }));
  app.use((error, req, res, next) => res.status(error.status || 500).json({ error: error.message }));
  await withServer(app, async base => {
    const request = (suffix = '', method = 'GET', body) => fetch(base + '/api/watchlist' + suffix, { method,
      headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const created = await request('', 'POST', { player_name: 'Demo Player', team: 'Demo Team', position: 'WR' });
    assert.equal(created.status, 201); const { data: row } = await created.json();
    assert.equal(row.owner_id, 'owner-1');
    assert.equal((await (await request()).json()).data.length, 1);
    assert.equal((await request('/' + row.id)).status, 200);
    const updated = await request('/' + row.id, 'PATCH', { notes: 'Great hands', status: 'favorite' });
    assert.equal(updated.status, 200); assert.equal((await updated.json()).data.notes, 'Great hands');
    assert.equal((await request('/' + row.id, 'PATCH', { owner_id: 'owner-2' })).status, 400);
    assert.equal((await request('/not-a-uuid')).status, 400);
    assert.equal((await request('/' + row.id, 'DELETE')).status, 200);
    assert.equal((await request('/' + row.id)).status, 404);
    assert.equal((await request('/' + row.id, 'PATCH', { notes: 'Missing' })).status, 404);
    assert.equal((await (await request()).json()).data.length, 0);
  });
});

test('every database operation derives or filters the verified owner', async () => {
  const calls = [];
  const query = new Proxy({}, { get: (target, method) => method === 'then'
    ? resolve => resolve({ data: [], error: null })
    : (...args) => { calls.push([method, ...args]); return query; } });
  const db = { from: () => query };
  for (const operation of ['list', 'read', 'update', 'remove']) {
    calls.length = 0;
    await service[operation](db, 'verified-owner', randomUUID(), { notes: 'test' });
    assert.ok(calls.some(call => call[0] === 'eq' && call[1] === 'owner_id' && call[2] === 'verified-owner'), operation);
  }
  calls.length = 0;
  await service.create(db, 'verified-owner', { player_name: 'test', owner_id: 'forged-owner' });
  assert.equal(calls.find(call => call[0] === 'insert')[1].owner_id, 'verified-owner');
});

test('database errors do not expose internal details', async () => {
  const query = new Proxy({}, { get: (target, key) => key === 'then'
    ? resolve => resolve({ error: { message: 'private connection string' } }) : () => query });
  await assert.rejects(service.list({ from: () => query }, 'owner'), { message: 'Database request failed. Please try again.', status: 503 });
});

test('session middleware rejects missing and expired tokens and sets verified identity', async () => {
  const app = express(); app.use(cookieParser());
  const client = token => ({ auth: { getUser: async () => token === 'valid' ? { data: { user: { id: 'verified' } } } : { data: {}, error: {} } } });
  app.get('/', requireSession(client), (req, res) => res.json({ id: req.user.id }));
  await withServer(app, async base => {
    assert.equal((await fetch(base)).status, 401);
    assert.equal((await fetch(base, { headers: { Cookie: 'watchlist_session=expired' } })).status, 401);
    const valid = await fetch(base, { headers: { Cookie: 'watchlist_session=valid' } });
    assert.deepEqual(await valid.json(), { id: 'verified' });
  });
});

test('sign-in returns a protected cookie, sign-up handles email confirmation, and sign-out clears it', async () => {
  const fakeClient = () => ({ auth: {
    signInWithPassword: async () => ({ data: { user: { id: 'test-id', email: 'test@example.com' }, session: { access_token: 'test-token', expires_in: 3600 } } }),
    signUp: async () => ({ data: { session: null } }),
  } });
  const app = express(); app.use(express.json()); app.use(createSessionRouter(fakeClient));
  await withServer(app, async base => {
    const post = (url, body) => fetch(base + url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    assert.equal((await post('/sign-in', { email: 'bad', password: 'short' })).status, 400);
    const signedIn = await post('/sign-in', { email: 'test@example.com', password: 'long-test-password' });
    assert.equal(signedIn.status, 200);
    assert.match(signedIn.headers.get('set-cookie'), /HttpOnly/);
    assert.match(signedIn.headers.get('set-cookie'), /SameSite=Strict/);
    assert.equal((await signedIn.json()).access_token, undefined);
    assert.equal((await post('/sign-up', { email: 'test@example.com', password: 'long-test-password' })).status, 202);
    const signedOut = await post('/sign-out', {});
    assert.match(signedOut.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/);
  });
});
