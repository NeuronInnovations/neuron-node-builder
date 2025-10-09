# Development Commands

## Essential Commands

### Installation & Setup
```bash
# Install dependencies
npm install

# Build Node-RED editor assets (REQUIRED before first run)
npx grunt build

# Build neuron-registration library
cd neuron/nodes/neuron-registration
npm install
npm run build
cd ../../..
```

### Development Workflow
```bash
# Start Node-RED (development)
npm run start

# Development with auto-reload
npm run dev

# Build for development
npm run build-dev
```

### Building & Testing
```bash
# Run all tests (using Grunt)
npm test
# or
grunt

# Build production assets
npm run build
# or
grunt build

# Generate documentation
npm run docs
# or
grunt docs
```

### Visual Testing (Playwright + SmartUI)
```bash
# Run visual regression tests
npm run test:visual

# Run visual tests with UI
npm run test:visual:ui

# Show test report
npm run test:visual:report

# Run specific project
npx playwright test tests/visual --project=chromium-mac
npx playwright test tests/visual --project=chromium-win
```

### Packaging & Distribution
```bash
# Package application (creates standalone executable)
npm run package

# Copy binaries to build folder
npm run copy-binaries

# Create macOS app bundle
npm run create-app-bundle
```

### Code Signing (macOS only)
```bash
# Complete build workflow
./build-workflow.sh

# Sign and notarize app
./sign-and-notarize-app.sh

# Simple signing
./simple-sign.sh
```

### Grunt Tasks
```bash
# Run all tests
grunt

# Build everything
grunt build

# Development build
grunt build-dev

# Clean build artifacts
grunt clean

# Run JSHint linter
grunt jshint

# Run mocha tests
grunt simplemocha

# Run with coverage
grunt nyc:all
grunt nyc:core
grunt nyc:nodes
```

## Utility Commands (macOS/Darwin)

### File Operations
```bash
ls          # List directory contents
cd          # Change directory
pwd         # Print working directory
mkdir       # Create directory
rm          # Remove files
cp          # Copy files
mv          # Move files
```

### Search & Analysis
```bash
grep        # Search text patterns
find        # Find files
rg          # Ripgrep (faster grep)
```

### Git Operations
```bash
git status
git add .
git commit -m "message"
git push
git pull
git branch
git checkout
git log
```

### Process Management
```bash
ps aux              # List processes
kill <pid>          # Kill process
killall <name>      # Kill by name
lsof -i :<port>     # Check port usage
```

### System Information
```bash
node -v             # Node version
npm -v              # npm version
go version          # Go version
uname -a            # System info
sw_vers             # macOS version
```