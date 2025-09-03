# Neuron Node Builder

A Node-RED fork for machine-to-machine commerce powered by Hedera blockchain technology. This package provides custom nodes for buyers and sellers to interact with the Neuron network.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **Git**

**Note:** Node-RED is already included in this package, so no separate installation is required.

## Required Dependencies

This package requires two Go-based dependencies that must be compiled from source:

1. **neuron-go-hedera-sdk** - The Go Hedera SDK
2. **neuron-nodered-sdk-wrapper** - The Node-RED SDK wrapper

Both must be compiled for your specific platform and placed in the same directory.

### Supported Platforms

- **macOS** (Intel x64 and Apple Silicon ARM64)
- **Linux** (x64 and ARM64)
- **Windows** (x64)

## Installation & Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd neuron-green
```

### Step 2: Install Node.js Dependencies

```bash
npm install
```

### Step 3: Build Go Dependencies from Source

Follow the detailed instructions in the [Building Dependencies from Source](#building-dependencies-from-source) section below to compile the required Go dependencies.

### Step 4: Configure Environment Variables

A `.env` file is pre-filled with default values in the project root. **Do not change the pre-filled values.** You only need to update the following variables:

```bash
# Your Hedera Credentials (Required - obtain from neuron website)
HEDERA_OPERATOR_ID=0.0.XXXXXX
HEDERA_OPERATOR_KEY=3030020100300706052b8104000a04220420...
HEDERA_OPERATOR_EVM=0x1234567890abcdef...

# SDK Configuration (Required - path to compiled wrapper)
NEURON_SDK_PATH=/path/to/neuron-nodered-sdk-wrapper

# Optional: Logging Configuration
SDK_LOG_FOLDER=/path/to/logs
```

#### Important Notes:

1. **Hedera Credentials**: You must obtain `HEDERA_OPERATOR_ID`, `HEDERA_OPERATOR_KEY`, and `HEDERA_OPERATOR_EVM` by creating an account on the [Neuron website](https://neuron.com)
2. **NEURON_SDK_PATH**: Must point to the full path of `neuron-nodered-sdk-wrapper` executable you compiled
3. **SDK_LOG_FOLDER**: Optional. If not set, process logs will be suppressed
4. **Pre-filled Values**: All other values in the `.env` file are pre-configured and should not be changed

### Step 5: Build the neuron-registration Library

The package includes a submodule for the neuron-registration library. Build it:

```bash
cd neuron/nodes/neuron-registration
npm install
npm run build
cd ../../..
```

### Step 6: Start Neuron Green

Start Neuron Green with the custom settings:

```bash
npm run start
```


## Building Dependencies from Source

Follow these steps to compile the required Go dependencies from source:

### Prerequisites for Building

- **Go** (v1.19 or higher) - [Download from golang.org](https://golang.org/dl/)
- **Git**

### Step 1: Install Go

#### On macOS:
```bash
# Using Homebrew
brew install go

# Or download from golang.org
# Visit https://golang.org/dl/ and download the macOS installer
```

#### On Linux:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install golang-go

# CentOS/RHEL/Fedora
sudo yum install golang
# or
sudo dnf install golang
```

