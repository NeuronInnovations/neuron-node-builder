const fs = require('fs');
const path = require('path');
const net = require('net');

/**
 * PortManager - Manages port allocation and reservation
 * Ensures consistent port assignment across Node-RED redeploys
 */
class PortManager {
    constructor(options = {}) {
        this.portRangeStart = options.portRangeStart || 61336;
        this.portRangeEnd = options.portRangeEnd || 61346;
        this.reservationsPath = path.join(require('../services/NeuronUserHome').load(), 'port-reservations.json');
        this.reservations = new Map(); // nodeId -> port
        this.reservationTTL = options.reservationTTL || (24 * 60 * 60 * 1000); // 24 hours
        this.loadReservations();
    }

    /**
     * Load port reservations from persistent storage
     */
    loadReservations() {
        try {
            if (fs.existsSync(this.reservationsPath)) {
                const data = fs.readFileSync(this.reservationsPath, 'utf-8');
                const parsed = JSON.parse(data);
                
                // Convert object to Map and validate
                for (const [nodeId, reservation] of Object.entries(parsed)) {
                    if (this.isValidReservation(reservation)) {
                        this.reservations.set(nodeId, reservation);
                    }
                }
                
                console.log(`Loaded ${this.reservations.size} port reservations`);
                this.cleanupExpiredReservations();
            }
        } catch (error) {
            console.error('Error loading port reservations:', error.message);
            this.reservations = new Map();
        }
    }

    /**
     * Save port reservations to persistent storage
     */
    saveReservations() {
        try {
            const reservationsObj = Object.fromEntries(this.reservations);
            const tempPath = this.reservationsPath + '.tmp';
            
            fs.writeFileSync(tempPath, JSON.stringify(reservationsObj, null, 2), 'utf-8');
            fs.renameSync(tempPath, this.reservationsPath);
            
            console.log(`Saved ${this.reservations.size} port reservations`);
        } catch (error) {
            console.error('Error saving port reservations:', error.message);
        }
    }

    /**
     * Reserve a port for a specific node (with optional flow isolation)
     */
    async reservePort(nodeId, preferredPort = null, flowId = null) {
        // Clean up expired reservations first
        this.cleanupExpiredReservations();
        
        // Create a unique key that includes flow information if provided
        const reservationKey = flowId ? `${flowId}:${nodeId}` : nodeId;
        
        // Check if we already have a reservation for this node
        const existingReservation = this.reservations.get(reservationKey);
        if (existingReservation && !this.isReservationExpired(existingReservation)) {
            // Verify the port is still available
            if (await this.isPortAvailable(existingReservation.port)) {
                console.log(`Reusing reserved port ${existingReservation.port} for node ${nodeId}${flowId ? ` (flow: ${flowId})` : ''}`);
                this.updateLastUsed(reservationKey);
                return existingReservation.port;
            } else {
                console.warn(`Reserved port ${existingReservation.port} is no longer available for node ${nodeId}${flowId ? ` (flow: ${flowId})` : ''}`);
                console.warn(`This indicates a port conflict - another process may be using the port`);
                this.reservations.delete(reservationKey);
                this.saveReservations();
            }
        }

        // Try preferred port if specified
        if (preferredPort && await this.isPortAvailable(preferredPort)) {
            this.addReservation(reservationKey, preferredPort, flowId);
            return preferredPort;
        }

        // Find a new available port
        const port = await this.findAvailablePort();
        this.addReservation(reservationKey, port, flowId);
        return port;
    }

    /**
     * Find an available port in the configured range
     */
    async findAvailablePort() {
        const reservedPorts = new Set(Array.from(this.reservations.values()).map(r => r.port));
        
        for (let port = this.portRangeStart; port <= this.portRangeEnd; port++) {
            if (!reservedPorts.has(port) && await this.isPortAvailable(port)) {
                return port;
            }
        }
        
        throw new Error(`No available ports in range ${this.portRangeStart}-${this.portRangeEnd}`);
    }

    /**
     * Check if a port is available for use
     */
    async isPortAvailable(port) {
        return new Promise((resolve) => {
            const server = net.createServer();
            
            server.on('error', () => {
                resolve(false); // Port is in use
            });
            
            server.listen(port, '127.0.0.1', () => {
                server.close(() => {
                    resolve(true); // Port is available
                });
            });
        });
    }

