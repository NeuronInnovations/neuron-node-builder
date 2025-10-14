# Environment Setup and Configuration

## Required Environment Variables

### Hedera Blockchain Credentials (Required)
```bash
HEDERA_OPERATOR_ID=0.0.XXXXXX          # Your Hedera account ID
HEDERA_OPERATOR_KEY=3030020100...      # Your Hedera private key
HEDERA_OPERATOR_EVM=0x1234...          # Your Hedera EVM address
```
**Obtain from:** [Neuron website](https://neuron.com) by creating an account

### SDK Configuration (Required)
```bash
NEURON_SDK_PATH=/path/to/neuron-nodered-sdk-wrapper  # Absolute path to SDK executable
```

### Network Configuration (Pre-filled - Do NOT change)
```bash
NODE_ENV=Development
HEDERA_NETWORK=testnet
HEDERA_RPC=https://testnet.hashio.io/api

# DID Topics
NEURON_DID_TOPIC=0.0.6039249
EDGE_DID_TOPIC=0.0.6039250
EDGE_VC_TOPIC=0.0.6039251
NEURON_ISSUER_DID=did:hedera:testnet:...

# Smart Contracts (using same contract for all)
JETVISION_CONTRACT_ID=0.0.6097499
JETVISION_CONTRACT_EVM=0xFcBC43d2207580F82c07aE2E09e9d0cA0211B048
CONTRACT_ID=0.0.6097499
CONTRACT_EVM=0xFcBC43d2207580F82c07aE2E09e9d0cA0211B048
CHAT_CONTRACT_ID=0.0.6097499
CHAT_CONTRACT_EVM=0xFcBC43d2207580F82c07aE2E09e9d0cA0211B048
CHALLENGES_CONTRACT_ID=0.0.6097499
CHALLENGES_CONTRACT_EVM=0xFcBC43d2207580F82c07aE2E09e9d0cA0211B048
```

### Optional Configuration
```bash
SDK_LOG_FOLDER=/path/to/logs           # Folder for SDK process logs
NEURON_USER_PATH=/custom/user/path     # Custom user data path
```

### Visual Testing (Optional - for developers)
```bash
LT_USERNAME=your-lambdatest-username
LT_ACCESS_KEY=your-lambdatest-key
PROJECT_TOKEN=your-smartui-project-token
```

## Building Go Dependencies from Source

### Prerequisites
- Go v1.19 or higher
- Git
- Platform: macOS (Intel/ARM) or Windows x64

### Step 1: Install Go
#### macOS:
```bash
brew install go
# or download from https://golang.org/dl/
```

#### Windows:
Download installer from https://golang.org/dl/

### Step 2: Verify Go Installation
```bash
go version  # Should show v1.19+
```

### Step 3: Build neuron-nodered-sdk-wrapper
```bash
# Clone repository
git clone https://github.com/NeuronInnovations/neuron-nodered-sdk-wrapper.git
cd neuron-nodered-sdk-wrapper

# Build for current platform
go build -o neuron-nodered-sdk-wrapper

# Cross-compile for specific platforms:
# macOS ARM64 (Apple Silicon)
GOOS=darwin GOARCH=arm64 go build -o neuron-nodered-sdk-wrapper-darwin-arm64

# macOS Intel
GOOS=darwin GOARCH=amd64 go build -o neuron-nodered-sdk-wrapper-darwin-amd64

# Windows x64
GOOS=windows GOARCH=amd64 go build -o neuron-nodered-sdk-wrapper.exe

# Note: Linux builds are no longer supported
```

### Step 4: Place Binaries
```bash
# Create bin directory in project root
mkdir -p /path/to/neuron-node-builder/bin

# Copy executable
cp neuron-nodered-sdk-wrapper /path/to/neuron-node-builder/bin/

# Make executable (Unix-like systems)
chmod +x /path/to/neuron-node-builder/bin/neuron-nodered-sdk-wrapper
```

### Step 5: Update .env
```bash
NEURON_SDK_PATH=/path/to/neuron-node-builder/bin/neuron-nodered-sdk-wrapper
```

## neuron-registration Library Setup

This library must be built before running:
```bash
cd neuron/nodes/neuron-registration
npm install
npm run build
cd ../../..
```

## Complete Setup Sequence

### First Time Setup
```bash
# 1. Clone repository
git clone <repository-url>
cd neuron-node-builder

# 2. Install Node.js dependencies
npm install

# 3. Build Node-RED editor assets (CRITICAL!)
npx grunt build

# 4. Build neuron-registration library
cd neuron/nodes/neuron-registration
npm install
npm run build
cd ../../..

# 5. Build Go dependencies (see above)
# Follow "Building Go Dependencies from Source" section

# 6. Configure environment
cp .env.example .env
# Edit .env and add:
#   - HEDERA_OPERATOR_ID
#   - HEDERA_OPERATOR_KEY
#   - HEDERA_OPERATOR_EVM
#   - NEURON_SDK_PATH

# 7. Verify setup
npx grunt build  # Should complete without errors
npm run start    # Should open Node-RED at http://localhost:1880
```

## Platform-Specific Notes

### macOS
- Supports both Intel (x64) and Apple Silicon (arm64)
- Code signing required for distribution
- Gatekeeper may block unsigned binaries
- Use `chmod +x` to make binaries executable

### Windows
- Only x64 architecture supported
- Use `.exe` extension for executables
- PowerShell or Command Prompt for commands
- Antivirus may flag unsigned executables

### Darwin System Commands
Since this is a macOS (Darwin) system, use these commands:
```bash
ls          # List files
cd          # Change directory
grep        # Search text
find        # Find files
ps          # Process status
kill        # Kill process
chmod       # Change permissions
codesign    # Code signing (macOS)
security    # Keychain access (macOS)
```

## Troubleshooting Environment Issues

### "NEURON_SDK_PATH not set"
- Ensure `.env` file exists in project root
- Verify NEURON_SDK_PATH points to correct executable
- Check file has execute permissions

### "Executable not found"
- Verify file exists at specified path
- Check platform-specific binary (darwin/win32)
- Ensure correct architecture (x64/arm64)

### "Missing Hedera credentials"
- Complete setup wizard on first run
- Or manually add to `.env` file
- Obtain credentials from Neuron website

### "Black screen / MIME errors"
- **Root cause**: Missing `npx grunt build` step
- **Solution**: Run `npx grunt build` before starting
- **Verify**: Check `packages/node_modules/@node-red/editor-client/public/` exists

### "Module not found: neuron-registration"
- Build the library: `cd neuron/nodes/neuron-registration && npm run build`
- Verify build output exists