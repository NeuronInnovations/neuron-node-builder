#!/bin/bash

# Neuron Node Builder - Code Signing and Notarization Script
# Signs and notarizes the macOS app bundle for distribution

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Read version from package.json
VERSION=$(node -p "require('./package.json').version")
ARCH="x64"
for arg in "$@"; do
    case $arg in
        --arch=*)
            ARCH="${arg#*=}"
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--arch=x64|arm64]"
            exit 0
            ;;
    esac
done

if [ "$ARCH" != "x64" ] && [ "$ARCH" != "arm64" ]; then
    echo "Unsupported architecture: $ARCH (expected x64 or arm64)"
    exit 1
fi

APP_BUNDLE_NAME="neuron-node-builder-macos-${ARCH}-v${VERSION}"
APP_BUNDLE_PATH="$SCRIPT_DIR/build/releases/${APP_BUNDLE_NAME}.app"
P12_FILE="$SCRIPT_DIR/certificate_2_decoded.p12"
P12_PASSWORD="**************************"
BUNDLE_ID="*****************************"

# App Store Connect API credentials
ISSUER_ID="******************************168f"
KEY_ID="**************************389"
API_KEY_FILE="$SCRIPT_DIR/neuron/apple-credentials"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🍎 Neuron Node Builder - Code Signing and Notarization${NC}"
echo "=================================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to extract API key from credentials file
extract_api_key() {
    local temp_key=$(mktemp)
    sed -n '/-----BEGIN PRIVATE KEY-----/,/-----END PRIVATE KEY-----/p' "$API_KEY_FILE" > "$temp_key"
    echo "$temp_key"
}

# Step 1: Validate prerequisites
echo -e "${YELLOW}📋 Step 1: Validating prerequisites...${NC}"

if [ ! -d "$APP_BUNDLE_PATH" ]; then
    echo -e "${RED}❌ App bundle not found: $APP_BUNDLE_PATH${NC}"
    echo "Run 'npm run create-app-bundle -- --arch=${ARCH}' first to build the bundle"
    exit 1
fi

if [ ! -f "$P12_FILE" ]; then
    echo -e "${RED}❌ Certificate file not found: $P12_FILE${NC}"
    exit 1
fi

if [ ! -f "$API_KEY_FILE" ]; then
    echo -e "${RED}❌ API credentials file not found: $API_KEY_FILE${NC}"
    exit 1
fi

# Check if we have codesign (should be available on macOS)
if ! command_exists codesign; then
    echo -e "${RED}❌ codesign not found. This script must run on macOS.${NC}"
    exit 1
fi

# Check if we have xcrun altool or notarytool
if ! command_exists xcrun; then
    echo -e "${RED}❌ xcrun not found. Please install Xcode Command Line Tools.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites validated${NC}"

# Step 2: Check for existing certificate or import if needed
echo -e "${YELLOW}📋 Step 2: Checking for certificate in keychain...${NC}"

# First, check if Developer ID certificate already exists in login keychain
CERT_IDENTITY=$(security find-identity -v -p codesigning login.keychain | grep "Developer ID Application" | head -1 | sed 's/.*) [0-9A-F]* "//' | sed 's/"$//' 2>/dev/null || true)

USE_TEMP_KEYCHAIN=false

if [ -n "$CERT_IDENTITY" ]; then
    echo -e "${GREEN}✅ Found existing certificate in login keychain: $CERT_IDENTITY${NC}"
    # Use login keychain
    KEYCHAIN_TO_USE="login.keychain"
