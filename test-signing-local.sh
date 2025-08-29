#!/bin/bash

# Local test script to debug code signing issues
# This mirrors the GitHub Actions workflow exactly

set -e

echo "=== Local Code Signing Test ==="

# Create test directory
mkdir -p /tmp/test-sign
cd /tmp/test-sign

# Download rcodesign (same version as GitHub Actions)
echo "Downloading rcodesign..."
curl -L -o /tmp/rcodesign.tar.gz "https://github.com/indygreg/apple-platform-rs/releases/download/apple-codesign%2F0.28.0/apple-codesign-0.28.0-macos-universal.tar.gz"
tar -xzf /tmp/rcodesign.tar.gz -C /tmp
chmod +x /tmp/apple-codesign-0.28.0-macos-universal/rcodesign

# Test with your actual p12 file
echo "Testing with your p12 file..."

# Replace these with your actual values
P12_FILE="path/to/your/certificate.p12"
P12_PASSWORD="your_actual_password"

# Test 1: Check if p12 file exists
if [ ! -f "$P12_FILE" ]; then
    echo "❌ P12 file not found: $P12_FILE"
    echo "Please update P12_FILE variable in this script"
    exit 1
fi

# Test 2: Validate p12 with openssl (same as GitHub Actions)
echo "Testing p12 file validity with openssl..."
if openssl pkcs12 -info -in "$P12_FILE" -noout -passin pass:"$P12_PASSWORD" 2>/dev/null; then
    echo "✅ P12 file is valid and password is correct (openssl)"
else
    echo "❌ P12 file is invalid or password is incorrect (openssl)"
    exit 1
fi

# Test 3: Try rcodesign with the same p12
echo "Testing with rcodesign..."
echo "P12 file: $P12_FILE"
echo "Password: $P12_PASSWORD"

# Create a test file to sign (or use your actual executable)
echo "Creating test file..."
echo "#!/bin/bash\necho 'Hello World'" > test-executable
chmod +x test-executable

# Try signing with rcodesign
echo "Attempting to sign with rcodesign..."
/tmp/apple-codesign-0.28.0-macos-universal/rcodesign sign \
    --p12-file "$P12_FILE" \
    --p12-password "$P12_PASSWORD" \
    test-executable test-executable-signed

echo "✅ Signing successful!"

# Clean up
rm -f test-executable test-executable-signed
rm -rf /tmp/apple-codesign-0.28.0-macos-universal
rm -f /tmp/rcodesign.tar.gz

echo "=== Test completed ==="
