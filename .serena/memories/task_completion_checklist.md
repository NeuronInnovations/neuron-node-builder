# Task Completion Checklist

## When a Development Task is Completed

### 1. Code Quality Checks
- [ ] Run JSHint linting
  ```bash
  grunt jshint
  ```
- [ ] Fix any linting errors or warnings
- [ ] Ensure code follows style guidelines (4-space indentation, proper braces)

### 2. Testing
- [ ] Run unit tests
  ```bash
  npm test
  # or
  grunt simplemocha
  ```
- [ ] Add new tests for new features
- [ ] Ensure all tests pass
- [ ] Run visual regression tests (if UI changes)
  ```bash
  npm run test:visual
  ```
- [ ] Check test coverage
  ```bash
  grunt nyc:all
  ```

### 3. Build Verification
- [ ] Run production build
  ```bash
  npm run build
  # or
  npx grunt build
  ```
- [ ] Verify build completes without errors
- [ ] Check that `public/` directory is created with compiled assets
- [ ] Test the application locally
  ```bash
  npm run start
  ```

### 4. Visual Testing (for UI changes)
- [ ] Run visual regression suite
  ```bash
  npm run test:visual
  ```
- [ ] Review SmartUI dashboard for any regressions
- [ ] Approve baseline changes if intentional
- [ ] Ensure tests pass on both macOS and Windows

### 5. Documentation
- [ ] Update README.md if user-facing changes
- [ ] Update API.md for API changes
- [ ] Add/update JSDoc comments
- [ ] Update CHANGELOG.md with notable changes

### 6. Environment & Configuration
- [ ] Update `.env.example` if new environment variables added
- [ ] Document any new configuration requirements
- [ ] Update neuron-settings.js if needed

### 7. Git Workflow
- [ ] Ensure all changes are committed
  ```bash
  git status
  git add .
  git commit -m "descriptive message"
  ```
- [ ] Push to feature branch
  ```bash
  git push origin feat/branch-name
  ```
- [ ] Create pull request to appropriate branch (master/dev)

### 8. Pre-Release Checks (for releases)
- [ ] Update version in package.json
- [ ] Update CHANGELOG.md
- [ ] Run full test suite
  ```bash
  npm test
  npm run test:visual
  ```
- [ ] Build and package application
  ```bash
  npm run package
  ```
- [ ] Test packaged application
- [ ] Create git tag
  ```bash
  git tag v1.0.0
  git push origin v1.0.0
  ```

### 9. Code Signing & Distribution (macOS releases)
- [ ] Verify Apple Developer credentials
- [ ] Run build workflow
  ```bash
  ./build-workflow.sh
  ```
- [ ] Sign and notarize app
- [ ] Verify signature
  ```bash
  codesign --verify --verbose build/releases/*.app
  spctl --assess --verbose build/releases/*.app
  ```
- [ ] Test on clean macOS environment
- [ ] Upload to release

### 10. CI/CD Pipeline Checks
- [ ] Ensure GitHub Actions workflows pass
  - Security & Build job
  - macOS Sign & Notarize job
  - Visual AI Regression job
- [ ] Review workflow logs for warnings
- [ ] Verify release artifacts are created

## Quick Pre-Commit Checklist
For quick commits, at minimum ensure:
- [ ] Code lints without errors (`grunt jshint`)
- [ ] Existing tests pass (`npm test`)
- [ ] Application builds (`npm run build`)
- [ ] Application runs locally (`npm run start`)

## Critical Reminders
⚠️ **Always run `npx grunt build` before starting the application** - this is required for Node-RED 4.x UI to load

⚠️ **Visual tests are blocking** - failing visual tests will prevent deployment in CI/CD

⚠️ **macOS signing requires valid credentials** - ensure certificates and API keys are configured

⚠️ **Test on target platforms** - if possible, test on both macOS and Windows before release