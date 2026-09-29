require('dotenv').config({ quiet: true });

const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;

if (!secret || !secret.trim()) {
  console.error('JWT_SECRET is required. Set it in your local .env before generating a token.');
  process.exit(1);
}

// Teaching shortcut: this signs for user 1 without checking any credentials.
const token = jwt.sign({}, secret, {
  algorithm: 'HS256',
  subject: '1',
  expiresIn: '15m',
});

console.log(token);
