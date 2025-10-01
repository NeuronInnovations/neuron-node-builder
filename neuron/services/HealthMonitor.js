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
    // Test connectivity to Hedera TESTNET consensus nodes (0.0.7 and 0.0.9)
    const consensusNodes = [
        { id: '0.0.7', host: '34.94.160.4', port: 50211 },      // Testnet node 0.0.7
        { id: '0.0.9', host: '34.133.197.230', port: 50211 }    // Testnet node 0.0.9
    ];
    
    const nodeResults = [];
    
    // Check each consensus node
    for (const node of consensusNodes) {
        try {
            await checkNodeConnectivity(node.host, node.port, 3000);
            nodeResults.push({ id: node.id, healthy: true });
        } catch (error) {
            nodeResults.push({ id: node.id, healthy: false, error: error.message });
        }
    }
    
    const healthyNodes = nodeResults.filter(n => n.healthy);
    const unhealthyNodes = nodeResults.filter(n => !n.healthy);
    
    if (healthyNodes.length === 0) {
        return { 
            ok: false, 
            error: `All consensus nodes are unhealthy (${unhealthyNodes.map(n => n.id).join(', ')})`,
            nodes: nodeResults
        };
    } else if (unhealthyNodes.length > 0) {
        return { 
            ok: true, 
            warning: `Some nodes unhealthy: ${unhealthyNodes.map(n => n.id).join(', ')}`,
            details: `${healthyNodes.length}/${consensusNodes.length} nodes healthy`,
            nodes: nodeResults
        };
    } else {
        return { 
            ok: true, 
            details: `All consensus nodes healthy (${healthyNodes.map(n => n.id).join(', ')})`,
            nodes: nodeResults
        };
    }
}

// Helper function to check node connectivity via TCP
function checkNodeConnectivity(host, port, timeout) {
    return new Promise((resolve, reject) => {
        const net = require('net');
        const socket = new net.Socket();
        
        const timer = setTimeout(() => {
            socket.destroy();
            reject(new Error('Connection timeout'));
        }, timeout);
        
        socket.on('connect', () => {
            clearTimeout(timer);
            socket.destroy();
            resolve();
        });
        
        socket.on('error', (err) => {
            clearTimeout(timer);
            reject(err);
        });
        
        socket.connect(port, host);
    });
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
        if (result && result.lastSeen && result.lastSeen !== 'Never') {
            return { ok: true, lastSeen: result.lastSeenFormatted };
        } else {
            return { ok: false, error: 'No recent message', lastSeen: result.lastSeen };
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
