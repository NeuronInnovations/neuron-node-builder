#!/bin/bash

# Build script for Neuron Node Builder Menu Bar App
# This creates a native macOS menu bar application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🍎 Building Neuron Node Builder Menu Bar App${NC}"
echo "============================================="

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/build"
APP_NAME="NeuronNodeBuilderMenuBar"

# Clean previous build
if [ -d "$BUILD_DIR" ]; then
    echo -e "${YELLOW}🧹 Cleaning previous build...${NC}"
    rm -rf "$BUILD_DIR"
fi

# Create build directory
mkdir -p "$BUILD_DIR"

echo -e "${YELLOW}🔨 Compiling Swift code...${NC}"

# Compile the Swift application
swiftc -o "$BUILD_DIR/$APP_NAME" \
    -framework Cocoa \
    -framework AppKit \
    "$SCRIPT_DIR/MenuBarApp.swift"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Swift compilation successful${NC}"
else
    echo -e "${RED}❌ Swift compilation failed${NC}"
    exit 1
fi

# Create app bundle structure
APP_BUNDLE="$BUILD_DIR/${APP_NAME}.app"
CONTENTS_DIR="$APP_BUNDLE/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"

mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR"

# Copy executable
cp "$BUILD_DIR/$APP_NAME" "$MACOS_DIR/"

# Copy Info.plist
cp "$SCRIPT_DIR/Info.plist" "$CONTENTS_DIR/"

# Create PkgInfo
echo "APPL????" > "$CONTENTS_DIR/PkgInfo"

# Make executable
chmod +x "$MACOS_DIR/$APP_NAME"

echo -e "${GREEN}✅ Menu bar app bundle created: $APP_BUNDLE${NC}"

# Test the app bundle
echo -e "${YELLOW}🧪 Testing app bundle structure...${NC}"
if [ -f "$MACOS_DIR/$APP_NAME" ] && [ -f "$CONTENTS_DIR/Info.plist" ]; then
    echo -e "${GREEN}✅ App bundle structure is correct${NC}"
else
    echo -e "${RED}❌ App bundle structure is incorrect${NC}"
    exit 1
fi

echo -e "\n${GREEN}🎉 Menu bar app build completed successfully!${NC}"
echo "============================================="
echo -e "📁 App bundle: ${BLUE}$APP_BUNDLE${NC}"
echo -e "\n💡 Next steps:"
echo -e "   1. Copy this app bundle to your main app bundle"
echo -e "   2. Update create-app-bundle.js to include the menu bar app"
echo -e "   3. Test the integrated solution"
