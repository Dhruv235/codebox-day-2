const express = require('express');
const { requireSession } = require('../middleware/session');
const { service, validateEntry, validateId } = require('../services/watchlistService');

function createWatchlistRouter({ authenticate = requireSession(), store = service } = {}) {
  const router = express.Router();
  router.use(authenticate);
  router.get('/', async (req, res) => res.json({ data: await store.list(req.db, req.user.id) }));
  router.post('/', async (req, res) => {
    const input = validateEntry(req.body);
    res.status(201).json({ data: await store.create(req.db, req.user.id, input) });
  });
  for (const [method, operation] of [['get', 'read'], ['patch', 'update'], ['delete', 'remove']]) {
    router[method]('/:id', async (req, res) => {
      validateId(req.params.id);
      const input = operation === 'update' ? validateEntry(req.body, true) : undefined;
      const entry = await store[operation](req.db, req.user.id, req.params.id, input);
      if (!entry) return res.status(404).json({ error: 'Player not found.' });
      res.json({ data: entry });
    });
  }
  return router;
}

module.exports = createWatchlistRouter;
