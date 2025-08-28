// HealthMonitor.js
// Provides system/network/Hedera/mirror node health checks for Neuron Node-RED

const https = require('https');
const http = require('http');

function fetchUrl(url, timeout = 3000) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https : http;
        const req = lib.get(url, { timeout }, (res) => {
            res.on('data', () => {}); // drain
            res.on('end', () => resolve({ status: res.statusCode }));
        });
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
}

async function checkNetworkConnectivity() {
    try {
        await fetchUrl('https://www.google.com', 2000);
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

async function checkHederaNetwork() {
    // Call /neuron/balance endpoint and check for valid balance
    try {
        const url = `http://localhost:${process.env.PORT || 1880}/neuron/balance`;
        const response = await fetchJson(url, 2000);
        if (response && response.success && response.balance) {
            return { ok: true, details: `Balance: ${response.balance}` };
        } else {
            return { ok: false, error: response && response.error ? response.error : 'No valid balance' };
        }
    } catch (e) {
        return { ok: false, error: e.message };
    }
}


const httpFetch = require('http');
const httpsFetch = require('https');

function fetchJson(url, timeout = 3000) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? httpsFetch : httpFetch;
        const req = lib.get(url, { timeout }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('Invalid JSON'));
                }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
}

async function checkMirrorNode() {
    // Get topic from env or fallback
    const topic = process.env.NEURON_DID_TOPIC || '0.0.6605201';
    // Assume Node-RED admin API is on same host/port
    const url = `http://localhost:1880/buyer/last-seen/${topic}`;
    try {
        const result = await fetchJson(url, 2000);
        if (result && result.lastSeenFormatted && result.lastSeenFormatted !== 'Never') {
            return { ok: true, lastSeen: result.lastSeenFormatted };
        } else {
            return { ok: false, error: 'No recent message', lastSeen: result.lastSeenFormatted };
        }
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

async function getSystemHealth() {
    const [network, hedera, mirror] = await Promise.all([
        checkNetworkConnectivity(),
        checkHederaNetwork(),
        checkMirrorNode()
    ]);
    return {
        network,
        hedera,
        mirror,
        healthy: network.ok && hedera.ok && mirror.ok,
        timestamp: new Date().toISOString()
    };
}

module.exports = {
    getSystemHealth
};
