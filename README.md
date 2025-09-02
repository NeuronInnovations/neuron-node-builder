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

## Creating Standalone Executables

You can package Neuron Green as standalone executables for distribution without requiring users to install Node.js or any dependencies.

### Building All Platform Executables

To build executables for all supported platforms (Windows, macOS, Linux):

```bash
npm run package
```

This will create executables in the `build/releases/` directory:
- `latest-win-x64.exe` - Windows 64-bit
- `latest-darwin64` - macOS (both Intel and Apple Silicon)
- `latest-linux-x64` - Linux 64-bit

### Building Without User Prompts (CI/Automation)

For automated builds or CI environments:

```bash
npm run package -- --no-prompt
```

This automatically uses the latest available wrapper version.

### Running the Standalone Executable

#### Method 1: Command Line
```bash
# Navigate to the releases directory
cd build/releases

# Run the executable
./latest-macos-x64          # macOS/Linux
latest-win-x64.exe          # Windows
```

#### Method 2: Double-Click App Bundle (macOS Only)

To create a double-clickable macOS application:

```bash
# Create app bundle structure
mkdir -p "Neuron-Node-Builder.app/Contents/MacOS"
mkdir -p "Neuron-Node-Builder.app/Contents/Resources"

# Copy the executable
cp build/releases/latest-macos-x64 "Neuron-Node-Builder.app/Contents/MacOS/"

# Create the Info.plist file
cat > "Neuron-Node-Builder.app/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>latest-macos-x64</string>
    <key>CFBundleIdentifier</key>
    <string>com.neuron.node-builder</string>
    <key>CFBundleName</key>
    <string>Neuron Node Builder</string>
    <key>CFBundleVersion</key>
    <string>4.0.9</string>
    <key>CFBundleShortVersionString</key>
    <string>4.0.9</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>LSUIElement</key>
    <true/>
</dict>
</plist>
EOF
```

Now you can double-click `Neuron-Node-Builder.app` in Finder to start the application.

### Accessing the Application

After starting the executable (either method):

1. **Open your browser** and navigate to: `http://127.0.0.1:1880`
2. **The Node-RED interface** will be available with all Neuron nodes pre-loaded
3. **Environment configuration** will be loaded from `~/.neuron-node-builder/.env`

### Distribution Notes

- **Single File Distribution**: Share just the executable file (`latest-macos-x64`, etc.)
- **App Bundle Distribution**: Share the entire `Neuron-Node-Builder.app` folder (macOS only)
- **Dependencies**: The executable includes all Node.js dependencies and Neuron wrapper binaries
- **Environment**: Users will need to configure their own `.env` file with Hedera credentials

### What's Included in the Executable

The standalone executable includes:
- Complete Node-RED runtime (v4.0.9)
- All Neuron custom nodes (buyer, seller, p2p, etc.)
- Platform-specific neuron-wrapper binary
- All Node.js dependencies
- Custom Neuron theme and settings

## Professional Distribution (macOS)

For professional distribution on macOS, you can create a signed and notarized DMG installer that provides a seamless installation experience without security warnings.

### Prerequisites for Professional Distribution

1. **Apple Developer Account** - Required for code signing
2. **Developer ID Application Certificate** - For code signing
3. **App Store Connect API Key** - For notarization
4. **macOS Development Environment** - Xcode Command Line Tools

### Step 1: Create the Package

Build the app bundle and cross-platform executables:

```bash
npm run package
```

This creates:
- `build/releases/Neuron-Node-builder.app` - macOS app bundle
- `build/releases/latest-macos-x64` - macOS executable
- `build/releases/latest-linux-x64` - Linux executable
- `build/releases/latest-win-x64.exe` - Windows executable

### Step 2: Create the DMG Installer

Create a professional DMG installer with drag-and-drop installation:

```bash
./create-dmg.sh
```

This script will:
- ✅ Validate that the app bundle exists
- ✅ Calculate optimal DMG size
- ✅ Create a temporary DMG with the app bundle
- ✅ Mount and customize the DMG (add Applications folder symlink)
- ✅ Apply custom styling and layout
- ✅ Convert to final compressed DMG format
- ✅ Generate `build/releases/Neuron-Node-Builder.dmg` (~150MB)

The resulting DMG provides a professional installation experience where users can drag the app to their Applications folder.

### Step 3: Sign and Notarize the DMG

For distribution without security warnings, sign and notarize the DMG:

```bash
./sign-and-notarize-dmg.sh
```

This script will:
- ✅ Validate prerequisites (certificate, API key, tools)
- ✅ Find or import your Developer ID Application certificate
- ✅ Create a signed copy of the DMG
- ✅ Submit to Apple for notarization
- ✅ Wait for notarization approval (~2-10 minutes)
- ✅ Staple the notarization ticket to the DMG
- ✅ Generate `build/releases/Neuron-Node-Builder-signed.dmg`

**Required Files for Signing:**
- `certificate_2_decoded.p12` - Your Developer ID certificate (PKCS#12 format)
- `neuron/apple-credentials` - App Store Connect API key (contains private key)

### Certificate and API Key Setup

#### Getting Your Developer ID Certificate

1. Log into [Apple Developer Portal](https://developer.apple.com)
2. Go to Certificates, Identifiers & Profiles > Certificates
3. Create a new "Developer ID Application" certificate
4. Download and install in Keychain Access
5. Export as `.p12` file with password `N3uron.W0rld`
6. Save as `certificate_2_decoded.p12` in project root

#### Getting App Store Connect API Key

1. Log into [App Store Connect](https://appstoreconnect.apple.com)
2. Go to Users and Access > Keys > App Store Connect API
3. Create a new key with "Developer" role
4. Download the `.p8` file
5. Save the private key content to `neuron/apple-credentials`

**Example `neuron/apple-credentials` format:**
```
-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
[your private key content]
...
-----END PRIVATE KEY-----
```

### End-to-End Distribution Workflow

For a complete professional distribution build:

```bash
# 1. Build the package
npm run package

# 2. Create the DMG
./create-dmg.sh

# 3. Sign and notarize
./sign-and-notarize-dmg.sh
```

**Final Result:** `build/releases/Neuron-Node-Builder-signed.dmg`

This DMG is ready for distribution and will install on any macOS system without security warnings.

### Distribution Benefits

✅ **Professional Installation Experience**
- Drag-and-drop to Applications folder
- Custom DMG background and layout
- No security warnings or gatekeeper issues

✅ **Code Signed & Notarized**
- Signed with Developer ID certificate
- Notarized by Apple for trust verification
- Stapled notarization ticket for offline verification

✅ **Universal Compatibility**
- Works on both Intel and Apple Silicon Macs
- Supports macOS 10.15+ (Catalina and later)
- No user configuration required for basic installation

### Script Details

- **`create-dmg.sh`** - Creates professional DMG installer with custom styling
- **`sign-and-notarize-dmg.sh`** - Handles code signing and Apple notarization
- **Certificate management** - Automatic keychain import/export
- **Error handling** - Comprehensive validation and cleanup
- **Cross-platform** - Scripts work on any macOS development machine

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

