# Architecture and Design Patterns

## Overall Architecture

### Neuron Node Builder is built on a layered architecture:

1. **Node-RED Runtime Layer** (packages/node_modules/node-red)
   - Core flow execution engine
   - HTTP server (Express-based)
   - WebSocket communication
   - Plugin system

2. **Neuron Custom Layer** (neuron/)
   - Custom nodes for Hedera blockchain integration
   - Services for SDK management, updates, environment handling
   - Custom routes and pages
   - Theme customization

3. **External SDK Layer** (Go binaries)
   - neuron-nodered-sdk-wrapper (Go executable)
   - Hedera blockchain communication
   - Process management via child_process

4. **UI Layer** (editor client)
   - React-based editor (built by Grunt)
   - Custom theme (@node-red-contrib-themes/theme-collection)
   - Visual components for custom nodes

## Key Design Patterns

### 1. Service Pattern (neuron/services/)
Services are singleton modules that provide specific functionality:
- **NeuronEnvironment.js** - Environment variable management
- **NeuronSDKResolver.js** - SDK path resolution
- **NeuronUpdateService.js** - Auto-update functionality
- **NeuronUserHome.js** - User directory management
- **HealthMonitor.js** - System health checks

### 2. Process Management Pattern
Custom nodes spawn external Go processes for blockchain operations:
- Process registry tracks active processes
- Port manager allocates unique ports
- Connection monitor tracks health
- Cleanup on node deletion/restart

### 3. Node-RED Node Pattern
Each custom node follows Node-RED conventions:
```javascript
// Server-side (node-name.js)
module.exports = function(RED) {
    function NodeConstructor(config) {
        RED.nodes.createNode(this, config);
        // node logic
    }
    RED.nodes.registerType("node-name", NodeConstructor);
}

// Client-side (node-name.html)
// - Node definition
// - UI templates
// - Help text
```

### 4. Configuration Management
Multi-layered configuration:
1. **Environment variables** (.env) - Credentials, paths
2. **Settings file** (neuron-settings.js) - Node-RED runtime config
3. **Node config** - Per-node configuration in flows
4. **Global context** - Shared state across flows

### 5. Build System Pattern
Grunt-based build pipeline:
- **SASS compilation** - Styles to CSS
- **JavaScript minification** - UglifyJS
- **Asset concatenation** - Vendor libraries
- **Static file generation** - public/ directory

## Important Patterns and Guidelines

### 1. Hedera Blockchain Integration
- Use environment variables for credentials
- SDK wrapper handles all Hedera operations
- Devices registered on blockchain with DIDs
- Smart contracts for buyer/seller interactions

### 2. Error Handling
- Validate environment variables at startup
- Graceful degradation when SDK unavailable
- User-friendly error messages in UI
- Comprehensive logging to SDK_LOG_FOLDER

### 3. Security Practices
- Never commit credentials (.env in .gitignore)
- Use environment variables for sensitive data
- Code signing and notarization for distribution
- Validate inputs in custom nodes

### 4. Testing Strategy
- **Unit tests** - Mocha for core logic
- **Integration tests** - Node-RED test helper
- **Visual regression** - Playwright + SmartUI
- **Manual testing** - Test on target platforms

### 5. Update Mechanism
- NeuronUpdateService checks for updates
- Downloads from GitHub releases
- Platform-specific binaries
- Auto-update on startup (configurable)

### 6. Platform-Specific Handling
```javascript
// Platform detection pattern
const platform = process.platform; // 'darwin', 'win32', etc.
const arch = process.arch; // 'x64', 'arm64'

// Path resolution
const binaryPath = platform === 'win32' 
    ? path.join(dir, 'wrapper.exe')
    : path.join(dir, 'wrapper');
```

### 7. Visual Testing Pattern
- Fixtures in tests/visual/fixtures/
- Global setup/teardown for Node-RED instance
- SmartUI integration for AI-powered comparison
- Platform-specific baselines (macOS/Windows)
- Route stubbing for deterministic tests

## File Organization Principles

### Custom Nodes (neuron/nodes/)
- One feature = one node
- Paired .js and .html files
- Icons in icons/ subdirectory
- Shared utilities in separate modules

### Services (neuron/services/)
- Single responsibility
- Module exports pattern
- Minimal dependencies
- Testable in isolation

### Tests Structure
```
test/
├── unit/           # Mocha unit tests
├── nodes/          # Node-specific tests
└── visual/         # Playwright visual tests
    ├── fixtures/   # Test data
    ├── support/    # Test utilities
    └── *.spec.ts   # Test specs
```

## Critical Build Requirements

### Node-RED 4.x Build Process
**MUST run `npx grunt build` before starting**
- Compiles SASS to CSS
- Minifies JavaScript
- Creates public/ directory structure
- Bundles vendor libraries

**Without this step:**
- UI shows black screen
- MIME type errors for static assets
- 404 errors for vendor files

### Packaging Process
1. Build Node-RED assets (`grunt build`)
2. Package with pkg (`npm run package`)
3. Create app bundle (macOS)
4. Code sign and notarize (macOS)
5. Create distribution archives

## Environment-Specific Configurations

### Development
- Full logging enabled
- Source maps available
- Hot reload with nodemon
- Test network (Hedera testnet)

### Production
- Minified assets
- Production logging level
- Signed and notarized (macOS)
- Mainnet support (configurable)

### Visual Testing
- Dedicated .env.visual file
- Stubbed routes
- Deterministic fixtures
- Headless browser execution