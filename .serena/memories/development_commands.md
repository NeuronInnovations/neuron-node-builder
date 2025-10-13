# Development Commands

## Essential Commands

### Installation
```bash
npm install                    # Install all dependencies
npx grunt build               # Build Node-RED editor assets (REQUIRED before first run)
```

**CRITICAL**: Always run `npx grunt build` before starting the application for the first time. This compiles:
- JavaScript source files → minified bundles
- SASS files → CSS
- Vendor libraries → production assets
- Creates the `public/` directory with all required static files

### Running the Application

#### Development
```bash
npm run start                 # Start Node-RED with neuron-settings.js
npm run dev                   # Watch mode: build + auto-restart on changes
```

Default URL: http://localhost:1880

#### Build Commands
```bash
npm run build                 # Grunt build (same as npx grunt build)
npm run build-dev            # Development build (no minification)
```

### Testing

#### Visual Regression Tests (Playwright + Argos)
```bash
# Local testing (no upload)
npm run test:visual          # Run all visual tests
npm run test:visual:ui       # Interactive UI mode
npm run test:visual:headed   # Run with visible browser
npm run test:visual:debug    # Run with debugger
npm run test:visual:report   # View test report

# With Argos upload
npm run test:visual:argos    # Upload to Argos CI
npm run test:visual:ci       # CI mode with upload
ARGOS_UPLOAD=true npm run test:visual  # Explicit upload

# Specific tests
npx playwright test tests/visual/startup.spec.ts --project=chromium-mac
npx playwright test tests/visual/buyer-config.spec.ts
```

#### Unit Tests (Mocha)
```bash
npm test                     # Run all tests (via Grunt)
grunt                        # Build + lint + test with coverage
grunt no-coverage           # Build + lint + test without coverage
grunt test-core             # Test core runtime only
grunt test-nodes            # Test core nodes only
grunt test-editor           # Lint editor code
```

### Code Quality

#### Linting
```bash
grunt jshint:editor         # Lint editor JavaScript
grunt jshint:nodes          # Lint core nodes
grunt jshint:tests          # Lint test files
```

#### Code Coverage
```bash
grunt coverage              # Run tests with coverage
grunt nyc:all              # Full coverage report
grunt nyc:core             # Core runtime coverage
grunt nyc:nodes            # Nodes coverage
```

### Build & Package

#### Development Build
```bash
grunt build                 # Production build (minified)
grunt build-dev            # Development build (not minified)
grunt watch                # Watch and rebuild on changes
```

#### Create Executables
```bash
npm run package            # Build standalone executables
npm run create-app-bundle  # Create macOS .app bundle
npm run copy-binaries      # Copy neuron-wrapper binaries
```

### Go SDK Dependencies

The project requires Go binaries. Build from source:

```bash
# Clone and build neuron-nodered-sdk-wrapper
git clone https://github.com/NeuronInnovations/neuron-nodered-sdk-wrapper.git
cd neuron-nodered-sdk-wrapper
go build -o neuron-nodered-sdk-wrapper

# For cross-platform builds:
GOOS=darwin GOARCH=arm64 go build -o neuron-nodered-sdk-wrapper-darwin-arm64
GOOS=darwin GOARCH=amd64 go build -o neuron-nodered-sdk-wrapper-darwin-amd64
GOOS=windows GOARCH=amd64 go build -o neuron-nodered-sdk-wrapper.exe
```

### Documentation
```bash
grunt docs                  # Generate API documentation
grunt jsdoc                # Generate JSDoc
```

## Grunt Task Reference

### Main Tasks
- `grunt` (default) - Build + verify + lint + test with coverage
- `grunt build` - Full production build
- `grunt dev` - Development mode with watch
- `grunt test-core` - Test core runtime
- `grunt test-nodes` - Test nodes
- `grunt test-ui` - Test editor UI (requires special setup)
- `grunt release` - Create distribution package

### Internal Tasks (used by main tasks)
- `grunt concat:build` - Concatenate editor JS
- `grunt concat:vendor` - Concatenate vendor JS
- `grunt uglify:build` - Minify JavaScript
- `grunt sass:build` - Compile SASS to CSS
- `grunt copy:build` - Copy assets
- `grunt clean:build` - Clean build artifacts
- `grunt jsonlint` - Validate JSON files
- `grunt attachCopyright` - Add license headers

## Environment Variables

Required in `.env` file:

### Hedera Credentials
```bash
HEDERA_OPERATOR_ID=0.0.XXXXXX           # Your Hedera account ID
HEDERA_OPERATOR_KEY=302e020100300...    # Your private key
HEDERA_OPERATOR_EVM=0x1234567890abc...  # EVM address
```

### SDK Configuration
```bash
NEURON_SDK_PATH=/path/to/neuron-nodered-sdk-wrapper  # Required
SDK_LOG_FOLDER=/path/to/logs                          # Optional
```

### Network Configuration (pre-configured)
```bash
HEDERA_NETWORK=testnet
HEDERA_RPC=https://testnet.hashio.io/api
CONTRACT_ID=0.0.6097499
CONTRACT_EVM=0xFcBC43d2207580F82c07aE2E09e9d0cA0211B048
# ... (other contract IDs)
```

### Visual Testing
```bash
ARGOS_TOKEN=argos_xxxxx     # For Argos CI integration
VISUAL_TEST_MODE=1          # Enable visual test mode
```

## macOS System Commands (Darwin)

Standard Unix commands work on macOS:
- `ls`, `cd`, `pwd` - Navigation
- `grep`, `find` - Search
- `git` - Version control
- `npm`, `node` - Node.js tools
- `codesign`, `xcrun` - macOS signing tools

## CI/CD

### GitHub Actions
Visual tests run automatically:
- On every PR to main/master
- Daily at 6 AM UTC
- Manual workflow dispatch

### Build Workflow
Production builds run on tags:
- Tag format: `v1.0.0`
- Creates signed macOS app bundles
- Notarizes with Apple
- Publishes GitHub release
