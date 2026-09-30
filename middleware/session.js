const { getSupabase } = require('../config/supabase');

const cookieName = 'watchlist_session';
const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api' });

function requireSession(createClient = getSupabase) {
  return async (req, res, next) => {
    const token = req.cookies?.[cookieName];
    if (!token) return res.status(401).json({ error: 'Sign in to continue.' });
    try {
      const client = createClient(token);
      const { data, error } = await client.auth.getUser(token);
      if (error || !data.user) {
        res.clearCookie(cookieName, cookieOptions());
        return res.status(401).json({ error: 'Your session expired. Please sign in again.' });
      }
      req.user = data.user;
      req.db = client;
      next();
    } catch {
      res.status(503).json({ error: 'Authentication is unavailable. Please try again.' });
    }
  };
}

module.exports = { requireSession, cookieName, cookieOptions };
