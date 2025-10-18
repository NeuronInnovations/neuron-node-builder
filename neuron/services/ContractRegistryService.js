// Load environment variables
require('./NeuronEnvironment').load();

const path = require('path');
const fs = require('fs');

/**
 * ContractRegistryService - Manages smart contract registry
 * 
 * Current Implementation: Returns hardcoded contract list from environment variables
 * Future Implementation: Will fetch contracts from mother contract via SDK
 */
class ContractRegistryService {
    constructor() {
        this.contracts = {};
        this.initialized = false;
        this.cacheFile = path.join(require('./NeuronUserHome').load(), 'cache', 'contract-registry-cache.json');
        
        // Ensure cache directory exists
        const cacheDir = path.dirname(this.cacheFile);
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
    }

    /**
     * Initialize the contract registry
     * Loads contracts from hardcoded list (will be replaced with mother contract API call)
     */
    async initialize() {
        if (this.initialized) {
            console.log('[ContractRegistry] Already initialized');
            return;
        }

        try {
            // Load from cache first for fast startup
            this.loadFromCache();

            // Then load/refresh from source
            await this.refreshContracts();
            
            this.initialized = true;
            console.log('[ContractRegistry] Initialized successfully with', Object.keys(this.contracts).length, 'contracts');
        } catch (error) {
            console.error('[ContractRegistry] Failed to initialize:', error.message);
            
            // If we have cached contracts, use them
            if (Object.keys(this.contracts).length > 0) {
                console.log('[ContractRegistry] Using cached contracts as fallback');
                this.initialized = true;
            } else {
                throw new Error('Failed to initialize contract registry and no cache available');
            }
        }
    }

    /**
     * Refresh contracts from source
     * TODO: Replace hardcoded list with SDK call to mother contract
     */
    async refreshContracts() {
        console.log('[ContractRegistry] Refreshing contracts...');

        // HARDCODED CONTRACT LIST - TO BE REPLACED WITH MOTHER CONTRACT API CALL
        // This mimics what would be returned from the mother contract
        const contractList = this._getHardcodedContracts();

        // Convert array to map for easy lookup
        this.contracts = {};
        contractList.forEach(contract => {
            this.contracts[contract.name] = contract;
        });

        // Save to cache
        this.saveToCache();

        console.log('[ContractRegistry] Refreshed', contractList.length, 'contracts');
        return contractList;
    }

    /**
     * Get hardcoded contract list from environment variables
     * TODO: Replace this with actual API call to mother contract
     * 
     * @returns {Array} Array of contract objects
     */
    _getHardcodedContracts() {
        const contracts = [];

        // Jetvision contract
        if (process.env.JETVISION_CONTRACT_ID && process.env.JETVISION_CONTRACT_EVM) {
            contracts.push({
                name: 'jetvision',
                contractId: process.env.JETVISION_CONTRACT_ID,
                contractEvm: process.env.JETVISION_CONTRACT_EVM,
                description: 'Jetvision Aviation Data Contract'
            });
        }

        // Chat contract
        if (process.env.CHAT_CONTRACT_ID && process.env.CHAT_CONTRACT_EVM) {
            contracts.push({
                name: 'chat',
                contractId: process.env.CHAT_CONTRACT_ID,
                contractEvm: process.env.CHAT_CONTRACT_EVM,
                description: 'P2P Chat Contract'
            });
        }

        // Challenges contract
        if (process.env.CHALLENGES_CONTRACT_ID && process.env.CHALLENGES_CONTRACT_EVM) {
            contracts.push({
                name: 'challenges',
                contractId: process.env.CHALLENGES_CONTRACT_ID,
                contractEvm: process.env.CHALLENGES_CONTRACT_EVM,
                description: 'AI Challenges Contract'
            });
        }

        // Generic ADSB contract (used by stdin/stdout/stderr)
        if (process.env.CONTRACT_ID) {
            contracts.push({
                name: 'adsb',
                contractId: process.env.CONTRACT_ID,
                contractEvm: process.env.CONTRACT_EVM || '',
                description: 'ADSB Data Contract'
            });
        }

        // MCP contract
        if (process.env.MCP_CONTRACT_ID) {
            contracts.push({
                name: 'mcp',
                contractId: process.env.MCP_CONTRACT_ID,
                contractEvm: process.env.MCP_CONTRACT_EVM || '',
                description: 'MCP Contract'
            });
        }

        // Weather contract
        if (process.env.WEATHER_CONTRACT_ID) {
            contracts.push({
                name: 'weather',
                contractId: process.env.WEATHER_CONTRACT_ID,
                contractEvm: process.env.WEATHER_CONTRACT_EVM || '',
                description: 'Weather Data Contract'
            });
        }

        // Radiation contract
        if (process.env.RADIATION_CONTRACT_ID) {
            contracts.push({
                name: 'radiation',
                contractId: process.env.RADIATION_CONTRACT_ID,
                contractEvm: process.env.RADIATION_CONTRACT_EVM || '',
                description: 'Radiation Monitoring Contract'
            });
        }

        return contracts;
    }

