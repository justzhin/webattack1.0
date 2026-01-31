let currentAttackId = null;
let updateInterval = null;
let requestCount = 0;
let successCount = 0;

// DOM Elements
const targetUrl = document.getElementById('targetUrl');
const intensity = document.getElementById('intensity');
const intensityValue = document.getElementById('intensityValue');
const duration = document.getElementById('duration');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusText = document.getElementById('statusText');
const statusIndicator = document.getElementById('statusIndicator');
const currentAttack = document.getElementById('currentAttack');
const logContainer = document.getElementById('logContainer');
const statRequests = document.getElementById('statRequests');
const statSuccess = document.getElementById('statSuccess');
const statDuration = document.getElementById('statDuration');
const statSpeed = document.getElementById('statSpeed');

// Update intensity value display
intensity.addEventListener('input', () => {
    intensityValue.textContent = intensity.value;
});

// Add log entry
function addLog(message, type = 'info') {
    const now = new Date();
    const timeString = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;
    
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.innerHTML = `
        <span class="log-time">${timeString}</span>
        <span class="log-message">${message}</span>
    `;
    
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

// Update stats display
function updateStats(data) {
    statRequests.textContent = data.requestsSent.toLocaleString();
    statSuccess.textContent = data.successRate + '%';
    statDuration.textContent = data.elapsedTime + 's';
    statSpeed.textContent = Math.round(data.requestsSent / data.elapsedTime) + '/s';
    
    requestCount = data.requestsSent;
    successCount = data.requestsSuccess;
}

// Check attack status
async function checkAttackStatus() {
    if (!currentAttackId) return;
    
    try {
        const response = await fetch(`/api/attack/${currentAttackId}`);
        const data = await response.json();
        
        if (data.error) {
            stopMonitoring();
            addLog(`Attack stopped: ${data.error}`, 'error');
            return;
        }
        
        updateStats(data);
        statusText.textContent = `Attacking ${data.url}`;
        currentAttack.textContent = `Target: ${data.url} • Intensity: ${data.intensity} req/s • Remaining: ${data.remainingTime}s`;
        
    } catch (error) {
        console.error('Status check failed:', error);
    }
}

// Start monitoring
function startMonitoring() {
    updateInterval = setInterval(checkAttackStatus, 1000);
    statusIndicator.className = 'status-indicator status-online';
}

// Stop monitoring
function stopMonitoring() {
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
    
    currentAttackId = null;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    statusText.textContent = 'System Ready';
    statusIndicator.className = 'status-indicator';
    currentAttack.textContent = 'No active attack';
    
    addLog('Attack stopped', 'info');
}

// Start attack
async function startAttack() {
    const url = targetUrl.value.trim();
    const intensityValue = intensity.value;
    const durationValue = duration.value;
    
    if (!url || !url.startsWith('http')) {
        addLog('Error: Invalid URL format', 'error');
        alert('Please enter a valid URL starting with http:// or https://');
        return;
    }
    
    addLog(`Starting attack on ${url}`, 'success');
    addLog(`Intensity: ${intensityValue} requests/second`, 'info');
    addLog(`Duration: ${durationValue} seconds`, 'info');
    
    startBtn.disabled = true;
    stopBtn.disabled = false;
    statusText.textContent = 'Initializing attack...';
    
    try {
        const response = await fetch('/api/attack', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: url,
                intensity: intensityValue,
                duration: durationValue
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentAttackId = data.attackId;
            addLog(`Attack launched! ID: ${data.attackId}`, 'success');
            addLog(`Estimated requests: ${data.estimatedRequests.toLocaleString()}`, 'info');
            
            startMonitoring();
            
            // Auto-stop monitoring setelah durasi + 10 detik
            setTimeout(() => {
                if (currentAttackId === data.attackId) {
                    addLog('Attack duration completed', 'info');
                    stopMonitoring();
                }
            }, (parseInt(durationValue) + 10) * 1000);
            
        } else {
            addLog(`Failed to start attack: ${data.error}`, 'error');
            startBtn.disabled = false;
            stopBtn.disabled = true;
        }
        
    } catch (error) {
        addLog(`Network error: ${error.message}`, 'error');
        startBtn.disabled = false;
        stopBtn.disabled = true;
        statusText.textContent = 'System Ready';
    }
}

// Stop attack
async function stopAttack() {
    if (!currentAttackId) return;
    
    addLog('Stopping attack...', 'info');
    stopMonitoring();
}

// System status check
async function checkSystemStatus() {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();
        addLog(`System status: ${data.status}`, 'success');
    } catch (error) {
        addLog('Cannot connect to backend API', 'error');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkSystemStatus();
    addLog('System initialized. Ready for attack.', 'success');
});
