# Neuron Node Builder - Build Process

This document describes the complete build process for creating a standalone macOS executable and DMG installer for the Neuron Node Builder application.

## Prerequisites

- **Node.js 20.x** (required for building)
- **macOS** (for building macOS executables)
- **Git** (for cloning the repository)

## Quick Start

### Option 1: Automated Build Workflow (Recommended)

```bash
# Run the complete build workflow
npm run build-workflow
```

This will automatically:
1. Check Node.js version
2. Install dependencies
3. Build the executable
4. Create the app bundle
5. Generate the DMG file
6. Verify all outputs

### Option 2: Manual Step-by-Step Build

```bash
# Step 1: Build the executable
npm run package

# Step 2: Create the app bundle
npm run create-app-bundle

# Step 3: Create the DMG
npm run create-dmg
```

## Build Process Details

### 1. Building the Executable (`npm run package`)

The `build.js` script:
- Downloads required binary dependencies from GitHub releases
- Creates a pkg configuration with optimized memory settings
- Bundles all Node-RED dependencies and assets
- Generates a standalone executable using pkg

**Memory Optimization Settings:**
- `--max-old-space-size=8192`: 8GB heap size
- `--max-semi-space-size=256`: 256MB semi-space
- `--gc-interval=100`: Optimized garbage collection

**Included Dependencies:**
- All Node-RED core modules
- Node-RED editor client (templates, CSS, JS, images)
- Custom neuron modules
- All required npm packages

### 2. Creating the App Bundle (`npm run create-app-bundle`)

The `create-app-bundle.js` script:
- Creates a proper macOS `.app` bundle structure
- Copies the executable to `Contents/MacOS/`
- Generates `Info.plist` with proper metadata
- Sets correct permissions and file structure

### 3. Creating the DMG (`npm run create-dmg`)

The `create-dmg.js` script:
- Uses `appdmg` to create a professional DMG installer
- Includes the app bundle and Applications folder link
- Sets proper window size and positioning
- Creates a branded installer experience

## File Structure

```
build/
├── releases/
│   ├── latest-macos-arm64          # Standalone Apple Silicon executable
│   ├── latest-macos-x64            # Standalone Intel executable
│   ├── neuron-node-builder-macos-arm64-v<version>.app/  # ARM64 app bundle
│   └── neuron-node-builder-macos-x64-v<version>.app/    # x64 app bundle
├── bin/                          # Downloaded binaries
└── config/                       # pkg configuration files

dist/
└── Neuron-Node-Builder.dmg      # Final DMG installer
```

## Troubleshooting

### Common Issues

1. **Node.js Version Error**
   ```
   ❌ Node.js version 20.x is required
   ```
   **Solution:** Use Node.js 20.x (check with `node --version`)

2. **Binary Download Failures**
   ```
   Binary path does not exist
   ```
   **Solution:** Check internet connection and GitHub API access

3. **Memory Errors During Build**
   ```
   Fatal javascript OOM in MemoryChunk allocation failed
   ```
   **Solution:** Ensure sufficient RAM (16GB+ recommended) and use the optimized memory settings

4. **pkg Build Failures**
   ```
   Error building executable: Command failed: pkg
   ```
   **Solution:** Check pkg installation and target compatibility

### Verification Commands

```bash
# Check Node.js version
node --version

# Verify executable
ARCH=arm64  # or x64 for Intel Macs
file build/releases/latest-macos-${ARCH}

# Test executable permissions
ls -la build/releases/latest-macos-${ARCH}

# Check app bundle structure
VERSION=$(node -p "require('./package.json').version")
ls -la build/releases/neuron-node-builder-macos-${ARCH}-v${VERSION}.app/Contents/

# Verify DMG file
file dist/Neuron-Node-Builder.dmg
```

## Testing the Build

### Test the Executable
```bash
cd build/releases
ARCH=arm64  # or x64 for Intel Macs
./latest-macos-${ARCH}
```

**Expected Behavior:**
- Node-RED should start on port 1880
- No memory allocation errors
- All Node-RED features should work correctly

### Test the App Bundle
```bash
# Copy to Applications
VERSION=$(node -p "require('./package.json').version")
ARCH=arm64  # or x64 for Intel Macs
cp -r build/releases/neuron-node-builder-macos-${ARCH}-v${VERSION}.app /Applications/

# Launch from Applications
open /Applications/neuron-node-builder-macos-${ARCH}-v${VERSION}.app
```

### Test the DMG
```bash
# Open the DMG
open dist/Neuron-Node-Builder.dmg

# Install the app bundle
# Drag and drop to Applications folder
```

## Port Configuration

The application is configured to run Node-RED on **port 1880** by default. This is set in the neuron-settings.js file and cannot be changed without rebuilding.

## Memory Management

The build process includes several memory optimizations:

1. **Build-time Memory:** 8GB heap size for the build process
2. **Runtime Memory:** 8GB heap size for the packaged application
3. **Garbage Collection:** Optimized intervals to prevent memory leaks
4. **Asset Bundling:** Efficient inclusion of only necessary files

## Distribution

The generated files are ready for distribution:

- **`latest-macos-arm64`**: Standalone Apple Silicon executable for direct distribution
- **`latest-macos-x64`**: Standalone Intel executable for direct distribution
- **`neuron-node-builder-macos-arm64-v<version>.app`**: Apple Silicon app bundle for installation
- **`neuron-node-builder-macos-x64-v<version>.app`**: Intel app bundle for installation
- **`Neuron-Node-Builder.dmg`**: Professional installer for end users

## Support

For build issues or questions:
1. Check this README for common solutions
2. Verify all prerequisites are met
3. Check the build logs for specific error messages
4. Ensure sufficient system resources (RAM, disk space)
