const fs = require('fs');
const path = require('path');

/**
 * Central utility module for managing device files
 * This module serves as the single source of truth for all filesystem operations 
 * related to device files in the Neuron system.
 */
class DeviceManager {
    constructor() {
        this.devicesDir = path.join(require('../services/NeuronUserHome').load(), 'devices');
        this.ensureDevicesDirectory();
    }

    /**
     * Ensure the devices directory exists
     */
    ensureDevicesDirectory() {
        if (!fs.existsSync(this.devicesDir)) {
            fs.mkdirSync(this.devicesDir, { recursive: true });
        }
    }

    /**
     * List all JSON files in the devices directory
     * @returns {Array} Array of filenames (without .json extension)
     */
    listAllDeviceFiles() {
        try {
            if (!fs.existsSync(this.devicesDir)) {
                return [];
            }

            const files = fs.readdirSync(this.devicesDir);
            return files
                .filter(file => file.endsWith('.json'))
                .map(file => file.replace('.json', ''));
        } catch (error) {
            console.error('Error listing device files:', error);
            return [];
        }
    }

    /**
     * Determine the role of a device based on its content
     * @param {Object} deviceData - The parsed device data
     * @returns {string} 'buyer' or 'seller'
     */
    determineDeviceRole(deviceData) {
        // Explicit nodeType property takes precedence
        if (deviceData.nodeType === 'buyer') {
            return 'buyer';
        }
        if (deviceData.nodeType === 'seller') {
            return 'seller';
        }

        // Fallback logic: check for sellerEvmAddress property
        // A file is a Buyer if it contains sellerEvmAddress property
        if (deviceData.sellerEvmAddress !== undefined) {
            return 'buyer';
        }

        // Default to seller if no sellerEvmAddress property
        return 'seller';
    }

    /**
     * List device files filtered by role and excluding active nodes
     * @param {string} role - 'buyer' or 'seller'
     * @param {Array} activeNodeIds - Array of currently active node IDs to exclude
     * @returns {Array} Array of eligible device objects with filename and role
     */
    listEligibleDevices(role, activeNodeIds = []) {
        try {
            const allFiles = this.listAllDeviceFiles();
            const eligibleDevices = [];

            for (const filename of allFiles) {
                // Skip if this file corresponds to an active node (check filename first)
                if (activeNodeIds.includes(filename)) {
                    console.log(`[DEVICE FILTER] Skipping ${filename}.json - filename matches active node ID`);
                    continue;
                }

                try {
                    const deviceData = this.loadDeviceFile(filename);
                    
                    // Also check if the nodeId field inside the JSON matches an active node
                    if (deviceData.nodeId && activeNodeIds.includes(deviceData.nodeId)) {
                        console.log(`[DEVICE FILTER] Skipping ${filename}.json - nodeId field (${deviceData.nodeId}) matches active node ID`);
                        continue;
                    }
                    
                    const deviceRole = this.determineDeviceRole(deviceData);

                    // Only include devices that match the requested role
                    if (deviceRole === role) {
                        eligibleDevices.push({
                            filename: filename,
                            role: deviceRole,
                            deviceName: deviceData.deviceName || 'Unnamed Device',
                            evmAddress: deviceData.evmAddress || 'No EVM Address',
                            nodeId: deviceData.nodeId || null // Include the nodeId field for reference
                        });
                    }
                } catch (error) {
                    console.error(`Error processing device file ${filename}:`, error);
                    // Continue processing other files even if one fails
                }
            }

            return eligibleDevices;
        } catch (error) {
            console.error('Error listing eligible devices:', error);
            return [];
        }
    }

    /**
     * List all device files with status information (available/in use)
     * @param {string} role - 'buyer' or 'seller'
     * @param {Array} activeNodeIds - Array of currently active node IDs
     * @param {Object} activeNodeInfo - Object mapping node IDs to node names
     * @returns {Array} Array of device objects with status information
     */
    listAllDevicesWithStatus(role, activeNodeIds = [], activeNodeInfo = {}) {
        try {
            const allFiles = this.listAllDeviceFiles();
            const devicesWithStatus = [];

            for (const filename of allFiles) {
                try {
                    const deviceData = this.loadDeviceFile(filename);
                    const deviceRole = this.determineDeviceRole(deviceData);

                    // Only include devices that match the requested role
                    if (deviceRole === role) {
                        // Check if this device is in use
                        let isInUse = false;
                        let usedBy = null;
                        
                        // Check if filename matches an active node
                        if (activeNodeIds.includes(filename)) {
                            isInUse = true;
                            usedBy = activeNodeInfo[filename] || filename;
                        }
                        
                        // Also check if the nodeId field inside the JSON matches an active node
                        if (deviceData.nodeId && activeNodeIds.includes(deviceData.nodeId)) {
                            isInUse = true;
                            usedBy = activeNodeInfo[deviceData.nodeId] || deviceData.nodeId;
                        }

                        devicesWithStatus.push({
                            filename: filename,
                            role: deviceRole,
                            deviceName: deviceData.deviceName || 'Unnamed Device',
                            evmAddress: deviceData.evmAddress || 'No EVM Address',
                            nodeId: deviceData.nodeId || null,
                            available: !isInUse,
                            usedBy: usedBy
                        });
                    }
                } catch (error) {
                    console.error(`Error processing device file ${filename}:`, error);
                    // Continue processing other files even if one fails
                }
            }

            return devicesWithStatus;
        } catch (error) {
            console.error('Error listing devices with status:', error);
            return [];
        }
    }

