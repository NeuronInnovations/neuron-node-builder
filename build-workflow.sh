#!/bin/bash

# Comprehensive Build Workflow for Neuron Node Builder
# This script handles the entire process from building to DMG creation

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Neuron Node Builder Build Workflow${NC}"
echo "=================================================="

# Check Node.js version
echo -e "${YELLOW}📋 Checking Node.js version...${NC}"
NODE_VERSION=$(node --version)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1 | tr -d 'v')

if [ "$NODE_MAJOR" != "20" ]; then
    echo -e "${RED}❌ Node.js version 20.x is required. Current version: $NODE_VERSION${NC}"
    echo -e "${YELLOW}Please use Node.js 20.x for building this package.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version check passed: $NODE_VERSION${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

VERSION=$(node -p "require('./package.json').version")
ARCHES=(x64 arm64)

# Clean previous builds
echo -e "${YELLOW}🧹 Cleaning previous builds...${NC}"
rm -rf build/releases/*
rm -rf build/config/*
rm -rf dist/*

# Install dependencies if needed
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

# Step 1: Build the executables
echo -e "${YELLOW}📋 Step 1: Building executables...${NC}"
npm run package

# Verify executables were created
for ARCH in "${ARCHES[@]}"; do
    EXECUTABLE_PATH="build/releases/latest-macos-${ARCH}"
    if [ -f "$EXECUTABLE_PATH" ]; then
        echo -e "${GREEN}✅ macOS ${ARCH} executable created successfully${NC}"
    else
        echo -e "${RED}❌ macOS ${ARCH} executable not found at: $EXECUTABLE_PATH${NC}"
        echo -e "${YELLOW}Build process failed. Please check the logs above.${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ All macOS executables created successfully${NC}"

# Step 2: Create app bundles
echo -e "${YELLOW}📋 Step 2: Creating app bundles...${NC}"
for ARCH in "${ARCHES[@]}"; do
    echo -e "${BLUE}   Creating bundle for ${ARCH}...${NC}"
    npm run create-app-bundle -- --arch=${ARCH} --version=${VERSION}

    APP_PATH="build/releases/neuron-node-builder-macos-${ARCH}-v${VERSION}.app"
    if [ ! -d "$APP_PATH" ]; then
        echo -e "${RED}❌ App bundle not found at: $APP_PATH${NC}"
        echo -e "${YELLOW}App bundle creation failed. Please check the logs above.${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ App bundle created successfully: $(basename "$APP_PATH")${NC}"
done

# Step 3: Create DMG for Intel build by default (optional)
echo -e "${YELLOW}📋 Step 3: Creating DMG (x64)...${NC}"
DEFAULT_ARCH_FOR_DMG=x64
DMG_SOURCE="build/releases/neuron-node-builder-macos-${DEFAULT_ARCH_FOR_DMG}-v${VERSION}.app"
if [ -d "$DMG_SOURCE" ]; then
    if npm run create-dmg >/dev/null 2>&1; then
        DMG_PATH="dist/Neuron-Node-Builder.dmg"
        if [ -f "$DMG_PATH" ]; then
            echo -e "${GREEN}✅ DMG created successfully${NC}"
        else
            echo -e "${YELLOW}⚠️  DMG creation reported success but file was not found${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  DMG creation failed (continuing).${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Skipping DMG creation; source bundle not found for ${DEFAULT_ARCH_FOR_DMG}.${NC}"
fi

# Step 4: Test the executables
echo -e "${YELLOW}📋 Step 4: Testing executables...${NC}"
for ARCH in "${ARCHES[@]}"; do
    EXECUTABLE_PATH="build/releases/latest-macos-${ARCH}"
    echo -e "${BLUE}Testing executable: $EXECUTABLE_PATH${NC}"

    if file "$EXECUTABLE_PATH" | grep -q "Mach-O"; then
        echo -e "${GREEN}✅ Executable is a valid macOS binary${NC}"
    else
        echo -e "${RED}❌ Executable is not a valid macOS binary${NC}"
        exit 1
    fi

    if [ -x "$EXECUTABLE_PATH" ]; then
        echo -e "${GREEN}✅ Executable has proper permissions${NC}"
    else
        echo -e "${YELLOW}⚠️  Executable lacked proper permissions; fixing...${NC}"
        chmod +x "$EXECUTABLE_PATH"
    fi

done

echo ""
echo -e "${GREEN}🎉 Build Workflow Completed Successfully!${NC}"
echo "=================================================="
for ARCH in "${ARCHES[@]}"; do
    echo -e "${BLUE}📁 Executable (${ARCH}): build/releases/latest-macos-${ARCH}${NC}"
    echo -e "${BLUE}📱 App Bundle (${ARCH}): build/releases/neuron-node-builder-macos-${ARCH}-v${VERSION}.app${NC}"
done
if [ -f "dist/Neuron-Node-Builder.dmg" ]; then
    echo -e "${BLUE}💾 DMG File: dist/Neuron-Node-Builder.dmg${NC}"
fi
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Test each executable: ./build/releases/latest-macos-{x64|arm64}"
echo "2. Install the app bundles: cp -r build/releases/neuron-node-builder-macos-{x64|arm64}-v${VERSION}.app /Applications/"
echo "3. (Optional) Test the DMG: open dist/Neuron-Node-Builder.dmg"
echo ""
echo -e "${GREEN}✅ All files are ready for distribution!${NC}"
