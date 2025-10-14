# Architecture and Design Patterns

## Project Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Node-RED Editor (Browser)                 │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐  │
│  │ Flow Editor│  │ Node Config│  │  Template Browser   │  │
│  └────────────┘  └────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ▲
                           │ HTTP/WebSocket
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Node-RED Runtime (Node.js)                      │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐  │
│  │ Flow Engine│  │ Node Registry│ │   Admin API        │  │
│  └────────────┘  └────────────┘  └─────────────────────┘  │
│                                                              │
│  Neuron Custom Nodes:                                       │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐  │
│  │ Buyer Node │  │ Seller Node│  │   NeuronGPT Node   │  │
│  └────────────┘  └────────────┘  └─────────────────────┘  │
│         │              │                    │               │
│         └──────────────┴────────────────────┘               │
│                        │                                     │
└────────────────────────┼─────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Neuron Services Layer                           │
│  ┌──────────────────┐  ┌──────────────────────────────┐   │
│  │ Process Manager  │  │  Contract Monitor Service    │   │
│  │ Port Manager     │  │  Hedera Contract Service     │   │
│  │ Process Registry │  │  Environment Service         │   │
│  └──────────────────┘  └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Go SDK Wrapper (Child Processes)                     │
│  ┌──────────────────┐  ┌──────────────────────────────┐   │
│  │ Buyer Process    │  │  Seller Process              │   │
│  │ (port 3001)      │  │  (port 3002)                 │   │
│  └──────────────────┘  └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                Hedera Blockchain Network                     │
│                      (Testnet/Mainnet)                       │
└─────────────────────────────────────────────────────────────┘
```

## Design Patterns

### 1. Node-RED Node Pattern

Each custom node follows the Node-RED node pattern:

```javascript
module.exports = function(RED) {
    function CustomNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        
        // Initialize state
        // Setup event listeners
        
        node.on('input', function(msg) {
            // Process incoming messages
        });
        
        node.on('close', function(done) {
            // Cleanup resources
            done();
        });
    }
    
    RED.nodes.registerType("custom-node", CustomNode);
};
```

**Key principles:**
- Each node is a function constructor
- Uses Node-RED's createNode for lifecycle
- Registers with RED.nodes.registerType
- Handles cleanup in 'close' event

### 2. Child Process Management Pattern

Buyer/Seller nodes spawn Go SDK wrapper processes:

```javascript
// Process lifecycle
const processManager = {
    spawn: function(nodeId, args) {
        const process = spawn(sdkPath, args);
        processRegistry.register(nodeId, process);
        return process;
    },
    
    cleanup: function(nodeId) {
        const process = processRegistry.get(nodeId);
        if (process) {
            process.kill();
            processRegistry.unregister(nodeId);
        }
    }
};
```

**Key principles:**
- Each node gets its own process
- Port allocation via PortManager
- Process tracking via ProcessRegistry
- Cleanup on node close

### 3. Global Service Pattern

Services are singletons that manage shared state:

```javascript
// Global contract monitoring
let globalState = {
    contracts: {},
    deviceCache: {},
    monitoringInterval: null
};

module.exports = {
    initialize: function() {
        if (!this.isActive()) {
            // Start monitoring
        }
    },
    
    cleanup: function() {
        if (this.isActive()) {
            // Stop monitoring
        }
    },
    
    isActive: function() {
        return globalState.monitoringInterval !== null;
    }
};
```

**Key principles:**
- Singleton pattern for shared resources
- Lazy initialization
- Proper cleanup
- State checking before operations

### 4. Environment Configuration Pattern

Environment loading with fallbacks:

```javascript
const envPaths = [
    process.env.NEURON_ENV_PATH,
    path.join(userHome, '.neuron-node-builder', '.env'),
    path.join(process.cwd(), '.env')
];

for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
        break;
    }
}
```

**Key principles:**
- Multiple fallback paths
- Order of precedence
- Override capability
- Fail gracefully if not found

### 5. Template Service Pattern

RESTful API pattern for templates:

```javascript
app.get('/api/templates', (req, res) => {
    // List all templates
});

