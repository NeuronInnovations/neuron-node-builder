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

# Clean previous builds
echo -e "${YELLOW}🧹 Cleaning previous builds...${NC}"
rm -rf build/releases/*
rm -rf build/config/*
rm -rf dist/*

# Install dependencies if needed
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

# Step 1: Build the executable
echo -e "${YELLOW}📋 Step 1: Building executable...${NC}"
npm run package

# Verify executable was created
EXECUTABLE_PATH="build/releases/latest-macos-x64"
if [ ! -f "$EXECUTABLE_PATH" ]; then
    echo -e "${RED}❌ Executable not found at: $EXECUTABLE_PATH${NC}"
    echo -e "${YELLOW}Build process failed. Please check the logs above.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Executable created successfully${NC}"

# Step 2: Create app bundle
echo -e "${YELLOW}📋 Step 2: Creating app bundle...${NC}"
npm run create-app-bundle

# Verify app bundle was created
APP_PATH="build/releases/Neuron-Node-Builder.app"
if [ ! -d "$APP_PATH" ]; then
    echo -e "${RED}❌ App bundle not found at: $APP_PATH${NC}"
    echo -e "${YELLOW}App bundle creation failed. Please check the logs above.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ App bundle created successfully${NC}"

# Step 3: Create DMG
echo -e "${YELLOW}📋 Step 3: Creating DMG...${NC}"
npm run create-dmg

# Verify DMG was created
DMG_PATH="dist/Neuron-Node-Builder.dmg"
if [ ! -f "$DMG_PATH" ]; then
    echo -e "${RED}❌ DMG not found at: $DMG_PATH${NC}"
    echo -e "${YELLOW}DMG creation failed. Please check the logs above.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ DMG created successfully${NC}"

# Step 4: Test the executable
echo -e "${YELLOW}📋 Step 4: Testing executable...${NC}"
echo -e "${BLUE}Testing executable: $EXECUTABLE_PATH${NC}"

# Check if executable is valid
if file "$EXECUTABLE_PATH" | grep -q "Mach-O"; then
    echo -e "${GREEN}✅ Executable is a valid macOS binary${NC}"
else
    echo -e "${RED}❌ Executable is not a valid macOS binary${NC}"
    exit 1
fi

# Check executable permissions
if [ -x "$EXECUTABLE_PATH" ]; then
    echo -e "${GREEN}✅ Executable has proper permissions${NC}"
else
    echo -e "${RED}❌ Executable lacks proper permissions${NC}"
    chmod +x "$EXECUTABLE_PATH"
    echo -e "${YELLOW}⚠️  Fixed executable permissions${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Build Workflow Completed Successfully!${NC}"
echo "=================================================="
echo -e "${BLUE}📁 Executable: $EXECUTABLE_PATH${NC}"
echo -e "${BLUE}📱 App Bundle: $APP_PATH${NC}"
echo -e "${BLUE}💾 DMG File: $DMG_PATH${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Test the executable: ./$EXECUTABLE_PATH"
echo "2. Install the app bundle: cp -r $APP_PATH /Applications/"
echo "3. Test the DMG: open $DMG_PATH"
echo ""
echo -e "${GREEN}✅ All files are ready for distribution!${NC}"
