# Wrapper Version Management

This document explains how to manage the neuron-wrapper dependency version independently from the node-builder version.

## Problem

Previously, creating a node-builder release (e.g., `v2.0.0`) required creating a matching wrapper release with the same tag (`v2.0.0`), even if the wrapper had no changes. This created unnecessary maintenance overhead.

## Solution

The build system now supports **decoupled versioning** with three priority levels for determining which wrapper version to use:

### Priority Order

1. **Manual Override** (highest priority)
   - Specify `wrapper_tag` when triggering GitHub Actions workflow
   - Useful for testing specific wrapper versions

2. **package.json Configuration** (recommended)
   - Store wrapper version in `package.json` under `neuronConfig.wrapperVersion`
   - Committed to git, tracked in version control
   - Automatically used by both local builds and CI/CD

3. **Version Matching** (legacy fallback)
   - Uses node-builder version tag as wrapper version
   - Only used if neither override nor package.json config exists

## Usage

### Method 1: Update package.json (Recommended)

Update the wrapper version in `package.json`:

```json
{
  "neuronConfig": {
    "wrapperVersion": "v1.5.0"
  }
}
```

**Benefits:**
- Version-controlled and visible in git history
- Works for both local builds and CI/CD
- No need to create matching wrapper tags
- Team members always use the correct wrapper version

**When to update:**
- When wrapper functionality changes
- When fixing wrapper bugs
- When upgrading wrapper dependencies

### Method 2: Manual Override (GitHub Actions)

When manually triggering the workflow:

1. Go to **Actions** → **Production Build, Sign & Release**
2. Click **Run workflow**
3. Fill in:
   - **Version**: `2.0.0` (node-builder version)
   - **Wrapper Tag**: `v1.5.0` (specific wrapper version)
   - **Environment**: `production`

**Benefits:**
- Quick testing of different wrapper versions
- No code changes required
- Useful for emergency fixes

### Method 3: Environment Variable (Local Builds)

For local development:

```bash
# Use specific wrapper version
NEURON_WRAPPER_TAG=v1.5.0 npm run package

# Use latest wrapper version (auto-fetch)
npm run package  # In CI mode, automatically fetches latest
```

## Examples

### Example 1: Releasing Node-Builder v2.1.0 with Wrapper v1.5.0

**Scenario:** Node-builder has new features, but wrapper is unchanged.

```json
// package.json
{
  "version": "2.1.0",
  "neuronConfig": {
    "wrapperVersion": "v1.5.0"  // ← Stays at v1.5.0
  }
}
```

```bash
# Create release
git tag v2.1.0
git push origin v2.1.0
```

**Result:**
- Node-builder v2.1.0 is released
- Uses wrapper v1.5.0 (no new wrapper tag needed!)

### Example 2: Testing Node-Builder with New Wrapper

**Scenario:** Testing node-builder with unreleased wrapper changes.

```bash
# Manual workflow trigger in GitHub Actions:
Version: 2.1.0-beta
Wrapper Tag: v1.6.0-rc1
Environment: staging
```

**Result:**
- Builds node-builder v2.1.0-beta
- Uses wrapper v1.6.0-rc1 for testing

### Example 3: Upgrading Wrapper Version

**Scenario:** Wrapper has critical bug fix, node-builder unchanged.

```bash
# Update package.json
{
  "version": "2.1.0",
  "neuronConfig": {
    "wrapperVersion": "v1.5.1"  // ← Updated for bug fix
  }
}

# Commit and release
git add package.json
git commit -m "chore: update wrapper to v1.5.1 for bug fix"
git tag v2.1.1
git push origin v2.1.1
```

**Result:**
- Node-builder v2.1.1 released (patch version bump)
- Uses wrapper v1.5.1 automatically

## Workflow Details

### GitHub Actions Resolution Logic