app.get('/api/templates/:name', (req, res) => {
    // Get specific template
});

app.post('/api/templates/import', (req, res) => {
    // Import template
});
```

**Key principles:**
- RESTful endpoints
- JSON responses
- Error handling
- Path parameter validation

### 6. Event-Driven Pattern

Node-RED is inherently event-driven:

```javascript
node.on('input', function(msg) {
    // Transform message
    node.send(msg);
});

node.on('close', function(done) {
    // Async cleanup
    cleanup().then(() => done());
});
```

**Key principles:**
- Message passing between nodes
- Asynchronous operations
- Event handlers for lifecycle
- Non-blocking I/O

## Key Architectural Decisions

### 1. Node-RED Fork vs. Plugin
**Decision**: Fork Node-RED rather than create plugins
**Rationale**: 
- Deep customization of UI needed
- Tight integration with Neuron services
- Custom theme and branding
- Easier deployment as single package

### 2. Go SDK Wrapper as Child Process
**Decision**: Run Go SDK as separate processes
**Rationale**:
- Go code can't run directly in Node.js
- Process isolation for crashes
- Independent lifecycle management
- Port-based communication

### 3. Visual Testing with Argos
**Decision**: Use Argos CI over LambdaTest
**Rationale**:
- Cost-effective ($30/month vs $359/month)
- Better free tier (5000 vs 2000 screenshots)
- Native Playwright integration
- Open-source option

### 4. Monorepo Structure
**Decision**: Keep Node-RED as monorepo in packages/
**Rationale**:
- Preserve upstream structure
- Easier to merge upstream changes
- Clear separation of Neuron code
- Standard Node-RED layout

### 5. Environment Variable Cascade
**Decision**: Multiple .env file locations with priority
**Rationale**:
- User home for persistence
- Project root for development
- Visual test mode for testing
- Flexibility for deployment

## Common Patterns

### Error Handling
```javascript
try {
    // Operation
} catch (error) {
    node.error("Failed to ...: " + error.message);
    node.status({ fill: "red", shape: "dot", text: "error" });
}
```

### Status Updates
```javascript
node.status({ fill: "green", shape: "dot", text: "connected" });
node.status({ fill: "yellow", shape: "ring", text: "connecting" });
node.status({ fill: "red", shape: "dot", text: "error" });
node.status({});  // Clear status
```

### Resource Cleanup
```javascript
node.on('close', function(done) {
    // Clear timers
    if (interval) clearInterval(interval);
    
    // Kill processes
    if (childProcess) childProcess.kill();
    
    // Close connections
    if (connection) connection.close();
    
    // Call done when complete
    done();
});
```

### Configuration Access
```javascript
// Node config (from editor)
const deviceName = config.deviceName;

// Global config (from settings)
const contractId = RED.settings.get("contractId");

// Environment variables
const sdkPath = process.env.NEURON_SDK_PATH;
```

## Anti-Patterns to Avoid

1. **Don't block the event loop**: Use async operations
2. **Don't leave processes running**: Always clean up in 'close'
3. **Don't hardcode paths**: Use environment variables
4. **Don't log sensitive data**: Credentials, keys, etc.
5. **Don't modify msg object**: Clone if needed to modify
6. **Don't assume process exists**: Check before accessing
7. **Don't use synchronous I/O**: Use async file operations

## Testing Patterns

### Visual Test Pattern
```typescript
test('should display correctly', async ({ page, argos }) => {
    await page.goto('http://localhost:1880');
    await waitForFonts(page);
    await disableAnimations(page);
    await argos.captureViewportSnapshot('screen-name');
});
```

### Unit Test Pattern (Mocha)
```javascript
describe('ComponentName', function() {
    beforeEach(function() {
        // Setup
    });
    
    it('should do something', function() {
        // Test
        should.exist(result);
        result.should.equal(expected);
    });
    
    afterEach(function() {
        // Cleanup
    });
});
```
