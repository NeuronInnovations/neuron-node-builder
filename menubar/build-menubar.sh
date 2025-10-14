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

print_usage() {
    cat <<USAGE
Usage: $(basename "$0") [--arch=x64|arm64|universal]

Environment variables:
  ARCH   Target architecture (defaults to host architecture on Intel runners).
USAGE
}

ARCH_INPUT="${ARCH:-}"

while [ "$#" -gt 0 ]; do
    case "$1" in
        --arch=*)
            ARCH_INPUT="${1#*=}"
            ;;
        --help|-h)
            print_usage
            exit 0
            ;;
        *)
            echo -e "${YELLOW}⚠️  Ignoring unknown argument: $1${NC}"
            ;;
    esac
    shift
done

if [ -z "$ARCH_INPUT" ]; then
    ARCH_INPUT="x86_64"
fi

case "$ARCH_INPUT" in
    x64|amd64|x86_64)
        BUILD_MODE="x86_64"
        TARGET_TRIPLE="x86_64-apple-macos11"
        ;;
    arm64|aarch64)
        BUILD_MODE="arm64"
        TARGET_TRIPLE="arm64-apple-macos11"
        ;;
    universal|fat)
        BUILD_MODE="universal"
        TARGET_TRIPLE=""
        ;;
    *)
        echo -e "${RED}❌ Unsupported architecture: $ARCH_INPUT${NC}"
        echo "    Supported values: x64, arm64, universal"
        exit 1
        ;;
 esac

if ! command -v xcrun >/dev/null 2>&1; then
    echo -e "${RED}❌ xcrun not found. Xcode Command Line Tools are required.${NC}"
    exit 1
fi

SDK_PATH=$(xcrun --sdk macosx --show-sdk-path 2>/dev/null || true)
if [ -z "$SDK_PATH" ]; then
    echo -e "${RED}❌ Unable to determine macOS SDK path via xcrun.${NC}"
    exit 1
fi

SWIFTC=(xcrun --sdk macosx swiftc)

HOST_ARCH=$(uname -m)
case "$HOST_ARCH" in
    x86_64|amd64)
        NORMALIZED_HOST_ARCH="x86_64"
        ;;
    arm64|aarch64)
        NORMALIZED_HOST_ARCH="arm64"
        ;;
    *)
        NORMALIZED_HOST_ARCH="$HOST_ARCH"
        ;;
esac

compile_binary() {
    local target="$1"
    local output="$2"
    local use_target_flag="$3"

    local args=()
    if [ "$use_target_flag" = "1" ] && [ -n "$target" ]; then
        args+=("-target" "$target" "-sdk" "$SDK_PATH")
    fi

    env HOME="$SWIFT_HOME_DIR" "${SWIFTC[@]}" \
        "${args[@]}" \
        -o "$output" \
        -framework Cocoa \
        -framework AppKit \
        "$SCRIPT_DIR/MenuBarApp.swift"
}

echo -e "${BLUE}🍎 Building Neuron Node Builder Menu Bar App (${BUILD_MODE})${NC}"
echo "============================================="

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/build"
APP_NAME="NeuronNodeBuilderMenuBar"

# Clean previous build
echo -e "${YELLOW}🧹 Cleaning previous build...${NC}"
rm -rf "$BUILD_DIR"

# Create build directory
mkdir -p "$BUILD_DIR"

MODULE_CACHE_DIR="$BUILD_DIR/module-cache"
mkdir -p "$MODULE_CACHE_DIR"
export SWIFT_MODULE_CACHE_PATH="$MODULE_CACHE_DIR"
export CLANG_MODULE_CACHE_PATH="$MODULE_CACHE_DIR"
export LLVM_MODULE_CACHE_PATH="$MODULE_CACHE_DIR"

SWIFT_HOME_DIR="$BUILD_DIR/swift-home"
mkdir -p "$SWIFT_HOME_DIR/.cache/clang/ModuleCache"

BINARY_PATH="$BUILD_DIR/$APP_NAME"

if [ "$BUILD_MODE" = "universal" ]; then
    echo -e "${YELLOW}🔨 Compiling universal binary...${NC}"
    X86_OUT="$BUILD_DIR/${APP_NAME}-x86_64"
    ARM_OUT="$BUILD_DIR/${APP_NAME}-arm64"

    compile_binary "x86_64-apple-macos11" "$X86_OUT" 1
    compile_binary "arm64-apple-macos11" "$ARM_OUT" 1

    lipo -create -output "$BINARY_PATH" "$X86_OUT" "$ARM_OUT"
    rm -f "$X86_OUT" "$ARM_OUT"
else
    NEED_TARGET_FLAG="0"
    if [ "$BUILD_MODE" = "x86_64" ] && [ "$NORMALIZED_HOST_ARCH" != "x86_64" ]; then
        NEED_TARGET_FLAG="1"
    elif [ "$BUILD_MODE" = "arm64" ] && [ "$NORMALIZED_HOST_ARCH" != "arm64" ]; then
        NEED_TARGET_FLAG="1"
    fi

    echo -e "${YELLOW}🔨 Compiling Swift code for ${BUILD_MODE}...${NC}"
    compile_binary "$TARGET_TRIPLE" "$BINARY_PATH" "$NEED_TARGET_FLAG"
fi

echo -e "${GREEN}✅ Swift compilation successful${NC}"

if command -v file >/dev/null 2>&1; then
    echo -e "${YELLOW}🧾 Binary info:${NC}"
    file "$BINARY_PATH"
fi

# Create app bundle structure
APP_BUNDLE="$BUILD_DIR/${APP_NAME}.app"
CONTENTS_DIR="$APP_BUNDLE/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"

mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR"

# Copy executable
cp "$BINARY_PATH" "$MACOS_DIR/"

# Copy Info.plist
cp "$SCRIPT_DIR/Info.plist" "$CONTENTS_DIR/"

# Create PkgInfo
echo "APPL????" > "$CONTENTS_DIR/PkgInfo"

# Make executable
chmod +x "$MACOS_DIR/$APP_NAME"

echo -e "${GREEN}✅ Menu bar app bundle created: $APP_BUNDLE${NC}"

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
