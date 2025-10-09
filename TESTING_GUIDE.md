# Complete Testing Guide for macOS Signing Workflow

This guide provides a **step-by-step testing strategy** to validate the entire macOS signing and publishing workflow safely before production use.

## Testing Phases Overview

1. **Prerequisites Check** (10 min) - Validate all requirements
2. **Local Certificate Testing** (15 min) - Test signing locally first
3. **Staging Workflow Test** (30 min) - Test GitHub Actions in staging
4. **Production Validation** (10 min) - Final production test
5. **User Acceptance Testing** (15 min) - End-to-end validation

---

## Phase 1: Prerequisites Validation

### 1.1 Verify Apple Developer Setup

```bash
# Check if you have valid Developer ID certificate
security find-identity -v -p codesigning

# Should show something like:
# 1) ABC123DEF "Developer ID Application: Your Name (TEAMID123)"
```

**Expected Output:**

- You should see a "Developer ID Application" certificate
- Note the exact text for `APPLE_SIGNING_IDENTITY` secret

### 1.2 Test App Store Connect API

```bash
# Test your API key (replace with your actual values)
xcrun notarytool history \
  --key /path/to/AuthKey_KEYID.p8 \
  --key-id YOUR_KEY_ID \
  --issuer YOUR_ISSUER_ID \
  --limit 5

# Should return recent notarization history without errors
```

**Expected Output:**

- List of recent submissions (may be empty if first time)
- No authentication errors

### 1.3 Validate GitHub Repository Setup

```bash
# Check if workflow file exists
ls -la .github/workflows/build-and-sign-production.yml

# Validate YAML syntax
npx js-yaml .github/workflows/build-and-sign-production.yml > /dev/null && echo "✅ YAML valid" || echo "❌ YAML invalid"
```

---

## Phase 2: Local Certificate Testing

### 2.1 Build and Sign Locally

```bash
# Build the project locally first
npm install
npm run build
npm run package

# Verify executables were created
ls -la build/releases/
```

### 2.2 Test App Bundle Creation

```bash
# Create app bundle locally
npm run create-app-bundle

# Find the created app bundle
find build/releases -name "*.app" -type d
```

### 2.3 Test Local Code Signing

```bash
# Find your app bundle
APP_BUNDLE=$(find build/releases -name "*.app" -type d | head -1)

# Test code signing locally
codesign --force --deep \
  --sign "Developer ID Application: YOUR_EXACT_CERT_NAME" \
  --options runtime \
  --timestamp \
  --entitlements entitlements.plist \
  "$APP_BUNDLE"

# Verify signature
codesign --verify --verbose "$APP_BUNDLE"
spctl --assess --verbose "$APP_BUNDLE"
```

**Expected Output:**

```
$APP_BUNDLE: valid on disk
$APP_BUNDLE: accepted
source=Developer ID
```

### 2.4 Test Local Notarization

```bash
# Create ZIP for notarization
cd build/releases
APP_NAME=$(basename "$APP_BUNDLE")
ZIP_NAME="${APP_NAME%.app}-test.zip"
/usr/bin/ditto -c -k --keepParent "$APP_NAME" "$ZIP_NAME"

# Submit for notarization (test only)
xcrun notarytool submit "$ZIP_NAME" \
  --key /path/to/AuthKey_KEYID.p8 \
  --key-id YOUR_KEY_ID \
  --issuer YOUR_ISSUER_ID \
  --wait

# If successful, staple the ticket
xcrun stapler staple "$APP_BUNDLE"
```

**Success Criteria for Phase 2:**

- App bundle signs without errors
- Signature verification passes
- Notarization completes successfully
- Stapling works without warnings

---

## Phase 3: Staging Workflow Testing

### 3.1 Setup GitHub Secrets

First, add all required secrets to your repository:

**Go to:** Repository → Settings → Secrets and variables → Actions

**Add these secrets:**

