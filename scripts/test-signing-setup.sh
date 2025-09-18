#!/bin/bash

# 🧪 macOS Signing Setup Validation Script
# This script validates your local setup before running the GitHub Actions workflow

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 macOS Signing Setup Validation${NC}"
echo "=================================="

# Function to check command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

# Test 1: Check if we're on macOS
echo -e "\n${YELLOW}📋 Test 1: Environment Check${NC}"
if [[ "$OSTYPE" == "darwin"* ]]; then
    print_result 0 "Running on macOS"
else
    print_result 1 "Not running on macOS - some tests will be skipped"
    SKIP_MACOS_TESTS=true
fi

# Test 2: Check required tools
echo -e "\n${YELLOW}📋 Test 2: Required Tools${NC}"

if command_exists node; then
    NODE_VERSION=$(node --version)
    print_result 0 "Node.js installed: $NODE_VERSION"
else
    print_result 1 "Node.js not found"
fi

if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_result 0 "npm installed: $NPM_VERSION"
else
    print_result 1 "npm not found"
fi

if [ "$SKIP_MACOS_TESTS" != "true" ]; then
    if command_exists security; then
        print_result 0 "macOS security command available"
    else
        print_result 1 "macOS security command not found"
    fi

    if command_exists codesign; then
        print_result 0 "codesign command available"
    else
        print_result 1 "codesign command not found"
    fi

    if command_exists xcrun; then
        print_result 0 "xcrun command available"
    else
        print_result 1 "xcrun command not found"
    fi
fi

# Test 3: Check project structure
echo -e "\n${YELLOW}📋 Test 3: Project Structure${NC}"

if [ -f "package.json" ]; then
    print_result 0 "package.json exists"
else
    print_result 1 "package.json not found"
fi

if [ -f "entitlements.plist" ]; then
    print_result 0 "entitlements.plist exists"
else
    print_result 1 "entitlements.plist not found"
fi

if [ -f "create-app-bundle.js" ]; then
    print_result 0 "create-app-bundle.js exists"
else
    print_result 1 "create-app-bundle.js not found"
fi

if [ -f ".github/workflows/build-and-sign-production.yml" ]; then
    print_result 0 "GitHub Actions workflow exists"
else
    print_result 1 "GitHub Actions workflow not found"
fi

# Test 4: Check Developer ID certificate (macOS only)
if [ "$SKIP_MACOS_TESTS" != "true" ]; then
    echo -e "\n${YELLOW}📋 Test 4: Developer ID Certificate${NC}"
    
    CERT_CHECK=$(security find-identity -v -p codesigning | grep "Developer ID Application" | head -1)
    
    if [ -n "$CERT_CHECK" ]; then
        print_result 0 "Developer ID Application certificate found"
        echo -e "${BLUE}   Certificate: ${CERT_CHECK}${NC}"
        
        # Extract certificate name for GitHub secret
        CERT_NAME=$(echo "$CERT_CHECK" | sed 's/.*) [0-9A-F]* "//' | sed 's/"$//')
        echo -e "${YELLOW}   Use this for APPLE_SIGNING_IDENTITY secret: ${CERT_NAME}${NC}"
    else
        print_result 1 "No Developer ID Application certificate found"
        echo -e "${YELLOW}   Please install your Developer ID certificate in Keychain Access${NC}"
    fi
fi

# Test 5: Validate entitlements.plist
echo -e "\n${YELLOW}📋 Test 5: Entitlements Validation${NC}"

if [ -f "entitlements.plist" ]; then
    if plutil -lint entitlements.plist >/dev/null 2>&1; then
        print_result 0 "entitlements.plist is valid XML"
        
        # Check for required entitlements
        if grep -q "com.apple.security.cs.allow-jit" entitlements.plist; then
            print_result 0 "JIT entitlement present"
        else
            print_result 1 "JIT entitlement missing"
        fi
        
        if grep -q "com.apple.security.cs.disable-library-validation" entitlements.plist; then
            print_result 0 "Library validation entitlement present"
        else
            print_result 1 "Library validation entitlement missing"
        fi
        
        if grep -q "com.apple.security.cs.allow-unsigned-executable-memory" entitlements.plist; then
            print_result 0 "Executable memory entitlement present"
        else
            print_result 1 "Executable memory entitlement missing"
        fi
    else
        print_result 1 "entitlements.plist is not valid XML"
    fi
