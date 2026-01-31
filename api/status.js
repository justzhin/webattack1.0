const express = require('express');
const Redis = require('ioredis');

const app = express();
app.use(express.json());
app.use(require('cors')());

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Get attack status
app.get('/api/status/:id', async (req, res) => {
    try {
        const attackId = req.params.id;
        const attackData = await redis.get(`attack:${attackId}`);
        
        if (!attackData) {
            return res.status(404).json({ 
                success: false, 
                error: 'Attack not found' 
            });
        }
        
        const attack = JSON.parse(attackData);
        const now = Date.now();
        const elapsed = Math.floor((now - attack.startTime) / 1000);
        const remaining = Math.max(0, Math.floor((attack.endTime - now) / 1000));
        
        const successRate = attack.requestsSent > 0 
            ? ((attack.requestsSuccess / attack.requestsSent) * 100).toFixed(2)
            : 0;
        
        res.json({
            success: true,
            attackId: attack.id,
            url: attack.url,
            intensity: attack.intensity,
            active: attack.active,
            elapsedTime: elapsed,
            remainingTime: remaining,
            requestsSent: attack.requestsSent,
            requestsSuccess: attack.requestsSuccess,
            requestsFailed: attack.requestsFailed,
            successRate: successRate,
            requestsPerSecond: elapsed > 0 ? (attack.requestsSent / elapsed).toFixed(2) : 0,
            startTime: new Date(attack.startTime).toISOString(),
            endTime: new Date(attack.endTime).toISOString()
        });
        
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// System status
app.get('/api/system', async (req, res) => {
    try {
        const keys = await redis.keys('attack:*');
        const attacks = [];
        
        for (const key of keys.slice(0, 10)) {
            const data = await redis.get(key);
            if (data) {
                const attack = JSON.parse(data);
                attacks.push({
                    id: attack.id,
                    url: attack.url,
                    active: attack.active,
                    requestsSent: attack.requestsSent,
                    successRate: ((attack.requestsSuccess / attack.requestsSent) * 100).toFixed(2)
                });
            }
        }
        
        res.json({
            success: true,
            system: 'NOXA DDoS Panel v6.0',
            status: 'operational',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            redis: 'connected',
            activeAttacks: attacks.filter(a => a.active).length,
            totalAttacks: attacks.length,
            recentAttacks: attacks
        });
        
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// List all attacks
app.get('/api/status', async (req, res) => {
    try {
        const keys = await redis.keys('attack:*');
        const attacks = [];
        
        for (const key of keys) {
            const data = await redis.get(key);
            if (data) {
                attacks.push(JSON.parse(data));
            }
        }
        
        res.json({
            success: true,
            count: attacks.length,
            attacks: attacks.map(a => ({
                id: a.id,
                url: a.url,
                active: a.active,
                requestsSent: a.requestsSent,
                startTime: new Date(a.startTime).toISOString()
            }))
        });
        
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

module.exports = app;