```bash
# Generate base64 values locally
APPLE_CERTIFICATE_BASE64=$(base64 -i /path/to/certificate.p12)
APPLE_API_KEY_BASE64=$(base64 -i /path/to/AuthKey_KEYID.p8)

# Use these values in GitHub Secrets:
APPLE_CERTIFICATE_BASE64=<base64-certificate>
APPLE_CERTIFICATE_PASSWORD=<your-p12-password>
APPLE_SIGNING_IDENTITY=<exact-cert-name-from-keychain>
APPLE_TEAM_ID=<your-team-id>
APPLE_API_KEY_ID=<your-key-id>
APPLE_API_ISSUER_ID=<your-issuer-id>
APPLE_API_KEY_BASE64=<base64-api-key>
KEYCHAIN_PASSWORD=<random-secure-password>
```

### 3.2 Test Staging Workflow

**Option A: Manual Workflow Dispatch**

1. Go to **Actions** tab in your repository
2. Click **"Production Build, Sign & Release"** workflow
3. Click **"Run workflow"**
4. Fill in:
   - **Version**: `1.0.0-test`
   - **Environment**: `staging`
5. Click **"Run workflow"**

**Option B: Test Tag (Recommended)**

```bash
# Create a test tag
git tag v1.0.0-test
git push origin v1.0.0-test

# This will trigger the full workflow
```

### 3.3 Monitor Workflow Execution

**Watch the workflow progress:**

1. **Job 1: Security & Build** (~5-8 minutes)

   - Security validation passes
   - All executables built successfully
   - Build integrity hash generated

2. **Job 2: macOS Sign & Notarize** (~15-25 minutes)

   - Certificate imports successfully
   - App bundle creates without errors
   - Code signing completes
   - Notarization succeeds
   - Stapling works

3. **Job 3: Create Release** (~2-3 minutes)

   - All artifacts downloaded
   - Release assets created
   - GitHub release published

### 3.4 Validate Workflow Outputs

**Check the GitHub release:**

1. Go to **Releases** tab in your repository
2. Find **"Release v1.0.0-test"**
3. Verify all files are present:
   - `neuron-node-builder-macos-arm64-v1.0.0-test.zip`
   - `neuron-node-builder-macos-arm64-v1.0.0-test.zip.sha256`
   - `neuron-node-builder-macos-x64-v1.0.0-test.zip`
   - `neuron-node-builder-macos-x64-v1.0.0-test.zip.sha256`
   - `neuron-node-builder-win-x64-v1.0.0-test.zip`

**Download and verify macOS app:**

```bash
# Download the macOS ZIP from the release
ARCH=arm64  # or x64 for Intel Macs
curl -L -o test-app.zip "https://github.com/YOUR_REPO/releases/download/v1.0.0-test/neuron-node-builder-macos-${ARCH}-v1.0.0-test.zip"

# Extract and verify
unzip test-app.zip
APP_BUNDLE=$(find . -name "*.app" -type d | head -1)

# Verify signature and notarization
codesign --verify --verbose "$APP_BUNDLE"
spctl --assess --verbose "$APP_BUNDLE"
xcrun stapler validate "$APP_BUNDLE"
```

**Success Criteria for Phase 3:**

- All workflow jobs complete successfully
- GitHub release is created with all assets
- Downloaded macOS app is properly signed and notarized
- No security warnings when running the app

---

## Phase 4: Production Validation

### 4.1 Clean Test Environment

```bash
# Test on a clean Mac (or create new user account)
# This simulates a real user experience

# Download app from GitHub release
# Try to open it - should work without warnings
```

### 4.2 Test on Different macOS Versions

**Recommended test matrix:**

- macOS Monterey (12.x)
- macOS Ventura (13.x)
- macOS Sonoma (14.x)
- macOS Sequoia (15.x)

### 4.3 Production Tag Test

```bash
# Only after staging tests pass completely
git tag v1.0.0
git push origin v1.0.0
```

---

## Phase 5: User Acceptance Testing

### 5.1 End-to-End User Flow

**Test as a new user:**

1. **Download** macOS app from GitHub release
2. **Extract** the ZIP file
3. **Double-click** the app
4. **Verify** it opens without security warnings
5. **Test** core functionality works
6. **Check** app appears properly in Applications folder

### 5.2 Security Validation Checklist

```bash
# Run these commands on the downloaded app
APP_PATH="/path/to/downloaded/app"

# 1. Verify code signature
codesign --verify --verbose "$APP_PATH"

# 2. Check signature details
codesign --display --verbose=4 "$APP_PATH"

# 3. Verify notarization
spctl --assess --verbose=4 "$APP_PATH"

# 4. Check stapling
xcrun stapler validate "$APP_PATH"

# 5. Verify entitlements
codesign --display --entitlements - "$APP_PATH"
```