    /**
     * Get all contracts
     * @returns {Array} Array of all contract objects
     */
    getAllContracts() {
        return Object.values(this.contracts);
    }

    /**
     * Get contract by name
     * @param {string} name - Contract name (e.g., 'jetvision', 'chat')
     * @returns {Object|null} Contract object or null if not found
     */
    getContract(name) {
        const contract = this.contracts[name.toLowerCase()];
        if (!contract) {
            console.warn(`[ContractRegistry] Contract '${name}' not found`);
            return null;
        }
        return contract;
    }

    /**
     * Get contract ID by name
     * @param {string} name - Contract name
     * @returns {string|null} Contract ID (e.g., '0.0.12345') or null
     */
    getContractId(name) {
        const contract = this.getContract(name);
        return contract ? contract.contractId : null;
    }

    /**
     * Get contract EVM address by name
     * @param {string} name - Contract name
     * @returns {string|null} Contract EVM address or null
     */
    getContractEvm(name) {
        const contract = this.getContract(name);
        return contract ? contract.contractEvm : null;
    }

    /**
     * Get all contract names
     * @returns {Array} Array of contract names
     */
    getContractNames() {
        return Object.keys(this.contracts);
    }

    /**
     * Get contracts map for HederaAccountService
     * Returns object with contract names as keys and contract IDs as values
     * @returns {Object} Map of contract names to IDs
     */
    getContractsMapForHedera() {
        const map = {};
        Object.keys(this.contracts).forEach(name => {
            map[name] = this.contracts[name].contractId;
        });
        return map;
    }

    /**
     * Get contracts map for EVM addresses
     * Returns object with contract names as keys and EVM addresses as values
     * @returns {Object} Map of contract names to EVM addresses
     */
    getContractsMapForEvm() {
        const map = {};
        Object.keys(this.contracts).forEach(name => {
            if (this.contracts[name].contractEvm) {
                map[name] = this.contracts[name].contractEvm;
            }
        });
        return map;
    }

    /**
     * Load contracts from cache
     */
    loadFromCache() {
        try {
            if (fs.existsSync(this.cacheFile)) {
                const cached = JSON.parse(fs.readFileSync(this.cacheFile, 'utf-8'));
                
                if (cached.contracts && cached.timestamp) {
                    this.contracts = cached.contracts;
                    const age = Date.now() - cached.timestamp;
                    const ageMinutes = Math.floor(age / 60000);
                    
                    console.log(`[ContractRegistry] Loaded ${Object.keys(this.contracts).length} contracts from cache (${ageMinutes} minutes old)`);
                    return true;
                }
            }
        } catch (error) {
            console.error('[ContractRegistry] Failed to load cache:', error.message);
        }
        return false;
    }

    /**
     * Save contracts to cache
     */
    saveToCache() {
        try {
            const cacheData = {
                contracts: this.contracts,
                timestamp: Date.now(),
                lastUpdated: new Date().toISOString()
            };
            
            fs.writeFileSync(this.cacheFile, JSON.stringify(cacheData, null, 2));
            console.log('[ContractRegistry] Saved contracts to cache');
        } catch (error) {
            console.error('[ContractRegistry] Failed to save cache:', error.message);
        }
    }

    /**
     * Check if a contract exists
     * @param {string} name - Contract name
     * @returns {boolean} True if contract exists
     */
    hasContract(name) {
        return !!this.contracts[name.toLowerCase()];
    }
}

// Export singleton instance
const contractRegistryService = new ContractRegistryService();

module.exports = contractRegistryService;

