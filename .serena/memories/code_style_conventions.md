# Code Style and Conventions

## JavaScript Style (JSHint Configuration)

### Core Rules (.jshintrc)
- **ES Version**: ES11 (ES2020)
- **Semicolons**: Optional (asi: true) - missing semicolons allowed
- **Braces**: Required for control structures (curly: true)
- **Equality**: `==null` allowed (eqnull: true), but prefer `===` elsewhere
- **Indentation**: 4 spaces (standard throughout codebase)
- **Loop Functions**: Allowed (loopfunc: true)
- **Variable Shadowing**: Allowed (shadow: true)
- **Property Access**: Both dot and bracket notation accepted (sub: true)
- **Prototype**: `__proto__` allowed for Node < v0.12 compatibility

### General Conventions
1. **Error Handling**: Use try-catch blocks with descriptive error messages
2. **Logging**: Use `console.log()`, `console.error()`, `console.warn()` liberally for debugging
3. **Comments**: Single-line (`//`) for brief comments, multi-line (`/* */`) for headers
4. **Async Operations**: Prefer async/await over callbacks or raw promises
5. **Module Pattern**: Use `module.exports` and `require()` (CommonJS)

## File Organization

### Node Files Structure
Each custom node (buyer.js, seller.js) follows this pattern:
```javascript
// 1. Environment/dependencies loading
require('../services/NeuronEnvironment').load();

// 2. Module imports
const path = require('path');
const fs = require('fs');
// ...

// 3. Global state/helpers (outside module.exports)
const globalState = new Map();

// 4. Main export with Node-RED registration
module.exports = function(RED) {
    // Node constructor
    function NodeName(config) {
        RED.nodes.createNode(this, config);
        // Node logic
    }
    
    // Register node type
    RED.nodes.registerType('node-name', NodeName);
    
    // HTTP Admin endpoints
    RED.httpAdmin.get('/api/endpoint', function(req, res) {
        // Endpoint logic
    });
};
```

### Naming Conventions
- **Files**: kebab-case (e.g., `process-manager.js`, `connection-monitor.js`)
- **Classes**: PascalCase (e.g., `ProcessManager`, `HederaAccountService`)
- **Functions**: camelCase (e.g., `startProcess`, `getConnectionStatus`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `HEDERA_OPERATOR_ID`)
- **Private helpers**: camelCase with descriptive names (e.g., `extractPublicKeyBytes`)

## TypeScript (for Playwright Tests)

### Configuration (tsconfig.playwright.json)
- **Target**: ES2022
- **Module**: CommonJS
- **Strict Checks**: Enabled (skipLibCheck: true for performance)
- **Types**: Node, @playwright/test, DOM
- **Output**: `tests/visual/.tsbuild`

### Conventions
- Use explicit types for function parameters and return values
- Leverage Playwright fixtures and page object patterns
- Keep test files focused and descriptive

## Copyright Headers
All source files should include Apache 2.0 license header:
```javascript
/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * ...
 **/
```

## Node-RED Specific
- **Node Status**: Use descriptive status indicators with fill/shape/text
  - Green dot: Success/connected
  - Yellow ring: Warning/initializing
  - Red ring: Error/disconnected
  - Blue dot: Processing
- **Device Info**: Store persistent data in both context and filesystem
- **Process Management**: Always clean up child processes in node.on('close')
- **WebSocket Communication**: Use ports dynamically assigned by ProcessManager
