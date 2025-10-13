# Task Completion Checklist

## After Making Code Changes

When you complete a coding task, follow this checklist to ensure quality:

### 1. Code Quality Checks

```bash
# Lint the code you changed
grunt jshint:editor    # If you changed editor code
grunt jshint:nodes     # If you changed node code
grunt jshint:tests     # If you changed tests
```

**Fix all linting errors before proceeding.**

### 2. Build the Project

```bash
# Rebuild editor assets if you changed frontend code
npx grunt build

# Verify the build succeeded
ls -la packages/node_modules/@node-red/editor-client/public/
```

**Ensure `public/red/` and `public/vendor/` directories exist and contain files.**

### 3. Run Tests

```bash
# For backend changes: Run unit tests
npm test

# For UI changes: Run visual regression tests
npm run test:visual

# If you have Argos configured and want to compare:
ARGOS_UPLOAD=true npm run test:visual
```

**All tests should pass. Fix failures before committing.**

### 4. Test Manually

```bash
# Start the application
npm run start

# Visit http://localhost:1880
# Test the feature you changed
# Verify no console errors
# Check the UI works as expected
```

**Manual verification is critical for Node-RED UI changes.**

### 5. Check for Regressions

If you modified:
- **Buyer/Seller nodes**: Test node configuration dialogs
- **Services**: Check logs for errors
- **Environment handling**: Verify .env loading
- **SDK integration**: Test with real SDK binary

### 6. Documentation

Update documentation if needed:
- `README.md` - User-facing changes
- Code comments - Complex logic
- JSDoc - API changes
- Memory files - Architecture changes

### 7. Git Workflow

```bash
# Stage your changes
git add <files>

# Commit with descriptive message
git commit -m "feat: Add feature X"
# or
git commit -m "fix: Fix bug in Y"

# Push to your branch
git push origin <branch-name>
```

## Before Submitting a PR

### 1. Full Test Suite
```bash
# Run complete test suite
npm test

# Run visual tests with Argos
npm run test:visual:ci
```

### 2. Check CI Status
- Wait for GitHub Actions to complete
- Review visual regression results in Argos
- Fix any CI failures

### 3. Code Review Preparation
- Write clear PR description
- Reference related issues
- Document breaking changes
- Add screenshots for UI changes

## Release Process

When preparing a release:

### 1. Version Bump
```bash
# Update package.json version
npm version patch  # or minor, or major
```

### 2. Update Changelog
```bash
# Edit CHANGELOG.md
# Document new features, fixes, breaking changes
```

### 3. Full Build & Test
```bash
# Clean build
rm -rf node_modules
npm install
npx grunt build
npm test
npm run test:visual:ci
```

### 4. Package & Test
```bash
# Create executables
npm run package

# Test the packaged app
npm run create-app-bundle
# Open and test the .app bundle
```

### 5. Tag & Push
```bash
# Create release tag
git tag v1.0.0
git push origin v1.0.0

# This triggers the build-and-sign workflow
```

## Common Issues After Changes

### Build Failures
```bash
# Clean and rebuild
rm -rf packages/node_modules/@node-red/editor-client/public
npx grunt build
```

### Test Failures
```bash
# Check test logs
npm test 2>&1 | tee test.log

# For visual tests, view report
npm run test:visual:report
```

### Runtime Errors
```bash
# Check Node-RED logs
# Look for errors in the console output

# Check SDK logs (if SDK_LOG_FOLDER is set)
cat $SDK_LOG_FOLDER/buyer-*-stderr.log
cat $SDK_LOG_FOLDER/seller-*-stderr.log
```

### Environment Issues
```bash
# Verify .env is loaded
cat .env

# Check required variables
echo $HEDERA_OPERATOR_ID
echo $NEURON_SDK_PATH
```

## Quality Standards

Before marking a task as complete:

- [ ] Code passes linting (JSHint)
- [ ] All tests pass locally
- [ ] Manual testing completed
- [ ] No console errors
- [ ] No regressions in existing features
- [ ] Documentation updated if needed
- [ ] Git commit messages are clear
- [ ] CI/CD checks pass
- [ ] Visual tests approved (if UI changes)
- [ ] Code follows project conventions
- [ ] No sensitive data in code/logs
- [ ] Error handling is appropriate
- [ ] Cleanup/close handlers added

## Performance Considerations

When making changes, consider:

1. **Memory**: Node-RED runs long-lived processes
2. **Process cleanup**: Always close child processes
3. **File handles**: Close file descriptors
4. **Timers**: Clear intervals/timeouts on node close
5. **WebSocket connections**: Clean up on disconnect
6. **SDK processes**: Ensure proper termination

## Security Considerations

When making changes, ensure:

1. **No credentials in code**: Use environment variables
2. **Input validation**: Validate all user inputs
3. **SQL injection**: Not applicable (no SQL)
4. **XSS**: Sanitize HTML in editor
5. **Process spawning**: Validate paths and arguments
6. **File access**: Restrict to intended directories
7. **API keys**: Never log or expose