else
    echo -e "${YELLOW}⚠️  No Developer ID certificate found in login keychain. Attempting import...${NC}"
    
    # Decode base64 certificate if needed
    if [ ! -f "$P12_FILE" ]; then
        BASE64_FILE="$SCRIPT_DIR/certificate_2_base64"
        if [ -f "$BASE64_FILE" ]; then
            echo "Decoding base64 certificate..."
            base64 -d "$BASE64_FILE" > "$SCRIPT_DIR/certificate_2_decoded.p12"
            P12_FILE="$SCRIPT_DIR/certificate_2_decoded.p12"
        else
            echo -e "${RED}❌ No certificate file found${NC}"
            exit 1
        fi
    fi

    # Create a temporary keychain
    TEMP_KEYCHAIN="neuron-temp.keychain"
    TEMP_KEYCHAIN_PASSWORD="temp-password-$(date +%s)"
    USE_TEMP_KEYCHAIN=true

    # Delete existing temp keychain if it exists
    security delete-keychain "$TEMP_KEYCHAIN" 2>/dev/null || true

    # Create temporary keychain
    security create-keychain -p "$TEMP_KEYCHAIN_PASSWORD" "$TEMP_KEYCHAIN"
    security set-keychain-settings -lut 21600 "$TEMP_KEYCHAIN"
    security unlock-keychain -p "$TEMP_KEYCHAIN_PASSWORD" "$TEMP_KEYCHAIN"

    # Try to import certificate using OpenSSL extraction method (since it worked before)
    echo "Extracting and importing certificate using OpenSSL method..."
    TEMP_CERT=$(mktemp).crt
    TEMP_KEY=$(mktemp).key
    
    IMPORT_SUCCESS=false
    
    # Extract certificate and key
    if openssl pkcs12 -in "$P12_FILE" -clcerts -nokeys -out "$TEMP_CERT" -passin pass:"$P12_PASSWORD" -passout pass: 2>/dev/null && \
       openssl pkcs12 -in "$P12_FILE" -nocerts -nodes -out "$TEMP_KEY" -passin pass:"$P12_PASSWORD" 2>/dev/null; then
        # Import certificate and key separately
        if security import "$TEMP_CERT" -k "$TEMP_KEYCHAIN" -A 2>/dev/null && \
           security import "$TEMP_KEY" -k "$TEMP_KEYCHAIN" -A 2>/dev/null; then
            echo "✅ Certificate imported using OpenSSL extraction method"
            IMPORT_SUCCESS=true
        fi
    fi
    
    # Clean up temporary files
    rm -f "$TEMP_CERT" "$TEMP_KEY"
    
    if [ "$IMPORT_SUCCESS" = false ]; then
        echo -e "${RED}❌ Failed to import certificate${NC}"
        echo "Please import the certificate manually using Keychain Access and re-run this script."
        security delete-keychain "$TEMP_KEYCHAIN" 2>/dev/null || true
        exit 1
    fi

    # Add to keychain search list
    security list-keychains -d user -s "$TEMP_KEYCHAIN" $(security list-keychains -d user | sed s/\"//g)

    # Get certificate identity from temp keychain
    CERT_IDENTITY=$(security find-identity -v -p codesigning "$TEMP_KEYCHAIN" | grep "Developer ID Application" | head -1 | sed 's/.*) [0-9A-F]* "//' | sed 's/"$//')
    KEYCHAIN_TO_USE="$TEMP_KEYCHAIN"

    if [ -z "$CERT_IDENTITY" ]; then
        echo -e "${RED}❌ Could not find Developer ID Application certificate${NC}"
        security delete-keychain "$TEMP_KEYCHAIN"
        exit 1
    fi

    echo -e "${GREEN}✅ Certificate imported: $CERT_IDENTITY${NC}"
fi

# Step 3: Sign the app bundle
echo -e "${YELLOW}📋 Step 3: Signing the app bundle...${NC}"

# Create signed copy
SIGNED_APP_BUNDLE="$SCRIPT_DIR/build/releases/${APP_BUNDLE_NAME}-signed.app"
cp -R "$APP_BUNDLE_PATH" "$SIGNED_APP_BUNDLE"

# Sign with hardened runtime, timestamp, and entitlements (deep sign for app bundles)
if [ "$USE_TEMP_KEYCHAIN" = true ]; then
    codesign --force \
        --deep \
        --sign "$CERT_IDENTITY" \
        --options runtime \
        --timestamp \
        --identifier "$BUNDLE_ID" \
        --keychain "$KEYCHAIN_TO_USE" \
        --entitlements "$SCRIPT_DIR/entitlements.plist" \
        "$SIGNED_APP_BUNDLE"
else
    codesign --force \
        --deep \
        --sign "$CERT_IDENTITY" \
        --options runtime \
        --timestamp \
        --identifier "$BUNDLE_ID" \
        --entitlements "$SCRIPT_DIR/entitlements.plist" \
        "$SIGNED_APP_BUNDLE"
fi

# Verify signature
if codesign --verify --verbose "$SIGNED_APP_BUNDLE"; then
    echo -e "${GREEN}✅ App bundle signed successfully${NC}"
else
    echo -e "${RED}❌ Signature verification failed${NC}"
    security delete-keychain "$TEMP_KEYCHAIN"
    exit 1
fi

# Step 4: Create ZIP for notarization
echo -e "${YELLOW}📋 Step 4: Creating ZIP archive for notarization...${NC}"

ZIP_FILE="$SCRIPT_DIR/build/releases/${APP_BUNDLE_NAME}-app.zip"
cd "$(dirname "$SIGNED_APP_BUNDLE")"
zip -r "${APP_BUNDLE_NAME}-app.zip" "$(basename "$SIGNED_APP_BUNDLE")"
mv "${APP_BUNDLE_NAME}-app.zip" "$ZIP_FILE"

echo -e "${GREEN}✅ ZIP archive created: $ZIP_FILE${NC}"

# Step 5: Create App Store Connect API key file
echo -e "${YELLOW}📋 Step 5: Preparing App Store Connect API...${NC}"

API_KEY_P8_FILE=$(extract_api_key)
chmod 600 "$API_KEY_P8_FILE"

echo -e "${GREEN}✅ API key prepared${NC}"

# Step 6: Submit for notarization
echo -e "${YELLOW}📋 Step 6: Submitting for notarization...${NC}"

# Try notarytool first (newer method, requires Xcode 13+)
if xcrun notarytool submit --help >/dev/null 2>&1; then
    echo "Using notarytool (recommended)..."
    
    SUBMIT_OUTPUT=$(xcrun notarytool submit "$ZIP_FILE" \
        --issuer "$ISSUER_ID" \
        --key-id "$KEY_ID" \
        --key "$API_KEY_P8_FILE" \
        --wait \
        --timeout 1800)
    
    echo "$SUBMIT_OUTPUT"
    
    if echo "$SUBMIT_OUTPUT" | grep -q "status: Accepted"; then
        echo -e "${GREEN}✅ Notarization successful!${NC}"
        NOTARIZATION_SUCCESS=true
    else
        echo -e "${RED}❌ Notarization failed${NC}"
        NOTARIZATION_SUCCESS=false
    fi
    
else
    # Fallback to altool (legacy method)
    echo "Using altool (legacy method)..."
    
    SUBMIT_OUTPUT=$(xcrun altool --notarize-app \
        --primary-bundle-id "$BUNDLE_ID" \
        --apiKey "$KEY_ID" \
        --apiIssuer "$ISSUER_ID" \
        --file "$ZIP_FILE" \
        --asc-provider "$ISSUER_ID")
    
    echo "$SUBMIT_OUTPUT"
    
    if echo "$SUBMIT_OUTPUT" | grep -q "RequestUUID"; then
        REQUEST_UUID=$(echo "$SUBMIT_OUTPUT" | grep "RequestUUID" | awk '{print $3}')
        echo -e "${BLUE}Notarization submitted. UUID: $REQUEST_UUID${NC}"
        echo "You can check status with:"
        echo "xcrun altool --notarization-info $REQUEST_UUID --apiKey $KEY_ID --apiIssuer $ISSUER_ID"
        NOTARIZATION_SUCCESS=true
    else
        echo -e "${RED}❌ Notarization submission failed${NC}"
        NOTARIZATION_SUCCESS=false
    fi
fi

# Step 7: Staple notarization (if successful)
if [ "$NOTARIZATION_SUCCESS" = true ]; then
    echo -e "${YELLOW}📋 Step 7: Stapling notarization...${NC}"
    
    if xcrun stapler staple "$SIGNED_APP_BUNDLE"; then
        echo -e "${GREEN}✅ Notarization stapled successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not staple notarization (app bundle still valid)${NC}"
    fi
fi

# Step 8: Cleanup
echo -e "${YELLOW}📋 Step 8: Cleaning up...${NC}"

# Remove temporary keychain if it was created
if [ "$USE_TEMP_KEYCHAIN" = true ]; then
    security delete-keychain "$TEMP_KEYCHAIN"
fi

# Remove temporary API key file
rm -f "$API_KEY_P8_FILE"

echo -e "${GREEN}✅ Cleanup completed${NC}"

# Step 9: Final verification
echo -e "${YELLOW}📋 Step 9: Final verification...${NC}"

echo "Signature verification:"
codesign --verify --verbose "$SIGNED_APP_BUNDLE"

echo -e "\nNotarization status:"
spctl --assess --verbose "$SIGNED_APP_BUNDLE"

echo -e "\n${GREEN}🎉 Code signing and notarization process completed!${NC}"
echo "=================================================="
echo -e "📁 Signed app bundle: ${BLUE}$SIGNED_APP_BUNDLE${NC}"
echo -e "📦 Notarized archive: ${BLUE}$ZIP_FILE${NC}"

if [ "$NOTARIZATION_SUCCESS" = true ]; then
    echo -e "\n${GREEN}✅ Your app bundle is now signed and notarized!${NC}"
    echo "Users can double-click it without security warnings."
else
    echo -e "\n${YELLOW}⚠️  Your app bundle is signed but notarization had issues.${NC}"
    echo "It will still work but may show security warnings on first run."
fi

echo -e "\n💡 To distribute: Share the ${BLUE}${APP_BUNDLE_NAME}-signed.app${NC} file"
