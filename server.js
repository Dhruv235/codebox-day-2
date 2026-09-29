require('dotenv').config({ quiet: true });

const express = require('express');
const usersRouter = require('./routes/users');
const meRouter = require('./routes/me');

const app = express();
const port = Number(process.env.PORT || 3000);

app.get('/', (req, res) => {
  res.send('Hello from CodeBox!');
});

app.use('/api/users', usersRouter);
app.use('/api/me', meRouter);

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

module.exports = app;
