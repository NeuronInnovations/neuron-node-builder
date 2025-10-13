# Code Style and Conventions

## JavaScript Style (JSHint Configuration)

The project uses JSHint for code quality. Configuration from `.jshintrc`:

### Core Rules
- **ASI allowed**: Missing semicolons are permitted
- **Curly braces required**: Always use braces for control structures
- **Null coercion**: `== null` is allowed (eqnull: true)
- **Indent**: 4 spaces (default)
- **ES Version**: ES2020 (esversion: 11)
- **Shadow variables**: Variable name reuse is allowed
- **Loop functions**: Functions can be defined in loops
- **Prototype**: `__proto__` usage allowed

### Important Settings
```javascript
{
  "asi": true,        // allow missing semicolons
  "curly": true,      // require braces
  "eqnull": true,     // ignore ==null
  "indent": 4,        // default indent of 4
  "forin": true,      // require property filtering in "for in" loops
  "immed": true,      // require immediate functions to be wrapped in ( )
  "loopfunc": true,   // allow functions to be defined in loops
  "shadow": true,     // allow variable shadowing
  "sub": true,        // don't warn that foo['bar'] should be written as foo.bar
  "esversion": 11     // allow ES2020
}
```

## Naming Conventions

### Files
- **Node implementations**: kebab-case (e.g., `buyer.js`, `seller.js`, `global-contract-monitor.js`)
- **Services**: PascalCase (e.g., `NeuronEnvironment.js`, `HederaContractService.js`)
- **Tests**: kebab-case with `.spec.ts` suffix (e.g., `buyer-config.spec.ts`)

### Variables and Functions
- **Variables**: camelCase (e.g., `contractConfigs`, `globalAllDevices`)
- **Functions**: camelCase (e.g., `fetchContractData`, `initializeGlobalContractMonitoring`)
- **Constants**: Either UPPER_CASE or camelCase depending on context
- **Private/internal**: No strict convention, often prefixed with underscore

### Classes and Constructors
- **Classes**: PascalCase (e.g., `NeuronUpdateService`, `HederaContractService`)
- **Node-RED nodes**: lowercase with hyphens (e.g., `neuron-buyer`, `neuron-seller`)

## Code Organization

### Node-RED Node Structure
Each custom node follows this pattern:
```javascript
module.exports = function(RED) {
    function NodeName(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        
        // Node initialization
        // Event handlers
        
        node.on('input', function(msg) {
            // Input handling
        });
        
        node.on('close', function(done) {
            // Cleanup
            done();
        });
    }
    
    RED.nodes.registerType("node-name", NodeName);
};
```

### Service Module Pattern
Services typically use:
```javascript
class ServiceName {
    constructor(options) {
        // Initialize
    }
    
    async someMethod() {
        // Implementation
    }
}

module.exports = ServiceName;
```

Or simple exports:
```javascript
module.exports = {
    load: function() { ... },
    reload: function() { ... }
};
```

## Comments and Documentation

### File Headers
Most files include Apache 2.0 license header:
```javascript
/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * ...
 */
```

### Inline Comments
- Use `//` for single-line comments
- Use `/** ... */` for JSDoc comments
- Comment complex logic and business rules
- Include TODO/FIXME where appropriate

### Console Logging
The project uses emoji-prefixed console logs for visibility:
- `🚀` - Startup/initialization
- `📝` - Configuration loading
- `✅` - Success
- `❌` - Errors
- `🔄` - Redirects/reloads
- `🎭` - Visual test mode
- `📋` - Status information

Example:
```javascript
console.log("🚀 [neuron-settings] Starting to load Neuron settings...");
console.log("✅ [neuron-settings] Environment loaded");
```

## TypeScript (Tests Only)

Visual tests use TypeScript:
- Strict mode enabled
- ES2020 target
- CommonJS modules
- Types for Playwright and Node.js

## SASS/CSS Style

CSS is written in SASS and follows:
- Nested selectors
- Variables for theming
- Modular structure
- Compiled to minified CSS

## HTML (Node Definitions)

Node HTML files follow Node-RED conventions:
- `<script type="text/javascript">` for node definition
- `<script type="text/html" data-template-name="...">` for edit dialog
- `<script type="text/html" data-help-name="...">` for help text

## Best Practices

1. **Error Handling**: Always handle errors in async operations
2. **Resource Cleanup**: Use `node.on('close', ...)` for cleanup
3. **Environment Variables**: Use `process.env` with fallbacks
4. **Logging Levels**: Use appropriate log levels (warn, error, info)
5. **Modular Code**: Keep functions small and focused
6. **No Strict Mode**: Project doesn't enforce `"use strict"` (yet)
7. **Backward Compatibility**: Be careful when modifying Node-RED core
