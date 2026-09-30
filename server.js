require('dotenv').config({ quiet: true });

const express = require('express');
const path = require('node:path');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const createSessionRouter = require('./routes/session');
const createWatchlistRouter = require('./routes/watchlist');
const usersRouter = require('./routes/users');
const meRouter = require('./routes/me');

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(helmet({ contentSecurityPolicy: { directives: { upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null } } }));
app.use(express.json({ limit: '16kb' }));
app.use(cookieParser());
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    if (req.get('Sec-Fetch-Site') === 'cross-site') return res.status(403).json({ error: 'Cross-site request rejected.' });
    const origin = req.get('Origin');
    if (origin && origin !== `${req.protocol}://${req.get('host')}`) return res.status(403).json({ error: 'Cross-site request rejected.' });
    if (!req.is('application/json')) return res.status(415).json({ error: 'Use application/json.' });
  }
  next();
});

app.get('/', (req, res) => {
  res.send('Hello from CodeBox!');
});

app.use('/api/users', usersRouter);
app.use('/api/me', meRouter);
app.use('/api/session', createSessionRouter());
app.use('/api/watchlist', createWatchlistRouter());
app.use('/app', express.static(path.join(__dirname, 'dist')));
app.use('/api', (req, res) => res.status(404).json({ error: 'Route not found.' }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.type === 'entity.parse.failed' ? 400 : error.type === 'entity.too.large' ? 413 : error.status === 400 ? 400 : error.status === 503 ? 503 : 500;
  res.status(status).json({ error: status === 400 ? (error.type ? 'Invalid JSON.' : error.message) : status === 413 ? 'Request too large.' : status === 503 ? 'Database unavailable. Check the connection and table setup.' : 'An unexpected error occurred.' });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

module.exports = app;
