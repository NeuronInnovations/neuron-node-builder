# Neuron Node Builder - Project Overview

## Purpose
Neuron Node Builder is a Node-RED fork designed for machine-to-machine commerce powered by Hedera blockchain technology. It provides custom nodes for buyers and sellers to interact with the Neuron network, enabling decentralized commerce applications.

## Key Features
- **Buyer Nodes**: Create buyer devices, connect to sellers, consume data from the Neuron network
- **Seller Nodes**: Create seller devices, publish data to the network, connect to buyers
- **Hedera Integration**: Uses Hedera blockchain for account management, topics, and smart contracts
- **Go SDK Wrapper**: Integrates with `neuron-nodered-sdk-wrapper` (compiled Go binary) for blockchain operations
- **Visual Testing**: Comprehensive Playwright-based visual regression testing with Argos CI
- **macOS App Packaging**: Professional code signing, notarization, and DMG creation for distribution

## Architecture
- **Base**: Fork of Node-RED 4.x (low-code programming for event-driven applications)
- **Custom Nodes**: Located in `neuron/nodes/` directory
- **Services**: Core services in `neuron/services/` for environment management, health monitoring, etc.
- **SDK Integration**: Communicates with Go wrapper via WebSocket for blockchain operations
- **Testing**: Unit tests (Grunt/Mocha), visual tests (Playwright + Argos CI)

## Platform Support
- **macOS**: Intel (x64) and Apple Silicon (ARM64)
- **Windows**: x64
- **Linux**: No longer supported

## Critical Dependencies
- Node.js v18.5+ (required for Node-RED 4.x)
- Go v1.19+ (for compiling SDK wrapper)
- neuron-nodered-sdk-wrapper (Go binary for Hedera operations)
- neuron-js-registration-sdk (NPM package for device management)

## Directory Structure
```
/
├── neuron/                    # Custom Neuron-specific code
│   ├── nodes/                 # Custom Node-RED nodes (buyer, seller, etc.)
│   ├── services/              # Core services (environment, health monitoring)
│   ├── lib/                   # Shared libraries
│   ├── pages/                 # Custom web pages
│   └── routes/                # Custom API routes
├── packages/node_modules/     # Node-RED core packages
├── tests/visual/              # Playwright visual regression tests
├── build/                     # Build output directory
├── public/                    # Compiled editor assets (created by grunt build)
├── index.js                   # Main entry point
├── neuron-settings.js         # Node-RED configuration
└── Gruntfile.js              # Build configuration
```

## Environment Configuration
- `.env` file in repository root: Hedera credentials, Argos token
- `~/.neuron-node-builder/.env`: User-specific runtime configuration (for packaged app)
- `tests/visual/fixtures/env/.env.visual`: Test credentials for visual tests
