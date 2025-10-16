# Quick Release Guide

This guide shows the most common release scenarios and how to handle them efficiently with decoupled wrapper versioning.

## Scenario 1: Release Node-Builder Only (No Wrapper Changes)

**When:** Adding features or fixing bugs in node-builder, wrapper unchanged.

```bash
# 1. No changes needed to package.json wrapper version
# (wrapper version stays the same)

# 2. Bump node-builder version
npm version minor  # or patch/major

# 3. Create and push tag
git add package.json package-lock.json
git commit -m "chore: release v2.1.0"
git tag v2.1.0
git push origin v2.1.0

# ✅ Done! GitHub Actions builds with existing wrapper version from package.json
```

## Scenario 2: Update Wrapper Version Only

**When:** Wrapper has bug fixes or improvements, node-builder needs to use new version.

```bash
# 1. Update wrapper version in package.json
{
  "neuronConfig": {
    "wrapperVersion": "v1.6.0"  // ← Update this
  }
}

# 2. Bump node-builder version (patch or minor)
npm version patch

# 3. Commit and release
git add package.json package-lock.json
git commit -m "chore: update wrapper to v1.6.0 for stability improvements"
git tag v2.1.1
git push origin v2.1.1

# ✅ Done! Builds with wrapper v1.6.0
```

## Scenario 3: Test Pre-Release Wrapper

**When:** Testing unreleased wrapper version (beta, RC, etc.)

```bash
# Option A: Update package.json temporarily
{
  "neuronConfig": {
    "wrapperVersion": "v1.7.0-beta.1"
  }
}
npm version prerelease --preid=beta
git commit -am "test: wrapper v1.7.0-beta.1"
git tag v2.2.0-beta.1
git push origin v2.2.0-beta.1

# Option B: Manual workflow override (no code changes)
# 1. Go to GitHub Actions → "Production Build, Sign & Release"
# 2. Click "Run workflow"
# 3. Fill in:
#    Version: 2.2.0-beta
#    Wrapper Tag: v1.7.0-beta.1
#    Environment: staging
```

## Scenario 4: Emergency Hotfix (Different Versions)

**When:** Critical bug in node-builder, but using stable wrapper.

```bash
# 1. Wrapper version unchanged in package.json
{
  "version": "2.1.2",  // ← Patch bump
  "neuronConfig": {
    "wrapperVersion": "v1.5.0"  // ← Stays stable
  }
}

# 2. Fix bug and release
git add .
git commit -m "fix: critical bug in buyer node"
npm version patch
git push origin v2.1.2

# ✅ Done! Uses stable wrapper v1.5.0
```

## Scenario 5: Coordinated Release (Both Updated)

**When:** Both node-builder and wrapper have changes that need to ship together.

```bash
# 1. Update wrapper version
{
  "neuronConfig": {
    "wrapperVersion": "v1.6.0"  // ← New wrapper
  }
}

# 2. Bump node-builder version
npm version minor  # v2.2.0

# 3. Commit and release
git add package.json package-lock.json
git commit -m "feat: add new features with wrapper v1.6.0"
git tag v2.2.0
git push origin v2.2.0
```

## Version Decision Matrix

| What Changed? | Node-Builder Version | Wrapper Version in package.json | Example |
|---------------|---------------------|---------------------------------|---------|
| Node-builder feature only | Minor/Major bump | No change | 2.1.0 → 2.2.0, wrapper stays v1.5.0 |
| Node-builder bug fix only | Patch bump | No change | 2.1.0 → 2.1.1, wrapper stays v1.5.0 |
| Wrapper bug fix | Patch bump | Update to new wrapper | 2.1.0 → 2.1.1, wrapper v1.5.0 → v1.5.1 |
| Wrapper feature | Minor bump | Update to new wrapper | 2.1.0 → 2.2.0, wrapper v1.5.0 → v1.6.0 |
| Breaking wrapper change | Major bump | Update to new wrapper | 2.1.0 → 3.0.0, wrapper v1.5.0 → v2.0.0 |
| Both have features | Minor/Major bump | Update to new wrapper | 2.1.0 → 2.2.0, wrapper v1.5.0 → v1.6.0 |

## Quick Commands Reference

### Check Current Versions

```bash
# Node-builder version
node -p "require('./package.json').version"

# Wrapper version configured
node -p "require('./package.json').neuronConfig.wrapperVersion"

# Latest wrapper available
curl -s https://api.github.com/repos/NeuronInnovations/neuron-sdk-websocket-wrapper/releases/latest | grep '"tag_name"'
```

### Update Wrapper Version

```bash
# Manually edit package.json
vim package.json  # Update neuronConfig.wrapperVersion

# Or use jq (if installed)
jq '.neuronConfig.wrapperVersion = "v1.6.0"' package.json > tmp.json && mv tmp.json package.json
```

### Local Build with Specific Wrapper

```bash
# Use wrapper from package.json
npm run package

# Override with specific version
NEURON_WRAPPER_TAG=v1.6.0 npm run package

# Use latest wrapper (auto-fetch)
CI=true npm run package
```

### Verify Build Used Correct Wrapper

```bash
# Check build logs
npm run package 2>&1 | grep "wrapper tag"

# Expected output:
# Using neuron-wrapper tag: v1.5.0
# Building using neuron-wrapper tag: v1.5.0
```

## Pre-Release Checklist

Before creating a release:

- [ ] Determine if wrapper version needs updating
- [ ] Update `neuronConfig.wrapperVersion` in `package.json` (if needed)
- [ ] Test build locally: `npm run package`
- [ ] Verify wrapper version in build logs
- [ ] Bump node-builder version: `npm version <type>`
- [ ] Update CHANGELOG.md with changes
- [ ] Commit, tag, and push: `git push origin vX.X.X`
- [ ] Monitor GitHub Actions workflow
- [ ] Verify release artifacts include correct wrapper binaries

## Troubleshooting

### "Failed to download wrapper vX.X.X"

```bash
# Check if wrapper tag exists
curl -s https://api.github.com/repos/NeuronInnovations/neuron-sdk-websocket-wrapper/releases/tags/v1.6.0

# If 404, update package.json with valid version
{
  "neuronConfig": {
    "wrapperVersion": "v1.5.0"  // ← Use existing version
  }
}
```

### "Wrong wrapper version used in build"

```bash
# Priority check:
# 1. Manual override (GitHub Actions input)
# 2. package.json neuronConfig.wrapperVersion
# 3. Falls back to node-builder version

# Fix: Verify package.json has correct wrapperVersion
cat package.json | grep -A2 neuronConfig
```

### "Need to test different wrapper quickly"

```bash
# Option 1: Local override (no commit)
NEURON_WRAPPER_TAG=v1.7.0-beta npm run package

# Option 2: GitHub Actions manual trigger
# Go to Actions → Run workflow → Specify wrapper_tag input
```

## Tips & Best Practices

1. **Keep wrapper version updated in package.json**
   - Single source of truth
   - Visible in git history
   - Works for all environments

2. **Use semantic versioning consistently**
   - Wrapper minor → Node-builder minor minimum
   - Wrapper major → Node-builder major minimum
   - Wrapper patch → Node-builder patch minimum

3. **Document wrapper updates**
   - Add to CHANGELOG.md
   - Mention in release notes
   - Link to wrapper release notes

4. **Test wrapper updates locally first**
   - Build with new wrapper: `NEURON_WRAPPER_TAG=vX.X.X npm run package`
   - Test resulting executables
   - Verify functionality before release

5. **Use staging environment for testing**
   - Manual workflow trigger with `environment: staging`
   - Test wrapper + node-builder combinations
   - Validate before production release
