# Codebase Structure

## Repository Layout

```
node-builder/
├── .github/workflows/           # GitHub Actions CI/CD pipelines
│   ├── visual-ai-regression.yml # Visual regression testing
│   └── build-and-sign-production.yml # Build, sign, notarize workflow
│
├── neuron/                      # Custom Neuron components
│   ├── nodes/                   # Custom Node-RED nodes
│   │   ├── buyer.js/.html       # Buyer node implementation
│   │   ├── seller.js/.html      # Seller node implementation
│   │   ├── neuron-gpt.js/.html  # AI integration node
│   │   ├── neuron-p2p.js/.html  # P2P communication node
│   │   ├── global-contract-monitor.js # Contract monitoring service
│   │   ├── process-manager.js   # Process lifecycle management
│   │   ├── process-registry.js  # Process tracking
│   │   ├── port-manager.js      # Port allocation
│   │   └── icons/               # Node icons
│   │
│   ├── services/                # Core services
│   │   ├── NeuronEnvironment.js # Environment configuration
│   │   ├── NeuronSDKResolver.js # SDK path resolution
│   │   ├── NeuronUserHome.js    # User directory management
│   │   ├── NeuronUpdateService.js # Update checking
│   │   ├── TemplateService.js   # Template management
│   │   └── HederaContractService.js # Contract interactions
│   │
│   ├── theme/                   # UI customization
│   │   ├── neuronLogo.png       # Branding
│   │   ├── balance-service.js   # Account balance display
│   │   ├── header-balance.css   # Custom styling
│   │   └── template-browser-*.js # Template browser UI
│   │
│   ├── pages/                   # Static pages
│   │   └── setup.html           # Initial setup wizard
│   │
│   └── routes/                  # Custom API routes
│
├── packages/                    # Node-RED monorepo structure
│   └── node_modules/
│       ├── node-red/            # Core Node-RED runtime
│       ├── @node-red/editor-client/ # Web UI
│       ├── @node-red/editor-api/    # Admin API
│       ├── @node-red/runtime/       # Runtime engine
│       ├── @node-red/nodes/         # Core nodes
│       ├── @node-red/registry/      # Node registry
│       └── @node-red/util/          # Utility functions
│
├── tests/                       # Test suite
│   └── visual/                  # Visual regression tests
│       ├── startup.spec.ts      # Startup tests
│       ├── buyer-config.spec.ts # Buyer node tests
│       ├── seller-config.spec.ts # Seller node tests
│       ├── fixtures/            # Test data
│       │   ├── workspaces/      # Test workspaces
│       │   └── env/.env.visual  # Test environment
│       └── support/             # Test utilities
│           ├── global-setup.ts  # Test setup
│           ├── global-teardown.ts # Test cleanup
│           └── argos.ts         # Argos integration
│
├── build/                       # Build output directory
│   └── releases/                # Packaged executables
│
├── templates/                   # Flow templates
├── scripts/                     # Build scripts
├── public/                      # Static assets
│
├── neuron-settings.js           # Node-RED configuration
├── Gruntfile.js                 # Build configuration
├── build.js                     # Packaging script
├── package.json                 # Dependencies and scripts
├── playwright.config.ts         # Visual test configuration
├── .jshintrc                    # Code style rules
├── .env.example                 # Environment template
└── README.md                    # Documentation
```

## Key Directories

### `/neuron/nodes/`
Custom Node-RED nodes for Neuron functionality. Each node has:
- `.js` file: Node implementation (server-side logic)
- `.html` file: Node UI and help text (client-side)

### `/neuron/services/`
Core services that support the Neuron nodes:
- Environment management
- SDK integration
- Contract monitoring
- Process management

### `/packages/node_modules/`
Node-RED monorepo structure (forked from upstream):
- Core runtime and editor
- Built-in nodes
- API layers

### `/tests/visual/`
Playwright-based visual regression tests:
- Uses Argos CI for AI-powered comparison
- Tests buyer/seller node configurations
- Runs on macOS and Windows

## Important Files

### Configuration
- `neuron-settings.js` - Main Node-RED configuration
- `.env` - Environment variables (gitignored)
- `package.json` - Dependencies and npm scripts

### Build System
- `Gruntfile.js` - Build tasks (concat, uglify, sass)
- `build.js` - Executable packaging
- `playwright.config.ts` - Test configuration

### Documentation
- `README.md` - Setup and usage guide
- `TESTING_GUIDE.md` - Visual testing documentation
- `API.md` - API documentation
- `BUILD_README.md` - Build process details
