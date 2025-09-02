#!/bin/bash

# Create macOS App Bundle Script
# This script creates a proper .app bundle from the signed executable

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXECUTABLE_PATH="$SCRIPT_DIR/build/releases/latest-macos-x64"
APP_NAME="Neuron Node Builder"
APP_BUNDLE_NAME="Neuron-Node-builder.app"
APP_IDENTIFIER="com.neuron.node-builder"
APP_VERSION="4.0.9"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🍎 Creating macOS App Bundle${NC}"
echo "================================"

# Step 1: Check if executable exists
if [ ! -f "$EXECUTABLE_PATH" ]; then
    echo -e "${RED}❌ Signed executable not found: $EXECUTABLE_PATH${NC}"
    echo "Please run the signing script first."
    exit 1
fi

echo -e "${GREEN}✅ Found signed executable${NC}"

# Step 2: Create app bundle structure
echo -e "${YELLOW}📁 Creating app bundle structure...${NC}"

APP_BUNDLE_PATH="$SCRIPT_DIR/build/releases/$APP_BUNDLE_NAME"
CONTENTS_DIR="$APP_BUNDLE_PATH/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"

# Remove existing app bundle if it exists
if [ -d "$APP_BUNDLE_PATH" ]; then
    rm -rf "$APP_BUNDLE_PATH"
fi

# Create directory structure
mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR"

echo -e "${GREEN}✅ App bundle structure created${NC}"

# Step 3: Copy executable
echo -e "${YELLOW}📋 Copying executable...${NC}"

cp "$EXECUTABLE_PATH" "$MACOS_DIR/neuron-node-builder"
chmod +x "$MACOS_DIR/neuron-node-builder"

echo -e "${GREEN}✅ Executable copied${NC}"

# Step 4: Create Info.plist
echo -e "${YELLOW}📄 Creating Info.plist...${NC}"

cat > "$CONTENTS_DIR/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>neuron-node-builder</string>
    <key>CFBundleIdentifier</key>
    <string>$APP_IDENTIFIER</string>
    <key>CFBundleName</key>
    <string>$APP_NAME</string>
    <key>CFBundleDisplayName</key>
    <string>$APP_NAME</string>
    <key>CFBundleVersion</key>
    <string>$APP_VERSION</string>
    <key>CFBundleShortVersionString</key>
    <string>$APP_VERSION</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>NRBN</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>LSApplicationCategoryType</key>
    <string>public.app-category.developer-tools</string>
    <key>NSHumanReadableCopyright</key>
    <string>Copyright © 2024 Neuron Innovations Ltd. All rights reserved.</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>LSBackgroundOnly</key>
    <false/>
    <key>LSUIElement</key>
    <false/>
</dict>
</plist>
EOF

echo -e "${GREEN}✅ Info.plist created${NC}"

# Step 5: Create app icon (optional - using a simple icon)
echo -e "${YELLOW}🎨 Creating app icon...${NC}"

# Check if we have an existing icon
ICON_SOURCE="$SCRIPT_DIR/neuron/theme/neuronLogo.png"
if [ -f "$ICON_SOURCE" ]; then
    echo "Found existing logo, converting to app icon..."
    
    # Create iconset directory
    ICONSET_DIR="$RESOURCES_DIR/AppIcon.iconset"
    mkdir -p "$ICONSET_DIR"
    
    # Create different icon sizes (using sips to resize)
    declare -a ICON_SIZES=(
        "16:icon_16x16.png"
        "32:icon_16x16@2x.png"
        "32:icon_32x32.png"
        "64:icon_32x32@2x.png"
        "128:icon_128x128.png"
        "256:icon_128x128@2x.png"
        "256:icon_256x256.png"
        "512:icon_256x256@2x.png"
        "512:icon_512x512.png"
        "1024:icon_512x512@2x.png"
    )
    
    for size_info in "${ICON_SIZES[@]}"; do
        IFS=':' read -r size filename <<< "$size_info"
        sips -z "$size" "$size" "$ICON_SOURCE" --out "$ICONSET_DIR/$filename" >/dev/null 2>&1 || true
    done
    
    # Convert iconset to icns
    if command -v iconutil >/dev/null 2>&1; then
        iconutil -c icns "$ICONSET_DIR" -o "$RESOURCES_DIR/AppIcon.icns"
        rm -rf "$ICONSET_DIR"
        
        # Add icon reference to Info.plist
        /usr/libexec/PlistBuddy -c "Add :CFBundleIconFile string AppIcon" "$CONTENTS_DIR/Info.plist" 2>/dev/null || true
        
        echo -e "${GREEN}✅ App icon created from neuronLogo.png${NC}"
    else
        echo -e "${YELLOW}⚠️  iconutil not found, skipping icon creation${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No logo found at $ICON_SOURCE, skipping icon creation${NC}"
