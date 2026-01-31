const express = require('express');
const app = express();

app.use(express.json());
app.use(require('cors')());

// In-memory store (import dari attack.js)
const { attacks } = require('./attack.js') || { attacks: new Map() };

// GET /api/status - Get attack status
app.get('/api/status', (req, res) => {
    try {
        const attackId = req.query.id;
        
        if (!attackId) {
            // Return all attacks
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
            
            return res.json({
                success: true,
                count: allAttacks.length,
                attacks: allAttacks
            });
        }
        
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
        
        res.json({
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
            requestsPerSecond: elapsed > 0 ? (attackData.requestsSent / elapsed).toFixed(2) : 0,
            startTime: new Date(attackData.startTime).toISOString(),
            estimatedCompletion: new Date(attackData.endTime).toISOString()
        });
        
    } catch (error) {
        console.error('Status error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// GET /api/system - System status
app.get('/api/system', (req, res) => {
    const activeAttacks = Array.from(attacks.values()).filter(a => a.active).length;
    
    res.json({
        success: true,
        system: 'NOXA DDoS Panel v7.0',
        status: 'operational',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
        activeAttacks: activeAttacks,
        totalAttacks: attacks.size
    });
});

module.exports = app;
