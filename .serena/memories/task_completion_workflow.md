# Task Completion Workflow

## Standard Workflow for Completing Tasks

When completing any development task in this project, follow these steps:

### 1. Code Changes
Make your changes to the relevant files in:
- `neuron/` for custom node logic
- `packages/node_modules/@node-red/` for Node-RED core modifications
- `tests/visual/` for visual test updates

### 2. Build Assets (if applicable)
If you modified frontend code (editor JavaScript, SASS, or HTML):
```bash
npx grunt build
```

This compiles:
- JavaScript source files → minified bundles (`public/red/red.min.js`)
- SASS files → CSS (`public/red/style.min.css`)
- Vendor libraries → production assets (`public/vendor/vendor.js`)

**Skip this step if you only modified backend Node.js code.**

### 3. Run Tests

#### For Backend/Node Changes
```bash
# Run unit tests
npm test
# OR
grunt test-core  # Core runtime only
grunt test-nodes # Node-specific tests
```

#### For Frontend/UI Changes
```bash
# Run visual regression tests
npm run test:visual

# If changes are intentional, upload to Argos for baseline approval
ARGOS_UPLOAD=true npm run test:visual
```

### 4. Lint Code
```bash
# Lint JavaScript
grunt jshint:editor  # For editor code
# OR
grunt jshint        # For all code
```

### 5. Manual Testing (if applicable)
For significant changes:
```bash
# Start the application
npm run start

# Navigate to http://localhost:1880
# Test the functionality manually
# Deploy flows, test custom nodes, verify UI
```

### 6. Commit Changes
```bash
# Stage changes
git add .

# Create descriptive commit
git commit -m "feat: description of changes"
# OR
git commit -m "fix: bug description"
```

**Commit Message Conventions:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Test additions/modifications
- `chore:` Build process or auxiliary tool changes

### 7. Push and Create PR (if applicable)
```bash
# Push to remote
git push origin feature/branch-name

# Create pull request via GitHub
# Visual tests will run automatically in CI
```

## Visual Testing Workflow

### When UI Changes Are Intentional
1. Make your changes
2. Run `npx grunt build` to compile assets
3. Run `ARGOS_UPLOAD=true npm run test:visual`
4. Review differences in Argos dashboard
5. Approve new baselines if changes look correct
6. Commit your code changes

### When Visual Tests Fail Unexpectedly
1. Review the failure in Argos dashboard
2. Check if your code caused unintended side effects
3. Fix the issue
4. Re-run tests to verify fix
5. Reject incorrect baselines in Argos

## Pre-Release Checklist

Before creating a release:
- [ ] All unit tests pass (`npm test`)
- [ ] All visual tests pass or intentional changes approved in Argos
- [ ] Code linted (`grunt jshint`)
- [ ] Manual testing completed for critical paths
- [ ] Documentation updated (README, API docs)
- [ ] Changelog updated with changes
- [ ] Version bumped in `package.json`
- [ ] Git tag created (`git tag vX.X.X`)

## Common Task-Specific Workflows

### Adding a New Custom Node
1. Create node file in `neuron/nodes/` (e.g., `my-node.js`)
2. Create HTML file for editor UI (`my-node.html`)
3. Register node in `neuron-settings.js` if needed
4. Add visual tests in `tests/visual/my-node.spec.ts`
5. Build: `npx grunt build`
6. Test: `npm test && npm run test:visual`
7. Commit changes

### Updating Dependencies
1. Update `package.json`
2. Run `npm install`
3. Build: `npx grunt build`
4. Run all tests: `npm test && npm run test:visual`
5. Check for visual regressions in Argos
6. Update `package-lock.json`
7. Commit both `package.json` and `package-lock.json`

### Fixing a Bug
1. Write a failing test that reproduces the bug
2. Fix the bug
3. Verify test now passes
4. Run full test suite
5. Commit with `fix:` prefix

### Refactoring Code
1. Ensure tests pass before refactoring
2. Make refactoring changes
3. Run tests to ensure no behavior changed
4. Run visual tests to ensure UI unchanged
5. Commit with `refactor:` prefix
