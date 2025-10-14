# Neuron Node Builder - Project Overview

## Purpose
Neuron Node Builder is a **Node-RED fork** designed for machine-to-machine commerce powered by **Hedera blockchain technology**. It provides custom nodes for buyers and sellers to interact with the Neuron network for data exchange and monetization.

## Key Features
- Custom Neuron nodes for buyer/seller operations
- Integration with Hedera blockchain (testnet/mainnet)
- Smart contract interactions (JetVision, Chat, Challenges)
- Device registration and management
- P2P communication between devices
- Visual regression testing with Argos CI
- macOS code signing and notarization workflow
- Cross-platform support (macOS, Windows)

## Tech Stack

### Core Runtime
- **Node.js**: v18.5+ (required for Node-RED 4.x)
- **Node-RED**: v4.x (included in package)
- **Go**: v1.19+ (for SDK dependencies)

### Backend Technologies
- **Express**: Web server framework
- **Hedera SDK**: Blockchain interactions (@hashgraph/sdk)
- **Ethers.js**: Ethereum/EVM interactions
- **WebSocket**: Real-time communication
- **MQTT**: IoT messaging protocol

### Frontend Technologies
- **jQuery**: DOM manipulation and UI components
- **ACE Editor**: Code editor
- **Monaco Editor**: Advanced code editor
- **D3.js**: Data visualization
- **SASS**: CSS preprocessing
- **JSONata**: Data transformation

### Build Tools
- **Grunt**: Task runner and build system
- **pkg**: Executable packaging
- **uglify-js**: JavaScript minification
- **sass**: CSS compilation

### Testing
- **Playwright**: Visual regression testing
- **Mocha**: Unit testing framework
- **Argos CI**: AI-powered visual regression
- **nyc/Istanbul**: Code coverage
- **JSHint**: JavaScript linting

### Development Tools
- **nodemon**: Auto-restart during development
- **TypeScript**: Type checking for tests
- **git**: Version control
- **GitHub Actions**: CI/CD pipeline

## Dependencies Overview
- Blockchain: @hashgraph/sdk, ethers, cronosjs
- Node-RED ecosystem: node-red-admin, node-red-dashboard, node-red-contrib-*
- Authentication: passport, oauth2orize, bcryptjs
- Data processing: jsonata, xml2js, cheerio
- Custom: neuron-js-registration-sdk, neuron-nodered-sdk-wrapper (Go binary)