    /**
     * Add a new port reservation
     */
    addReservation(reservationKey, port, flowId = null) {
        const reservation = {
            port: port,
            nodeId: reservationKey,
            flowId: flowId,
            reservedAt: new Date().toISOString(),
            lastUsed: new Date().toISOString()
        };
        
        this.reservations.set(reservationKey, reservation);
        this.saveReservations();
        console.log(`Reserved port ${port} for node ${reservationKey}${flowId ? ` (flow: ${flowId})` : ''}`);
    }

    /**
     * Release a port reservation
     */
    releasePort(nodeId, flowId = null) {
        const reservationKey = flowId ? `${flowId}:${nodeId}` : nodeId;
        const reservation = this.reservations.get(reservationKey);
        if (reservation) {
            this.reservations.delete(reservationKey);
            this.saveReservations();
            console.log(`Released port ${reservation.port} for node ${nodeId}${flowId ? ` (flow: ${flowId})` : ''}`);
            return reservation.port;
        }
        return null;
    }

    /**
     * Update last used timestamp for a reservation
     */
    updateLastUsed(reservationKey) {
        const reservation = this.reservations.get(reservationKey);
        if (reservation) {
            reservation.lastUsed = new Date().toISOString();
            this.saveReservations();
        }
    }

    /**
     * Get port for a specific node
     */
    getPortForNode(nodeId, flowId = null) {
        const reservationKey = flowId ? `${flowId}:${nodeId}` : nodeId;
        const reservation = this.reservations.get(reservationKey);
        return reservation ? reservation.port : null;
    }

    /**
     * Get all reservations
     */
    getAllReservations() {
        return new Map(this.reservations);
    }

    /**
     * Clean up expired reservations
     */
    cleanupExpiredReservations() {
        const now = Date.now();
        let cleanedCount = 0;
        
        for (const [nodeId, reservation] of this.reservations) {
            if (this.isReservationExpired(reservation)) {
                this.reservations.delete(nodeId);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            this.saveReservations();
            console.log(`Cleaned up ${cleanedCount} expired port reservations`);
        }
    }

    /**
     * Check if a reservation is expired
     */
    isReservationExpired(reservation) {
        const reservedAt = new Date(reservation.reservedAt).getTime();
        return (Date.now() - reservedAt) > this.reservationTTL;
    }

    /**
     * Validate reservation structure
     */
    isValidReservation(reservation) {
        return reservation &&
               typeof reservation.port === 'number' &&
               typeof reservation.nodeId === 'string' &&
               typeof reservation.reservedAt === 'string' &&
               reservation.port >= this.portRangeStart &&
               reservation.port <= this.portRangeEnd;
    }

    /**
     * Detect and resolve port conflicts
     */
    async detectAndResolveConflicts() {
        console.log('🔍 Detecting port conflicts...');
        const conflicts = [];
        
        for (const [nodeId, reservation] of this.reservations) {
            const isAvailable = await this.isPortAvailable(reservation.port);
            if (!isAvailable) {
                conflicts.push({
                    nodeId,
                    port: reservation.port,
                    reservation
                });
                console.warn(`⚠️  Port conflict detected: Node ${nodeId} has reserved port ${reservation.port} but it's in use`);
            }
        }
        
        if (conflicts.length > 0) {
            console.log(`🚨 Found ${conflicts.length} port conflicts`);
            
            // Remove conflicting reservations
            for (const conflict of conflicts) {
                this.reservations.delete(conflict.nodeId);
                console.log(`✅ Removed conflicting reservation for node ${conflict.nodeId} on port ${conflict.port}`);
            }
            
            this.saveReservations();
            console.log('✅ Port conflicts resolved');
        } else {
            console.log('✅ No port conflicts detected');
        }
        
        return conflicts;
    }

    /**
     * Get port usage statistics
     */
    getStats() {
        const totalPorts = this.portRangeEnd - this.portRangeStart + 1;
        const reservedPorts = this.reservations.size;
        
        return {
            totalPorts: totalPorts,
            reservedPorts: reservedPorts,
            availablePorts: totalPorts - reservedPorts,
            portRange: `${this.portRangeStart}-${this.portRangeEnd}`,
            reservations: Array.from(this.reservations.entries()).map(([nodeId, reservation]) => ({
                nodeId,
                port: reservation.port,
                reservedAt: reservation.reservedAt,
                lastUsed: reservation.lastUsed
            }))
        };
    }
}

module.exports = PortManager; 