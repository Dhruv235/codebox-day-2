const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const jwt = require('jsonwebtoken');

// Tests use an ephemeral key, never the local development secret.
process.env.JWT_SECRET = randomBytes(32).toString('hex');
const app = require('../server');
let server;
let base;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('public routes preserve their exact bodies and statuses', async () => {
  for (const [url, status, body] of [
    ['/', 200, 'Hello from CodeBox!'],
    ['/api/users', 200, '[{"id":1,"name":"Alex"},{"id":2,"name":"Sam"}]'],
    ['/api/users/1', 200, '{"id":1,"name":"Alex"}'],
    ['/api/users/2', 200, '{"id":2,"name":"Sam"}'],
    ['/api/users/999', 404, '{"error":"User not found"}'],
  ]) {
    const response = await fetch(base + url);
    assert.equal(response.status, status);
    assert.equal(await response.text(), body);
    if (url !== '/') assert.match(response.headers.get('content-type'), /^application\/json/);
  }
});

test('local token script issues a 15-minute HS256 token accepted by /api/me', async () => {
  const result = spawnSync(process.execPath, [path.join(__dirname, '../scripts/token.js')], {
    encoding: 'utf8', env: process.env,
  });
  assert.equal(result.status, 0);
  const token = result.stdout.trim();
  const claims = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  assert.equal(claims.sub, '1');
  assert.equal(claims.exp - claims.iat, 900);
  const response = await fetch(base + '/api/me', { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { id: 1, name: 'Alex' });
});

test('protected route rejects missing, malformed, expired, and incorrectly signed tokens', async () => {
  const sign = (payload, options = {}) => jwt.sign(payload, process.env.JWT_SECRET, {
    algorithm: 'HS256', ...options,
  });
  for (const authorization of [
    null,
    'Basic example',
    'Bearer not-a-jwt',
    `Bearer x${sign({ sub: '1' }, { expiresIn: '15m' })}`,
    `Bearer ${sign({ sub: '1' }, { expiresIn: -1 })}`,
    `Bearer ${sign({ sub: '1' })}`,
    `Bearer ${sign({ sub: '1' }, { algorithm: 'HS384', expiresIn: '15m' })}`,
    `Bearer ${jwt.sign({ sub: '1' }, randomBytes(32), { expiresIn: '15m' })}`,
    `Bearer ${sign({ sub: '999' }, { expiresIn: '15m' })}`,
  ]) {
    const response = await fetch(base + '/api/me', {
      headers: authorization ? { Authorization: authorization } : {},
    });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: 'Unauthorized' });
  }
});

test('server and token script fail clearly without JWT_SECRET', () => {
  for (const file of ['server.js', 'scripts/token.js']) {
    const result = spawnSync(process.execPath, [path.join(__dirname, '..', file)], {
      encoding: 'utf8', env: { ...process.env, JWT_SECRET: '' },
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /JWT_SECRET is required/);
  }
});