#### On Windows:
Download the installer from [golang.org/dl/](https://golang.org/dl/)

### Step 2: Verify Go Installation

```bash
go version
```

### Step 3: Clone and Build neuron-go-hedera-sdk

```bash
# Clone the repository
git clone https://github.com/NeuronInnovations/neuron-go-hedera-sdk.git
cd neuron-go-hedera-sdk

# Build for your platform
go build -o neuron-go-hedera-sdk

# For cross-platform builds, you can specify the target:
# macOS ARM64 (Apple Silicon)
GOOS=darwin GOARCH=arm64 go build -o neuron-go-hedera-sdk-darwin-arm64

# macOS Intel
GOOS=darwin GOARCH=amd64 go build -o neuron-go-hedera-sdk-darwin-amd64

# Linux x64
GOOS=linux GOARCH=amd64 go build -o neuron-go-hedera-sdk-linux-amd64

# Linux ARM64
GOOS=linux GOARCH=arm64 go build -o neuron-go-hedera-sdk-linux-arm64

# Windows
GOOS=windows GOARCH=amd64 go build -o neuron-go-hedera-sdk.exe
```

### Step 4: Clone and Build neuron-nodered-sdk-wrapper

```bash
# Clone the repository
git clone https://github.com/NeuronInnovations/neuron-nodered-sdk-wrapper.git
cd neuron-nodered-sdk-wrapper

# Build for your platform
go build -o neuron-nodered-sdk-wrapper

# For cross-platform builds:
# macOS ARM64 (Apple Silicon)
GOOS=darwin GOARCH=arm64 go build -o neuron-nodered-sdk-wrapper-darwin-arm64

# macOS Intel
GOOS=darwin GOARCH=amd64 go build -o neuron-nodered-sdk-wrapper-darwin-amd64

# Linux x64
GOOS=linux GOARCH=amd64 go build -o neuron-nodered-sdk-wrapper-linux-amd64

# Linux ARM64
GOOS=linux GOARCH=arm64 go build -o neuron-nodered-sdk-wrapper-linux-arm64

# Windows
GOOS=windows GOARCH=amd64 go build -o neuron-nodered-sdk-wrapper.exe
```

### Step 5: Place Compiled Binaries

Move both compiled executables to the same directory. For example, create a `bin` directory in your project:

```bash
# Create bin directory
mkdir -p bin

# Copy the compiled executables
cp ../neuron-go-hedera-sdk/neuron-go-hedera-sdk bin/
cp ../neuron-nodered-sdk-wrapper/neuron-nodered-sdk-wrapper bin/

# Make them executable (on Unix-like systems)
chmod +x bin/neuron-go-hedera-sdk
chmod +x bin/neuron-nodered-sdk-wrapper
```

### Step 6: Update Environment Configuration

Update your `.env` file to point to the compiled wrapper:

```bash
# SDK Configuration
NEURON_SDK_PATH=/path/to/your/project/bin/neuron-nodered-sdk-wrapper
```

**Important:** Make sure both `neuron-go-hedera-sdk` and `neuron-nodered-sdk-wrapper` are in the same directory, as the wrapper depends on the SDK.

## First-Time Setup

When you first start Neuron Green, you'll be automatically redirected to a setup wizard if your Hedera credentials are not configured. The wizard will:

1. Prompt you to enter your Hedera credentials
2. Save them to the `.env` file
3. Redirect you to the normal Neuron Green interface

## Using the Custom Nodes

### Buyer Node

The Buyer node allows you to:
- Create a buyer device on the Hedera network
- Connect to selected seller nodes
- Consume data from the Neuron network

**Configuration:**
- **Smart Contract**: Select the contract type (jetvision, chat, challenges)
- **Device Type**: Specify the type of device
- **Select Sellers**: Choose which seller nodes to connect to

### Seller Node

The Seller node allows you to:
- Create a seller device on the Hedera network
- Publish data to the network
- Connect to selected buyer nodes

**Configuration:**
- **Device Name**: Name of your seller device
- **Smart Contract**: Select the contract type
- **Device Role**: Role of the device
- **Serial Number**: Unique identifier
- **Device Type**: Type of device
- **Price**: Price for the service
- **Select Buyers**: Choose which buyer nodes to connect to

## Packaging and Distribution

This section covers how to package the Neuron Node Builder application into standalone executables and create professional distribution packages for macOS.

### Prerequisites for Packaging

- **Node.js 20.x** (required for optimal memory management)
- **macOS** (for creating macOS packages)
- **Apple Developer Account** (for code signing and notarization)
- **Valid Code Signing Certificate** (Developer ID Application certificate)

### Step 1: Package the Application

First, build the standalone executable using the included build script:

```bash
# Build the standalone executable
npm run package
```

This will:
- Download the required `neuron-wrapper` binaries for your platform
- Package Node-RED and all dependencies into a single executable
- Generate the executable in `build/releases/` directory

**Note:** The build process uses `pkg` with optimized memory settings to prevent OOM errors.

### Step 2: Create macOS App Bundle (.app)

Create a professional macOS application bundle:

```bash
# Create .app bundle
npm run create-app-bundle
```

This generates:
- `build/releases/Neuron-Node-builder.app` - A proper macOS application bundle
- Includes all necessary resources and dependencies
- Ready for code signing and distribution

### Step 3: Create macOS DMG Installer

Alternatively, create a professional DMG installer:

```bash
# Create DMG installer
npm run create-dmg
```

This generates:
- `build/releases/Neuron-Node-builder.dmg` - A professional disk image installer
- Includes drag-and-drop installation
- Applications folder shortcut
- Custom volume icon (if available)

### Step 4: Code Signing and Notarization

#### Option A: Sign and Notarize App Bundle

```bash
# Sign and notarize the .app bundle
./sign-and-notarize-app.sh
```

This script will:
- Sign the app bundle with your Developer ID certificate
- Apply hardened runtime and entitlements
- Submit for Apple notarization
- Staple the notarization ticket

#### Option B: Sign and Notarize DMG

```bash
# Sign and notarize the DMG
./sign-and-notarize-dmg.sh
```

This script will:
- Sign the DMG with your Developer ID certificate
- Apply hardened runtime and entitlements
- Submit for Apple notarization
- Staple the notarization ticket

#### Option C: Simple Signing (Manual Notarization)

For quick testing or manual notarization:

```bash
# Simple signing without automatic notarization
./simple-sign.sh
```

### Step 5: Complete Build Workflow

Run the complete automated workflow:

```bash
# Run complete build, package, and sign workflow
./build-workflow.sh
```

This script automates the entire process:
1. Package the application
2. Create app bundle or DMG
3. Sign with code signing certificate
4. Submit for notarization
5. Staple the notarization ticket

### Configuration Files

#### entitlements.plist

The packaging process automatically includes an `entitlements.plist` file with necessary permissions:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
</dict>
</plist>
```

These entitlements allow:
- JIT compilation for Node.js
- Third-party library loading
- Dynamic code execution

#### Environment Configuration

The packaged application uses:
- Port 1880 for Node-RED (configurable in `neuron-settings.js`)
- Automatic browser opening after startup
- Environment variables from `~/.neuron-node-builder/.env`

### Distribution

After successful signing and notarization:

1. **App Bundle**: Users can drag the `.app` to Applications folder
2. **DMG**: Users can mount and install via drag-and-drop
3. **No Security Warnings**: Properly signed and notarized packages bypass Gatekeeper
4. **Professional Installation**: Clean, professional user experience

### Troubleshooting Packaging Issues

#### Common Build Errors

1. **"Fatal javascript OOM in MemoryChunk allocation failed during deserialization"**
   - Ensure you're using Node.js 20.x
   - The build script includes optimized memory settings

2. **"Binary path does not exist"**
   - Check that `build/bin/` contains the required binaries
   - Verify the build process completed successfully

3. **"Error loading settings file"**
   - Ensure `neuron-settings.js` is included in the package
   - Check the pkg configuration in `build.js`

#### Code Signing Issues

1. **"codesign not found"**
   - Install Xcode Command Line Tools: `xcode-select --install`

2. **"No Developer ID certificate found"**
   - Import your Developer ID certificate to the keychain
   - Use the provided import scripts or import manually

3. **Notarization failures**
   - Check Apple's notarization logs for specific issues
   - Ensure all dependencies are properly signed
   - Verify the entitlements are appropriate

### Advanced Configuration

#### Custom Build Options

Modify `build.js` to customize:
- Target platforms and architectures
- Memory allocation settings
- Asset inclusion/exclusion
- Binary download sources

#### Custom Signing Options

Modify signing scripts to:
- Use different certificates
- Apply custom entitlements
- Configure notarization settings
- Set custom bundle identifiers

## Troubleshooting

### Common Issues

1. **"NEURON_SDK_PATH environment variable is not set"**
   - Ensure you've set the `NEURON_SDK_PATH` in your `.env` file
   - Make sure the path points to the correct executable

2. **"Executable not found"**
   - Verify the executable exists at the specified path
   - Ensure you downloaded the correct version for your platform
   - Check file permissions (should be executable)

3. **"Missing Hedera credentials"**
   - Complete the setup wizard when Node-RED starts
   - Or manually add your credentials to the `.env` file

4. **Process fails to start**
   - Check the console logs for error messages
   - Verify all environment variables are set correctly
   - Ensure the Go SDK dependencies are in the same directory

### Log Files

If `SDK_LOG_FOLDER` is set, check the log files for detailed error information:
- `buyer-{nodeId}-stdout.log` - Buyer process stdout
- `buyer-{nodeId}-stderr.log` - Buyer process stderr
- `seller-{nodeId}-stdout.log` - Seller process stdout
- `seller-{nodeId}-stderr.log` - Seller process stderr