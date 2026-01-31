const express = require('express');
const app = express();
const cors = require('cors');

// CORS Configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health Check Endpoint
app.get('/api', (req, res) => {
  res.json({
    status: 'online',
    service: 'NOXA DDoS Panel v6.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      attack: 'POST /api/attack',
      status: 'GET /api/status/:id',
      stop: 'POST /api/stop/:id',
      system: 'GET /api/system'
    }
  });
});

// Redirect all other /api/* to specific handlers
app.all('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      'POST /api/attack',
      'GET /api/status/:id',
      'POST /api/stop/:id',
      'GET /api/system'
    ]
  });
});

// Handle preflight requests
app.options('*', cors());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 NOXA Panel running on port ${PORT}`);
});

module.exports = app;
