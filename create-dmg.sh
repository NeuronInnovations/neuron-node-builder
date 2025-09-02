#!/bin/bash

# Neuron Node Builder - DMG Creation Script
# Creates a DMG file from the app bundle for distribution

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXECUTABLE_PATH="$SCRIPT_DIR/build/releases/latest-macos-x64"
APP_PATH="$SCRIPT_DIR/build/releases/Neuron-Node-builder.app"
DMG_NAME="Neuron-Node-Builder"
DMG_PATH="$SCRIPT_DIR/build/releases/${DMG_NAME}.dmg"
TEMP_DMG_PATH="$SCRIPT_DIR/build/releases/${DMG_NAME}-temp.dmg"
VOLUME_NAME="NeuronNodeBuilder"
VOLUME_ICON="$SCRIPT_DIR/neuron/theme/neuronLogo.png"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Neuron Node Builder - DMG Creation${NC}"
echo "=========================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Step 1: Validate prerequisites
echo -e "${YELLOW}📋 Step 1: Validating prerequisites...${NC}"

if [ ! -f "$EXECUTABLE_PATH" ]; then
    echo -e "${RED}❌ Executable not found: $EXECUTABLE_PATH${NC}"
    echo "Run 'npm run package' first to build the executable"
    exit 1
fi

# Step 1a: Create app bundle if it doesn't exist
if [ ! -d "$APP_PATH" ]; then
    echo -e "${YELLOW}📋 Step 1a: Creating app bundle from executable...${NC}"
    
    # Create app bundle structure
    mkdir -p "$APP_PATH/Contents/MacOS"
    mkdir -p "$APP_PATH/Contents/Resources"
    
    # Copy the executable
    cp "$EXECUTABLE_PATH" "$APP_PATH/Contents/MacOS/neuron-node-builder"
    chmod +x "$APP_PATH/Contents/MacOS/neuron-node-builder"
    
    # Create the Info.plist file
    cat > "$APP_PATH/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>neuron-node-builder</string>
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

    # Create PkgInfo file
    echo "APPL????" > "$APP_PATH/Contents/PkgInfo"
    
    # Copy app icon if available
    if [ -f "$VOLUME_ICON" ]; then
        cp "$VOLUME_ICON" "$APP_PATH/Contents/Resources/AppIcon.icns" 2>/dev/null || true
    fi
    
    # Create a launch script to handle the executable properly
    cat > "$APP_PATH/Contents/Resources/launch.sh" << 'EOF'
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXECUTABLE="$SCRIPT_DIR/../MacOS/neuron-node-builder"
exec "$EXECUTABLE" "$@"
EOF
    chmod +x "$APP_PATH/Contents/Resources/launch.sh"
    
    echo -e "${GREEN}✅ App bundle created at: $APP_PATH${NC}"
    
    # Sign the app bundle if certificate is available
    CERT_IDENTITY=$(security find-identity -v -p codesigning login.keychain | grep "Developer ID Application" | head -1 | sed 's/.*) [0-9A-F]* "//' | sed 's/"$//' 2>/dev/null || true)
    
    if [ -n "$CERT_IDENTITY" ]; then
        echo -e "${YELLOW}📋 Step 1b: Signing the app bundle...${NC}"
        codesign --force \
            --deep \
            --sign "$CERT_IDENTITY" \
            --options runtime \
            --timestamp \
            --identifier "com.neuron.node-builder" \
            "$APP_PATH"
        
        if codesign --verify --verbose "$APP_PATH"; then
            echo -e "${GREEN}✅ App bundle signed successfully${NC}"
        else
            echo -e "${YELLOW}⚠️  App bundle signing failed, continuing unsigned${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  No Developer ID certificate found, app bundle will be unsigned${NC}"
    fi
fi

# Check if we have hdiutil (should be available on macOS)
if ! command_exists hdiutil; then
    echo -e "${RED}❌ hdiutil not found. This script must run on macOS.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites validated${NC}"

