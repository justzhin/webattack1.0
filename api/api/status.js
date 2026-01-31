const express = require('express');
const app = express();

app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        service: 'NOXA Visitor Booster v3.0',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        features: [
            'Multi-User Agent Rotation',
            'Proxy Chain Randomization',
            'IP Spoofing',
            'HTTP/HTTPS Support',
            'Real-time Analytics'
        ],
        note: 'Service berjalan optimal di Vercel Serverless'
    });
});

module.exports = app;
