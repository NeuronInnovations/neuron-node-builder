# Suggested Commands

## Essential Development Commands

### Installation & Setup
```bash
# Install dependencies
npm install

# Build Node-RED editor assets (CRITICAL - must run before starting)
npx grunt build

# Build neuron-registration library
cd neuron/nodes/neuron-registration
npm install
npm run build
cd ../../..
```

### Running the Application
```bash
# Start Node-RED with Neuron settings
npm run start

# Development mode (auto-restart on changes)
npm run dev

# Development build (no minification)
npm run build-dev
```

### Testing

#### Unit Tests
```bash
# Run all tests
npm test
# OR
grunt

# Run without coverage
grunt no-coverage

# Test core runtime only
grunt test-core

# Test editor code style
grunt test-editor

# Test nodes only
grunt test-nodes

# Run with coverage
grunt coverage
```

#### Visual Regression Tests
```bash
# Run visual tests locally (no upload)
npm run test:visual

# Run with UI mode (interactive)
npm run test:visual:ui

# Run with visible browser
npm run test:visual:headed

# Run with debugger
npm run test:visual:debug

# Run and upload to Argos CI
npm run test:visual:argos
# OR
ARGOS_UPLOAD=true npm run test:visual

# View test report
npm run test:visual:report

# CI mode (auto-upload)
npm run test:visual:ci
```

### Build & Package

#### Development Builds
```bash
# Build editor assets
grunt build

# Watch for changes and rebuild
grunt watch
```

#### Production Packaging
```bash
# Package application as executable
npm run package

# Create macOS app bundle
npm run create-app-bundle

# Copy required binaries
npm run copy-binaries
```

### Code Quality
```bash
# Lint editor JavaScript
grunt jshint:editor

# Lint all code
grunt jshint

# Validate JSON files (locales, config)
grunt jsonlint
```

### Documentation
```bash
# Generate API documentation
grunt docs
# OR
grunt jsdoc
```

### Utility Commands

#### File Operations (macOS/Darwin)
```bash
# List files
ls -la

# Find files
find . -name "*.js"

# Search in files
grep -r "pattern" .

# Note: Prefer using Glob and Grep tools in Claude Code instead
```

#### Git Operations
```bash
# Check status
git status

# View diff
git diff

# Create branch
git checkout -b feature/branch-name

# View commit history
git log --oneline
```

#### Process Management
```bash
# Find processes using a port
lsof -i :1880

# Kill process by PID
kill -9 <PID>

# Check Node.js version
node --version

# Check npm version
npm --version
```

### Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit environment file
nano .env  # or vim .env
```

## Platform-Specific Commands

### macOS Only
```bash
# Install Playwright browsers
npx playwright install chromium

# Check code signing certificates
security find-identity -v -p codesigning

# Sign app bundle
codesign --force --deep --sign "Developer ID" --options runtime path/to/app

# Notarize app
xcrun notarytool submit app.zip --key AuthKey.p8 --key-id ID --issuer ISSUER --wait

# Verify notarization
xcrun stapler validate path/to/app
```

### Windows
```bash
# Install Playwright browsers
npx playwright install chromium

# Run tests (PowerShell)
npm run test:visual
```

## Troubleshooting Commands
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Playwright cache
npx playwright uninstall --all
npx playwright install chromium

# Check Node-RED logs
# Logs appear in console when running npm start
```