# Step 2: Clean up any existing DMG files
echo -e "${YELLOW}📋 Step 2: Cleaning up existing DMG files...${NC}"

if [ -f "$DMG_PATH" ]; then
    rm -f "$DMG_PATH"
    echo "Removed existing DMG: $DMG_PATH"
fi

if [ -f "$TEMP_DMG_PATH" ]; then
    rm -f "$TEMP_DMG_PATH"
    echo "Removed existing temp DMG: $TEMP_DMG_PATH"
fi

echo -e "${GREEN}✅ Cleanup completed${NC}"

# Step 3: Calculate app bundle size
echo -e "${YELLOW}📋 Step 3: Calculating DMG size...${NC}"

APP_SIZE=$(du -sm "$APP_PATH" | cut -f1)
# Add some extra space (50MB buffer)
DMG_SIZE=$((APP_SIZE + 50))

echo "App bundle size: ${APP_SIZE}MB"
echo "DMG size (with buffer): ${DMG_SIZE}MB"

# Step 4: Create temporary DMG
echo -e "${YELLOW}📋 Step 4: Creating temporary DMG...${NC}"

hdiutil create -srcfolder "$APP_PATH" -volname "$VOLUME_NAME" -fs HFS+ \
    -fsargs "-c c=64,a=16,e=16" -format UDRW -size ${DMG_SIZE}m "$TEMP_DMG_PATH"

echo -e "${GREEN}✅ Temporary DMG created${NC}"

# Step 5: Mount the DMG for customization
echo -e "${YELLOW}📋 Step 5: Mounting DMG for customization...${NC}"

# Mount the DMG and capture the output
MOUNT_OUTPUT=$(hdiutil attach -readwrite -noverify -noautoopen "$TEMP_DMG_PATH" 2>&1)
echo "$MOUNT_OUTPUT"

# Extract the actual mount point from the output (handle potential numbering)
MOUNT_DIR=$(echo "$MOUNT_OUTPUT" | grep "Apple_HFS" | awk '{for(i=3;i<=NF;i++) printf "%s ", $i; print ""}' | sed 's/[[:space:]]*$//')

if [ -z "$MOUNT_DIR" ]; then
    echo -e "${RED}❌ Failed to extract mount directory${NC}"
    exit 1
fi

echo "DMG mounted at: $MOUNT_DIR"

# Step 6: Customize DMG contents
echo -e "${YELLOW}📋 Step 6: Customizing DMG contents...${NC}"

# Create Applications folder symlink (remove if exists)
rm -f "$MOUNT_DIR/Applications" 2>/dev/null || true
ln -s /Applications "$MOUNT_DIR/Applications"