**Expected Results:**

- `codesign --verify`: "valid on disk"
- `spctl --assess`: "accepted" with "source=Notarized Developer ID"
- `stapler validate`: "The validate action worked!"
- Entitlements show JIT and memory permissions

---

## Troubleshooting Common Issues

### Issue: "Certificate not found"

**Symptoms:**

```
Could not find Developer ID Application certificate
```

**Solutions:**

1. Run `security find-identity -v -p codesigning` locally
2. Copy the **exact** certificate name to `APPLE_SIGNING_IDENTITY` secret
3. Ensure certificate is not expired

### Issue: "Notarization failed"

**Symptoms:**

```
Notarization failed - Invalid submission
```

**Solutions:**

1. Check app is properly signed first: `codesign --verify --verbose app.app`
2. Verify entitlements are included: `--entitlements entitlements.plist`
3. Ensure hardened runtime is enabled: `--options runtime`

### Issue: "API authentication failed"

**Symptoms:**

```
Invalid Apple API credentials
```

**Solutions:**

1. Verify API key file format (should start with `-----BEGIN PRIVATE KEY-----`)
2. Check Key ID and Issuer ID are correct
3. Ensure API key has "Developer" role minimum

### Issue: "Build integrity check failed"

**Symptoms:**

```
Build integrity check failed!
Expected: abc123...
Current:  def456...
```

**Solutions:**

1. Ensure build process is deterministic
2. Check no files are modified between jobs
3. Verify artifact upload/download is working correctly

---

## Testing Checklist

### Pre-Testing Setup

- [ ] Apple Developer Program active
- [ ] Developer ID certificate installed locally
- [ ] App Store Connect API key created
- [ ] All GitHub secrets configured
- [ ] Workflow YAML syntax validated

### Local Testing

- [ ] App builds successfully locally
- [ ] App bundle creates without errors
- [ ] Local code signing works
- [ ] Local notarization succeeds
- [ ] App runs on local machine

### Staging Testing

- [ ] Workflow triggers successfully
- [ ] All three jobs complete
- [ ] GitHub release is created
- [ ] All platform files are present
- [ ] macOS app downloads and runs
- [ ] Signature verification passes

### Production Testing

- [ ] Clean environment test passes
- [ ] Multiple macOS versions tested
- [ ] No security warnings for users
- [ ] App functionality works correctly
- [ ] Release notes are accurate

### Security Validation

- [ ] Code signature valid
- [ ] Notarization verified
- [ ] Stapling successful
- [ ] Entitlements correct
- [ ] No sensitive data in logs

---

## Success Metrics

**Workflow Performance:**

- Total build time: < 30 minutes
- macOS signing time: < 20 minutes
- Success rate: > 99%

**Security Compliance:**

- Zero security warnings for users
- All signatures verify correctly
- Notarization always succeeds
- No certificate errors

**User Experience:**

- One-click app installation
- Immediate app launch (no dialogs)
- Professional appearance in Finder
- Proper app bundle structure

---

## Getting Help

### If Tests Fail

1. **Check the workflow logs** in GitHub Actions
2. **Review the troubleshooting section** above
3. **Validate your certificates and API keys** locally
4. **Test the manual signing process** first

### Support Resources

- **Apple Developer Support**: For certificate/notarization issues
- **GitHub Support**: For Actions/workflow problems
- **Project Issues**: Create an issue in this repository

### Emergency Rollback

If something goes wrong in production:

```bash
# Delete the problematic tag
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0

# Delete the GitHub release
# Go to Releases → Edit → Delete release
```

---

## Visual Regression Testing with Argos CI

The visual testing suite uses **Argos CI**, an open-source visual regression testing platform, to automatically detect UI changes. The GitHub Actions workflow launches a real Node-RED runtime, loads the deterministic workspace under `tests/visual/fixtures/workspaces/visual-baseline.json`, and captures screenshots through Playwright. These tests run on macOS and Windows and can block signing/publishing jobs when regressions appear.

### Why Argos CI?

