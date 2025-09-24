# Quick Testing Checklist

Use this checklist to test the macOS signing workflow step by step.

## Quick Start

### 1. Run Local Validation Script

```bash
./scripts/test-signing-setup.sh
```

**Fix any issues before proceeding.**

### 2. Set Up GitHub Secrets

Go to: **Repository Settings → Secrets and variables → Actions**

Add these 8 secrets (see `APPLE_SIGNING_SETUP.md` for details):

- [ ] `APPLE_CERTIFICATE_BASE64`
- [ ] `APPLE_CERTIFICATE_PASSWORD`
- [ ] `APPLE_SIGNING_IDENTITY`
- [ ] `APPLE_TEAM_ID`
- [ ] `APPLE_API_KEY_ID`
- [ ] `APPLE_API_ISSUER_ID`
- [ ] `APPLE_API_KEY_BASE64`
- [ ] `KEYCHAIN_PASSWORD`

### 3. Test Staging Workflow

**Option A: Manual trigger**

1. Go to **Actions** tab → **"Production Build, Sign & Release"**
2. Click **"Run workflow"**
3. Enter version: `1.0.0-test`
4. Select environment: `staging`
5. Click **"Run workflow"**

**Option B: Test tag**

```bash
git tag v1.0.0-test
git push origin v1.0.0-test
```

### 4. Verify Results

- [ ] All 3 workflow jobs complete successfully
- [ ] GitHub release is created with 6 files:
  - [ ] `neuron-node-builder-macos-arm64-v1.0.0-test.zip`
  - [ ] `neuron-node-builder-macos-arm64-v1.0.0-test.zip.sha256`
  - [ ] `neuron-node-builder-macos-x64-v1.0.0-test.zip`
  - [ ] `neuron-node-builder-macos-x64-v1.0.0-test.zip.sha256`
  - [ ] `neuron-node-builder-win-x64-v1.0.0-test.zip`
  - [ ] `neuron-node-builder-linux-x64-v1.0.0-test.zip`

### 5. Test Downloaded App

```bash
# Download macOS app from the release
# Replace ARCH with arm64 or x64 as needed
ARCH=arm64
unzip neuron-node-builder-macos-${ARCH}-v1.0.0-test.zip
APP_BUNDLE=$(find . -name "*.app" -type d | head -1)

# Verify signature and notarization
codesign --verify --verbose "$APP_BUNDLE"
spctl --assess --verbose "$APP_BUNDLE"

# Should show: "accepted" and "source=Notarized Developer ID"
```

### 6. Production Test

**Only after staging test passes completely:**

```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## Common Issues & Quick Fixes

### "Certificate not found"

```bash
# Find your exact certificate name
security find-identity -v -p codesigning
# Copy the exact text to APPLE_SIGNING_IDENTITY secret
```

### "API authentication failed"

```bash
# Test your API key locally
xcrun notarytool history \
  --key /path/to/AuthKey_KEYID.p8 \
  --key-id YOUR_KEY_ID \
  --issuer YOUR_ISSUER_ID
```

### "Notarization failed"

- Ensure app is signed before notarization
- Check entitlements.plist is valid
- Verify hardened runtime is enabled

### "Build integrity check failed"

- Build process might not be deterministic
- Check if any files are modified between jobs

---

## Need Help?

1. **Check workflow logs** in GitHub Actions
2. **Run local validation** with `./scripts/test-signing-setup.sh`
3. **Review detailed guide** in `TESTING_GUIDE.md`
4. **Check Apple documentation** for certificate/notarization issues

---

## Success Criteria

**Your workflow is working correctly when:**

- Local validation script passes all tests
- GitHub Actions workflow completes without errors
- macOS app downloads and opens without security warnings
- App signature verifies with `codesign --verify`
- Notarization validates with `spctl --assess`
- Users can install and run the app normally

**Once all tests pass, you have a production-ready macOS signing workflow**