    /**
     * Load and parse a device file
     * @param {string} filename - The filename without .json extension
     * @returns {Object} Parsed device data
     */
    loadDeviceFile(filename) {
        try {
            const filePath = path.join(this.devicesDir, `${filename}.json`);
            
            if (!fs.existsSync(filePath)) {
                throw new Error(`Device file not found: ${filename}.json`);
            }

            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const deviceData = JSON.parse(fileContent);
            
            return deviceData;
        } catch (error) {
            console.error(`Error loading device file ${filename}:`, error);
            throw error;
        }
    }

    /**
     * Save device data to a file
     * @param {string} nodeId - The node ID (used as filename)
     * @param {Object} deviceData - The device data to save
     */
    saveDeviceFile(nodeId, deviceData) {
        try {
            this.ensureDevicesDirectory();
            const filePath = path.join(this.devicesDir, `${nodeId}.json`);
            
            fs.writeFileSync(filePath, JSON.stringify(deviceData, null, 2), 'utf-8');
            console.log(`Device file saved: ${nodeId}.json`);
        } catch (error) {
            console.error(`Error saving device file ${nodeId}:`, error);
            throw error;
        }
    }

    /**
     * Rename a device file
     * @param {string} oldFilename - Current filename (without .json extension)
     * @param {string} newNodeId - New node ID (new filename without .json extension)
     */
    renameDeviceFile(oldFilename, newNodeId) {
        try {
            const oldFilePath = path.join(this.devicesDir, `${oldFilename}.json`);
            const newFilePath = path.join(this.devicesDir, `${newNodeId}.json`);

            if (!fs.existsSync(oldFilePath)) {
                throw new Error(`Device file not found: ${oldFilename}.json`);
            }

            if (fs.existsSync(newFilePath)) {
                throw new Error(`Target device file already exists: ${newNodeId}.json`);
            }

            fs.renameSync(oldFilePath, newFilePath);
            console.log(`Device file renamed: ${oldFilename}.json -> ${newNodeId}.json`);
        } catch (error) {
            console.error(`Error renaming device file from ${oldFilename} to ${newNodeId}:`, error);
            throw error;
        }
    }

    /**
     * Check if a device file exists
     * @param {string} nodeId - The node ID to check
     * @returns {boolean} True if file exists
     */
    deviceFileExists(nodeId) {
        const filePath = path.join(this.devicesDir, `${nodeId}.json`);
        return fs.existsSync(filePath);
    }

    /**
     * Delete a device file
     * @param {string} nodeId - The node ID (filename without .json extension)
     */
    deleteDeviceFile(nodeId) {
        try {
            const filePath = path.join(this.devicesDir, `${nodeId}.json`);
            
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Device file deleted: ${nodeId}.json`);
            }
        } catch (error) {
            console.error(`Error deleting device file ${nodeId}:`, error);
            throw error;
        }
    }

    /**
     * Get all active node IDs from the current Node-RED editor
     * This is a helper method that can be called by the nodes to get active IDs
     * @param {Object} RED - Node-RED instance
     * @returns {Array} Array of active node IDs
     */
    getActiveNodeIds(RED) {
        try {
            const activeNodeIds = [];
            
            // Get all nodes from the editor
            RED.nodes.eachNode((node) => {
                // Check for both buyer and seller config nodes
                if (node.type === 'buyer config' || node.type === 'seller config' || 
                    node.type === 'buyer' || node.type === 'seller') {
                    activeNodeIds.push(node.id);
                    console.log(`[ACTIVE NODES] Found active node: ${node.type} (${node.id})`);
                }
            });

            console.log(`[ACTIVE NODES] Total active nodes found: ${activeNodeIds.length}`);
            return activeNodeIds;
        } catch (error) {
            console.error('Error getting active node IDs:', error);
            return [];
        }
    }
}

// Export a singleton instance
module.exports = new DeviceManager();
