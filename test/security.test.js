const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
process.env.JWT_SECRET = randomBytes(32).toString('hex');
const app = require('../server');

test('write requests require JSON and same-origin browser context; protected data is not cached', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const call = (headers, body = '{}') => fetch(base + '/api/session/sign-out', { method: 'POST', headers, body });
    assert.equal((await call({ 'Content-Type': 'text/plain' })).status, 415);
    assert.equal((await call({ 'Content-Type': 'application/json', Origin: 'https://untrusted.example' })).status, 403);
    assert.equal((await call({ 'Content-Type': 'application/json' }, '{')).status, 400);
    // Match the browser's delete request: JSON header and an actual JSON body.
    // Without a body, req.is() returns null and the JSON guard rejects it.
    const deletion = await fetch(base + '/api/watchlist/00000000-0000-0000-0000-000000000001', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: '{}',
    });
    assert.equal(deletion.status, 401); // Reaches authentication, not a 415 rejection.
    const response = await fetch(base + '/api/watchlist');
    assert.equal(response.status, 401);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.match(response.headers.get('content-security-policy'), /default-src 'self'/);
    const demoToken = require('jsonwebtoken').sign({ sub: '1' }, process.env.JWT_SECRET, { expiresIn: '15m' });
    assert.equal((await fetch(base + '/api/watchlist', { headers: { Authorization: `Bearer ${demoToken}` } })).status, 401);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