```yaml
# .github/workflows/build-and-sign-production.yml
- name: Determine neuron-wrapper tag
  run: |
    # Priority 1: Manual override
    WRAPPER_TAG="${{ inputs.wrapper_tag }}"

    # Priority 2: package.json
    if [ -z "$WRAPPER_TAG" ]; then
      WRAPPER_TAG=$(node -p "require('./package.json').neuronConfig?.wrapperVersion || ''")
    fi

    # Priority 3: Match node-builder version
    if [ -z "$WRAPPER_TAG" ]; then
      WRAPPER_TAG="v${{ steps.version.outputs.version }}"
    fi
```

### Local Build Resolution Logic

```javascript
// build.js
let tag;

// Priority 1: Environment variable
if (process.env.NEURON_WRAPPER_TAG) {
  tag = process.env.NEURON_WRAPPER_TAG;
}
// Priority 2: package.json
else {
  const pkg = require('./package.json');
  tag = pkg.neuronConfig?.wrapperVersion || await getLatestTag();
}
```

## Best Practices

### 1. Keep Wrapper Version Updated in package.json

```bash
# When wrapper is updated
npm version patch  # or minor/major
git add package.json
git commit -m "chore: update wrapper to v1.6.0"
```

### 2. Document Wrapper Changes in Changelog

```markdown
## [2.1.1] - 2025-01-15

### Changed
- Updated neuron-wrapper to v1.5.1 for WebSocket stability improvements
```

### 3. Test Wrapper Updates Before Release

```bash
# Test locally first
NEURON_WRAPPER_TAG=v1.6.0-beta npm run package

# Test in GitHub Actions
# Use manual workflow trigger with beta wrapper tag
```

### 4. Version Bump Strategy

| Change Type | Node-Builder Version | Wrapper Version | Action |
|-------------|---------------------|-----------------|--------|
| Node-builder feature | Minor/Major bump | No change | Update package.json version only |
| Wrapper bug fix | Patch bump | Patch bump | Update both versions |
| Wrapper feature | Minor bump | Minor/Major bump | Update both versions |
| Node-builder bug fix (no wrapper change) | Patch bump | No change | Update package.json version only |

## Troubleshooting

### Build Fails: Wrapper Tag Not Found

**Error:** `❌ Failed to download wrapper from tag vX.X.X`

**Solution:**
1. Check wrapper tag exists: https://github.com/NeuronInnovations/neuron-sdk-websocket-wrapper/releases
2. Update `package.json` with valid wrapper version
3. Or use manual override with known good version

### Local Build Uses Wrong Wrapper Version

**Issue:** Build script downloads unexpected wrapper version

**Solution:**
```bash
# Check package.json configuration
cat package.json | grep -A2 "neuronConfig"

# Override with environment variable
NEURON_WRAPPER_TAG=v1.5.0 npm run package
```

### CI/CD Uses Wrong Wrapper Version

**Issue:** GitHub Actions builds with incorrect wrapper

**Solution:**
1. Verify `package.json` has correct `neuronConfig.wrapperVersion`
2. Check workflow logs: "Resolved wrapper tag: vX.X.X"
3. Use manual override if needed

## Migration from Old System

### Before (Matched Versions)

```bash
# Required matching tags
git tag v2.0.0        # node-builder
cd ../wrapper
git tag v2.0.0        # wrapper (forced to match!)
```

### After (Decoupled Versions)

```bash
# Independent versioning
# package.json
{
  "version": "2.0.0",
  "neuronConfig": {
    "wrapperVersion": "v1.5.0"  // ← No matching needed!
  }
}

git tag v2.0.0  # Only node-builder tag needed
```

## Summary

✅ **Advantages:**
- No need to create matching wrapper tags
- Wrapper version controlled in `package.json`
- Flexibility to test different combinations
- Reduced release overhead
- Better version tracking

✅ **Workflows Supported:**
- Automated builds with `package.json` config
- Manual testing with specific wrapper versions
- Emergency fixes without wrapper changes
- Local development with version flexibility

✅ **Backward Compatible:**
- Old workflow (matching versions) still works as fallback
- No breaking changes to existing releases
- Gradual migration supported