fi

# Step 6: Create launch script (to handle environment and logging)
echo -e "${YELLOW}🚀 Creating launch wrapper...${NC}"

cat > "$RESOURCES_DIR/launch.sh" << 'EOF'
#!/bin/bash

# Launch wrapper for Neuron Node Builder
# This script sets up the environment and launches the main executable

# Get the directory of the app bundle
APP_DIR="$(dirname "$(dirname "$(realpath "$0")")")"
EXECUTABLE="$APP_DIR/MacOS/neuron-node-builder"

# Set up environment
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

# Create log directory in user's home
LOG_DIR="$HOME/.neuron-node-builder/logs"
mkdir -p "$LOG_DIR"

# Launch the executable with logging
echo "$(date): Starting Neuron Node Builder" >> "$LOG_DIR/launch.log"

# Execute the main application
exec "$EXECUTABLE" >> "$LOG_DIR/app.log" 2>&1
EOF

chmod +x "$RESOURCES_DIR/launch.sh"

echo -e "${GREEN}✅ Launch wrapper created${NC}"

# Step 7: Create PkgInfo file
echo -e "${YELLOW}📋 Creating PkgInfo...${NC}"

echo -n "APPLNRBN" > "$CONTENTS_DIR/PkgInfo"

echo -e "${GREEN}✅ PkgInfo created${NC}"

# Step 8: Set proper permissions
echo -e "${YELLOW}🔐 Setting permissions...${NC}"

find "$APP_BUNDLE_PATH" -type f -exec chmod 644 {} \;
find "$APP_BUNDLE_PATH" -type d -exec chmod 755 {} \;
chmod +x "$MACOS_DIR/neuron-node-builder"
chmod +x "$RESOURCES_DIR/launch.sh"

echo -e "${GREEN}✅ Permissions set${NC}"

# Step 9: Validate app bundle
echo -e "${YELLOW}✅ Validating app bundle...${NC}"

if [ -f "$CONTENTS_DIR/Info.plist" ] && [ -f "$MACOS_DIR/neuron-node-builder" ]; then
    echo -e "${GREEN}✅ App bundle validation passed${NC}"
else
    echo -e "${RED}❌ App bundle validation failed${NC}"
    exit 1
fi

# Step 10: Summary
echo -e "${GREEN}🎉 App bundle creation completed!${NC}"
echo "================================================="
echo -e "📁 App Bundle: ${BLUE}$APP_BUNDLE_PATH${NC}"
echo -e "📏 Size: $(du -sh "$APP_BUNDLE_PATH" | cut -f1)"
echo -e "🆔 Bundle ID: ${BLUE}$APP_IDENTIFIER${NC}"
echo -e "📋 Version: ${BLUE}$APP_VERSION${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Test the app: open '$APP_BUNDLE_PATH'"
echo "2. Sign the app bundle: Use the signing script"
echo "3. Notarize: Submit for Apple notarization"
echo "4. Distribute: Share the signed .app bundle"
echo ""
echo -e "${BLUE}The app will:${NC}"
echo "• Start Neuron Node Builder when double-clicked"
echo "• Create logs in ~/.neuron-node-builder/logs/"
echo "• Be installable by dragging to Applications folder"
