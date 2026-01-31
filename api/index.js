const express = require('express');
const app = express();

app.use(express.json());
app.use(require('cors')());

// Main endpoint
app.get('/api', (req, res) => {
  res.json({
    status: 'online',
    service: 'NOXA DDoS Panel v7.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      attack: 'POST /api/attack',
      status: 'GET /api/status',
      system: 'GET /api/system'
    }
  });
});

// Handle all other API routes
app.all('/api/*', (req, res, next) => {
  // Pass to specific handlers
  next();
});

module.exports = app;
