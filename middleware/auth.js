const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET;
if (!secret || !secret.trim()) {
  throw new Error('JWT_SECRET is required. Set it in your local .env before starting the server.');
}

function auth(req, res, next) {
  const match = /^Bearer ([^\s]+)$/i.exec(req.get('Authorization') || '');
  if (!match) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(match[1], secret, { algorithms: ['HS256'] });
    // Require an expiration as well as verifying it; JWTs may otherwise omit exp.
    if (!payload || typeof payload !== 'object' ||
        !Number.isInteger(payload.exp) || typeof payload.sub !== 'string') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.auth = payload;
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

module.exports = auth;
