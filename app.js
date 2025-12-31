const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Mount routes
const articlesRouter = require('./routes/articles');
app.use('/api/articles', articlesRouter);

module.exports = app;
