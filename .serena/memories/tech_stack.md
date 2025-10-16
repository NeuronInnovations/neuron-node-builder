# Technology Stack

## Core Technologies

### Backend
- **Node.js**: v18.5+ (required for Node-RED 4.x)
- **Node-RED**: v4.x (fork customized for Neuron)
- **Express**: v4.21.2 (web server)
- **WebSocket**: v7.5.10 (real-time communication with Go processes)
- **Go**: v1.19+ (for SDK wrapper compilation)

### Blockchain & Crypto
- **Hedera SDK**: @hashgraph/sdk v2.49.2
- **Ethers.js**: v6.13.4 (Ethereum utilities)
- **neuron-js-registration-sdk**: GitHub package for device/account management
- **neuron-nodered-sdk-wrapper**: Go binary for blockchain operations

### Frontend (Node-RED Editor)
- **jQuery**: v3.5.1 with jQuery UI
- **Ace Editor**: Code editor for flows
- **Monaco Editor**: Advanced code editing
- **D3.js**: v3 (visualizations)
- **i18next**: v24.2.3 (internationalization)
- **JSONata**: v2.0.6 (query/transformation)
- **SASS**: v1.62.1 (CSS preprocessing)
- **Mermaid**: v11.6.0 (diagrams)

### Testing
- **Mocha**: v9.2.2 (unit test framework)
- **Sinon**: v11.1.2 (mocking/stubbing)
- **Should**: v13.2.3 (assertions)
- **Supertest**: v6.3.3 (HTTP assertions)
- **Playwright**: v1.55.1 (E2E and visual testing)
- **Argos CI**: v6.1.8 (visual regression testing)
- **TypeScript**: v5.6.3 (for Playwright tests)

### Build Tools
- **Grunt**: v1.6.1 (task runner for building editor assets)
- **pkg**: v5.8.1 (packaging Node.js app as executable)
- **uglify-js**: v3.19.3 (JavaScript minification)
- **jshint**: Code linting for JavaScript

### Utilities
- **dotenv**: v17.2.0 (environment variable management)
- **fs-extra**: v11.3.0 (enhanced file system operations)
- **got**: v12.6.1 (HTTP client)
- **js-yaml**: v4.1.0 (YAML parsing)
- **moment/moment-timezone**: Date/time handling
- **multer**: v1.4.5 (file uploads)
- **passport**: v0.7.0 (authentication)
- **tar**: v7.4.3 (archive handling)

## Development Tools
- **nodemon**: v3.1.9 (auto-restart during development)
- **ts-node**: v10.9.2 (TypeScript execution)
- **npm**: Package management
- **Git**: Version control with submodules

## Platform-Specific
- **macOS**: Xcode Command Line Tools, codesign, notarytool
- **Windows**: Windows SDK for native builds
- **Cross-platform**: OS-specific binary selection (darwin-arm64, darwin-x64, win64)
