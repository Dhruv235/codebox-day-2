const express = require('express');
const auth = require('../middleware/auth');
const userService = require('../services/userService');

const router = express.Router();

router.get('/', auth, (req, res) => {
  const user = userService.getUserById(req.auth.sub);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.status(200).json(user);
});

module.exports = router;
