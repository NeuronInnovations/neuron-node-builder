// neuron/routes/health.js
// Express router for /neuron/health endpoint

const express = require('express');
const router = express.Router();
const { getSystemHealth } = require('../services/HealthMonitor');

router.get('/health', async (req, res) => {
    try {
        const health = await getSystemHealth();
        res.json(health);
    } catch (err) {
        res.status(500).json({ healthy: false, error: err.message });
    }
});

module.exports = router;