- **Free tier**: 5,000 screenshots/month (vs LambdaTest's 2,000)
- **Cost-effective**: $30/month Pro tier (vs LambdaTest's $359/month)
- **Open-source**: Can self-host if needed
- **AI-powered**: Smart visual comparison with 1% tolerance
- **Native Playwright integration**: Seamless screenshot capture and upload
- **GitHub integration**: Automatic PR comments with visual comparison results

### Local Execution

#### 1. Install Dependencies

```bash
npm ci
npx playwright install chromium
```

#### 2. Setup Argos CI (One-time)

a. **Create Argos account** (if not already done):
   - Visit: https://argos-ci.com
   - Sign up with GitHub (recommended for seamless integration)
   - Free tier: 5,000 screenshots/month

b. **Create project**:
   - Project name: `neuron-node-builder`
   - Connect to GitHub repository

c. **Get project token**:
   - Go to Project Settings → API → Project Token
   - Copy the token (format: `argos_xxxxxx...`)

d. **Add token to `.env` file** (in repository root):

```bash
# .env file in repository root
ARGOS_TOKEN=argos_your_project_token_here
```

#### 3. Run Visual Tests

**Local testing (without uploading to Argos):**

```bash
npm run test:visual                  # Run all tests (captures snapshots locally)
npm run test:visual:ui               # Run with Playwright UI mode
npm run test:visual:headed           # Run with visible browser
npm run test:visual:debug            # Run with Playwright debugger
```

Screenshots are captured locally but not uploaded to Argos cloud.

**Testing with Argos upload:**

```bash
# Upload to Argos for visual comparison
ARGOS_UPLOAD=true npm run test:visual

# Run specific test file
ARGOS_UPLOAD=true npx playwright test tests/visual/startup.spec.ts --project=chromium-mac

# Run specific project (macOS or Windows)
ARGOS_UPLOAD=true npx playwright test tests/visual --project=chromium-mac
```

This will:
- Capture screenshots during test execution
- Automatically upload to Argos cloud (via Playwright reporter)
- Create a build in Argos dashboard
- Compare against existing baselines (if any)

#### 4. View Results

After running tests with `ARGOS_UPLOAD=true`:

1. Check console output for Argos build URL:
   ```
   Argos: 3 screenshots uploaded
   Build URL: https://app.argos-ci.com/your-org/neuron-node-builder/builds/xxx
   ```

2. Click the build URL to view visual comparison in Argos dashboard

3. **First run**: Approve baselines for each screenshot
   - All screenshots appear as "new" (not yet baselined)
   - Click "Approve" to set as baseline for future comparisons

4. **Subsequent runs**: Review changes
   - ✅ **No changes**: All screenshots match baselines
   - ⚠️  **Changes detected**: Visual differences highlighted
   - Click screenshots to see side-by-side comparison
   - Approve or reject changes

The global setup routine automatically:

- points `NEURON_ENV_PATH` to `tests/visual/fixtures/env/.env.visual`
- seeds the canonical workspace and device fixtures
- spins up Node-RED in the background and writes logs to `tests/visual/.output/node-red.log`

### Baseline Management

**How Argos Works:**

- `tests/visual/support/argos.ts` wraps Playwright's fixtures so every call to `captureViewportSnapshot` becomes an Argos screenshot
- Playwright reporter (`@argos-ci/playwright/reporter`) automatically uploads screenshots to Argos cloud
- Argos compares new screenshots against approved baselines using AI-powered visual diff
- macOS and Windows builds upload in parallel and contribute to the same build

**Managing Baselines:**

1. **Initial Setup** (First Run):
   - Run tests with `ARGOS_UPLOAD=true`
   - All screenshots appear as "new" in Argos dashboard
   - Review and approve each screenshot to set as baseline
   - Future runs will compare against these baselines

2. **Updating Baselines** (After UI Changes):
   - Make intended UI changes to your code
   - Run visual tests: `ARGOS_UPLOAD=true npm run test:visual`
   - Argos detects differences and marks them as "changed"
   - Review changes in Argos dashboard:
     - If changes are intentional: Click "Approve" to update baseline
     - If changes are bugs: Click "Reject" and fix the code

3. **Best Practices**:
   - Approve baselines per platform (macOS vs Windows) separately
   - Use descriptive test names for easy identification
   - Update baselines after design system changes
   - Keep fixtures stable (refresh fixture data when defaults change)
   - Configure `threshold: 0.01` in `argos.config.js` for 1% tolerance

### Troubleshooting Tips

#### General Debugging

- **Node-RED fails to load:** Inspect `tests/visual/.output/node-red.log` for errors. The global setup tears down the process and surfaces critical errors.
- **Route stubs missing:** Stubs live in `tests/visual/support/node-red.ts`. Extend them when new admin endpoints are added; otherwise dialogs may hang.
- **Stale temp directories:** Remove `neuron-visual-*` folders under your OS temp directory if a previous run crashed before teardown.

#### Argos CI Issues

**Error: "ARGOS_TOKEN environment variable is not set"**

The Argos project token is missing:

1. Create or update `.env` in repository root:

   ```bash
   ARGOS_TOKEN=argos_your_project_token_here
   ```

2. Get token from Argos dashboard:
   - Go to https://app.argos-ci.com
   - Navigate to your project → Settings → API
   - Copy "Project Token"

3. Verify token is loaded:
   ```bash
   cat .env | grep ARGOS_TOKEN
   ```

**Tests pass but screenshots not uploaded**

Argos upload is disabled by default in local development:

1. **Enable upload explicitly:**
   ```bash
   ARGOS_UPLOAD=true npm run test:visual
   ```

2. **Or run CI command:**
   ```bash
   npm run test:visual:ci  # Enables upload automatically
   ```

3. **Check Playwright reporter is configured:**
   - Verify `playwright.config.ts` includes `@argos-ci/playwright/reporter`
   - Ensure `uploadToArgos: CI || process.env.ARGOS_UPLOAD === "true"`

**Parallel upload issues on CI**

When running tests on multiple platforms (macOS + Windows):

1. Ensure `ARGOS_PARALLEL_TOTAL` and `ARGOS_PARALLEL_INDEX` are set correctly in GitHub Actions workflow

2. Verify `argos.config.js` has parallel upload configuration:
   ```javascript
   upload: {
     parallel: process.env.CI === "true",
     parallelTotal: 2,  // Number of parallel jobs
     parallelIndex: process.env.ARGOS_PARALLEL_INDEX || 0,
   }
   ```

3. Each job must have unique `parallel-index` (0, 1, ...)

**Screenshots appear different on CI vs local**

This is often due to OS-specific rendering differences:

1. **Expected behavior**: macOS and Windows screenshots will differ
   - Argos creates separate baselines for each platform
   - Approve baselines per OS independently

2. **Font rendering**: Ensure `waitForFonts()` is called before screenshots

3. **Animations**: Verify `disableAnimations()` is applied

4. **Dynamic content**: Use fixture data, not live APIs

**Baseline approval not working**

1. Check you're logged into Argos dashboard with correct account

2. Verify you have access to the project

3. For first run: All screenshots must be manually approved

4. Look for Argos bot comments on GitHub PRs (may require GitHub App installation)

**Environment File Confusion**

- **`.env`** (repository root): Argos credentials (`ARGOS_TOKEN`)
- **`tests/visual/fixtures/env/.env.visual`**: Hedera test data (`HEDERA_OPERATOR_KEY`, contract IDs, etc.)

Both files are loaded automatically by `playwright.config.ts`.

### GitHub Actions Integration

The visual regression workflow (`.github/workflows/visual-ai-regression.yml`) automatically:

1. **Runs on Pull Requests**: Captures screenshots for every PR to main/master branch
2. **Daily Scheduled Runs**: Runs at 6 AM UTC to catch environmental drift
3. **Parallel Execution**: Runs on both macOS and Windows simultaneously
4. **Argos Integration**:
   - Uploads screenshots from both platforms
   - Combines into single build for comparison
   - Argos bot comments on PR with visual changes
   - Build URL provided for detailed review

**Required GitHub Secret:**
- `ARGOS_TOKEN` - Get from Argos dashboard → Settings → API

With these steps, you can maintain the "robot eyes" gate, refresh baselines confidently, and run the suite locally before pushing to CI.

---

**Once all tests pass, you have a production-ready, enterprise-grade macOS signing and publishing workflow!**
