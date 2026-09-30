const express = require('express');
const { rateLimit } = require('express-rate-limit');
const { getSupabase } = require('../config/supabase');
const { requireSession, cookieName, cookieOptions } = require('../middleware/session');

function createSessionRouter(createClient = getSupabase) {
  const router = express.Router();
  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false,
    message: { error: 'Too many attempts. Please try again in 15 minutes.' } });
  for (const action of ['sign-in', 'sign-up']) {
    router.post(`/${action}`, limiter, async (req, res) => {
      const { email, password } = req.body || {};
      if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
          typeof password !== 'string' || password.length < 8 || password.length > 128) {
        return res.status(400).json({ error: 'Enter a valid email and a password of 8–128 characters.' });
      }
      try {
        const client = createClient();
        const method = action === 'sign-in' ? 'signInWithPassword' : 'signUp';
        const { data, error } = await client.auth[method]({ email: email.trim(), password });
        if (error) {
          return res.status(action === 'sign-in' ? 401 : 400).json({ error: action === 'sign-in'
            ? 'Unable to sign in. Check your email, password, and email confirmation.'
            : 'Unable to create your account. Try signing in, or try again later.' });
        }
        if (!data.session) {
          return res.status(202).json({ message: 'Check your email to confirm your account, then come back and sign in.' });
        }
        res.cookie(cookieName, data.session.access_token, { ...cookieOptions(), maxAge: data.session.expires_in * 1000 });
        res.status(action === 'sign-up' ? 201 : 200).json({ user: { id: data.user.id, email: data.user.email } });
      } catch {
        res.status(503).json({ error: 'Sign-in service unavailable. Check the Supabase configuration.' });
      }
    });
  }
  router.get('/', requireSession(createClient), (req, res) => res.json({ user: { id: req.user.id, email: req.user.email } }));
  router.post('/sign-out', (req, res) => {
    res.clearCookie(cookieName, cookieOptions());
    res.json({ message: 'Signed out on this browser.' });
  });
  return router;
}

module.exports = createSessionRouter;