# Set custom icon if available
if [ -f "$VOLUME_ICON" ]; then
    # Convert PNG to ICNS if needed
    TEMP_ICNS=$(mktemp).icns
    if command_exists iconutil; then
        # Create iconset
        TEMP_ICONSET=$(mktemp -d).iconset
        sips -z 16 16 "$VOLUME_ICON" --out "$TEMP_ICONSET/icon_16x16.png" >/dev/null 2>&1
        sips -z 32 32 "$VOLUME_ICON" --out "$TEMP_ICONSET/icon_16x16@2x.png" >/dev/null 2>&1
        sips -z 32 32 "$VOLUME_ICON" --out "$TEMP_ICONSET/icon_32x32.png" >/dev/null 2>&1
        sips -z 64 64 "$VOLUME_ICON" --out "$TEMP_ICONSET/icon_32x32@2x.png" >/dev/null 2>&1
        sips -z 128 128 "$VOLUME_ICON" --out "$TEMP_ICONSET/icon_128x128.png" >/dev/null 2>&1
        sips -z 256 256 "$VOLUME_ICON" --out "$TEMP_ICONSET/icon_128x128@2x.png" >/dev/null 2>&1
        sips -z 256 256 "$VOLUME_ICON" --out "$TEMP_ICONSET/icon_256x256.png" >/dev/null 2>&1
        sips -z 512 512 "$VOLUME_ICON" --out "$TEMP_ICONSET/icon_256x256@2x.png" >/dev/null 2>&1
        sips -z 512 512 "$VOLUME_ICON" --out "$TEMP_ICONSET/icon_512x512.png" >/dev/null 2>&1
        sips -z 1024 1024 "$VOLUME_ICON" --out "$TEMP_ICONSET/icon_512x512@2x.png" >/dev/null 2>&1
        
        iconutil -c icns "$TEMP_ICONSET" -o "$TEMP_ICNS" >/dev/null 2>&1
        
        # Set volume icon
        cp "$TEMP_ICNS" "$MOUNT_DIR/.VolumeIcon.icns"
        SetFile -c icnC "$MOUNT_DIR/.VolumeIcon.icns" 2>/dev/null || true
        SetFile -a C "$MOUNT_DIR" 2>/dev/null || true
        
        # Cleanup
        rm -rf "$TEMP_ICONSET" "$TEMP_ICNS"
        
        echo "✅ Custom volume icon set"
    fi
fi

# Set window properties using AppleScript
osascript << EOF
tell application "Finder"
    tell disk "$VOLUME_NAME"
        open
        set current view of container window to icon view
        set toolbar visible of container window to false
        set statusbar visible of container window to false
        set the bounds of container window to {100, 100, 600, 400}
        set viewOptions to the icon view options of container window
        set arrangement of viewOptions to not arranged
        set icon size of viewOptions to 128
        set position of item "Neuron-Node-builder.app" of container window to {150, 150}
        set position of item "Applications" of container window to {350, 150}
        close
        open
        update without registering applications
        delay 2
    end tell
end tell
EOF

echo -e "${GREEN}✅ DMG customization completed${NC}"

# Step 7: Unmount the DMG
echo -e "${YELLOW}📋 Step 7: Unmounting DMG...${NC}"

hdiutil detach "$MOUNT_DIR"
sync

echo -e "${GREEN}✅ DMG unmounted${NC}"

# Step 8: Convert to final compressed DMG
echo -e "${YELLOW}📋 Step 8: Creating final compressed DMG...${NC}"

hdiutil convert "$TEMP_DMG_PATH" -format UDZO -imagekey zlib-level=9 -o "$DMG_PATH"

# Clean up temp DMG
rm -f "$TEMP_DMG_PATH"

echo -e "${GREEN}✅ Final DMG created${NC}"

# Step 9: Verification
echo -e "${YELLOW}📋 Step 9: Verifying DMG...${NC}"

if [ -f "$DMG_PATH" ]; then
    DMG_FILE_SIZE=$(du -h "$DMG_PATH" | cut -f1)
    echo "DMG file: $DMG_PATH"
    echo "DMG size: $DMG_FILE_SIZE"
    
    # Test mount
    TEST_MOUNT=$(hdiutil attach -nobrowse -readonly "$DMG_PATH" | grep -E '^/dev/' | sed 1q | awk '{print $2}')
    if [ -n "$TEST_MOUNT" ]; then
        echo "✅ DMG verification successful"
        hdiutil detach "$TEST_MOUNT"
    else
        echo -e "${RED}❌ DMG verification failed${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ DMG creation failed${NC}"
    exit 1
fi

echo -e "\n${GREEN}🎉 DMG creation completed successfully!${NC}"
echo "=========================================="
echo -e "📁 DMG file: ${BLUE}$DMG_PATH${NC}"
echo -e "📦 File size: ${BLUE}$DMG_FILE_SIZE${NC}"
echo -e "\n💡 Next steps:"
echo "1. Run ./sign-and-notarize-dmg.sh to sign and notarize the DMG"
echo "2. Distribute the signed DMG to users"