else
    print_result 1 "entitlements.plist not found"
fi

# Test 6: Test build process
echo -e "\n${YELLOW}📋 Test 6: Build Process Test${NC}"

if [ -f "package.json" ] && command_exists npm; then
    echo -e "${BLUE}   Installing dependencies...${NC}"
    if npm install --silent >/dev/null 2>&1; then
        print_result 0 "Dependencies installed successfully"
    else
        print_result 1 "Failed to install dependencies"
    fi
    
    echo -e "${BLUE}   Testing build command...${NC}"
    if npm run build >/dev/null 2>&1; then
        print_result 0 "Build command works"
    else
        print_result 1 "Build command failed"
    fi
    
    echo -e "${BLUE}   Testing package command...${NC}"
    if timeout 300 npm run package >/dev/null 2>&1; then
        print_result 0 "Package command works"
        
        # Check if executables were created
        if [ -f "build/releases/latest-macos-x64" ]; then
            print_result 0 "macOS executable created"
        else
            print_result 1 "macOS executable not found"
        fi
        
        if [ -f "build/releases/latest-win-x64.exe" ]; then
            print_result 0 "Windows executable created"
        else
            print_result 1 "Windows executable not found"
        fi
        
        if [ -f "build/releases/latest-linux-x64" ]; then
            print_result 0 "Linux executable created"
        else
            print_result 1 "Linux executable not found"
        fi
    else
        print_result 1 "Package command failed or timed out"
    fi
else
    echo -e "${YELLOW}   Skipping build test (missing package.json or npm)${NC}"
fi

# Test 7: Test app bundle creation (macOS only)
if [ "$SKIP_MACOS_TESTS" != "true" ] && [ -f "build/releases/latest-macos-x64" ]; then
    echo -e "\n${YELLOW}📋 Test 7: App Bundle Creation${NC}"
    
    echo -e "${BLUE}   Creating app bundle...${NC}"
    if npm run create-app-bundle >/dev/null 2>&1; then
        print_result 0 "App bundle creation succeeded"
        
        # Find the app bundle
        APP_BUNDLE=$(find build/releases -name "*.app" -type d | head -1)
        if [ -n "$APP_BUNDLE" ]; then
            print_result 0 "App bundle found: $(basename "$APP_BUNDLE")"
            
            # Check app bundle structure
            if [ -f "$APP_BUNDLE/Contents/Info.plist" ]; then
                print_result 0 "App bundle structure is valid"
            else
                print_result 1 "App bundle structure is invalid"
            fi
        else
            print_result 1 "App bundle not found after creation"
        fi
    else
        print_result 1 "App bundle creation failed"
    fi
fi

# Test 8: Workflow YAML validation
echo -e "\n${YELLOW}📋 Test 8: Workflow Validation${NC}"

if command_exists npx; then
    if npx js-yaml .github/workflows/build-and-sign-production.yml >/dev/null 2>&1; then
        print_result 0 "Workflow YAML syntax is valid"
    else
        print_result 1 "Workflow YAML syntax is invalid"
    fi
else
    echo -e "${YELLOW}   Skipping YAML validation (npx not available)${NC}"
fi

# Summary
echo -e "\n${BLUE}📊 Test Summary${NC}"
echo "==============="

if [ "$SKIP_MACOS_TESTS" == "true" ]; then
    echo -e "${YELLOW}⚠️  Some tests were skipped (not running on macOS)${NC}"
fi

echo -e "\n${YELLOW}📋 Next Steps:${NC}"
echo "1. Fix any failed tests above"
echo "2. Set up GitHub Secrets (see APPLE_SIGNING_SETUP.md)"
echo "3. Run staging test with workflow dispatch"
echo "4. Follow the complete TESTING_GUIDE.md"

echo -e "\n${GREEN}🎉 Setup validation complete!${NC}"

# Check if we're in a git repository
if git rev-parse --git-dir >/dev/null 2>&1; then
    echo -e "\n${YELLOW}💡 Quick test command:${NC}"
    echo "git tag v1.0.0-test && git push origin v1.0.0-test"
    echo "(This will trigger the GitHub Actions workflow)"
fi
