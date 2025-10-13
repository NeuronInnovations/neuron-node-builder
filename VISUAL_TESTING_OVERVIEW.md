# Visual Regression Testing System

## Overview

This project implements an automated visual regression testing system that runs on GitHub Actions to detect unintended UI changes before they reach production. The system captures screenshots of the Node-RED editor interface and compares them against approved baseline images to ensure visual consistency across releases.

## What We Test

### Core User Interface Components

1. **Startup Experience**
   - Loading screen states (default, ready, error)
   - Progress indicators and status messages
   - Error handling and guidance displays

2. **Node Configuration Dialogs**
   - Buyer node configuration interface
   - Seller node configuration interface
   - Connection status widgets and peer tables
   - Device selection and management interfaces

3. **Editor Integration**
   - Custom node palettes
   - Configuration forms with dynamic content
   - Connection telemetry displays
   - Runtime state indicators

### Cross-Platform Validation

All tests run on both macOS and Windows to ensure consistent rendering across operating systems:
- macOS 13 (Intel x64)
- Windows Server 2022

## Testing Technique

### Playwright + Argos CI Integration

The system uses Playwright for browser automation combined with Argos CI for intelligent visual comparison:

1. **Test Execution**
   - Playwright launches a real Node-RED instance in the background
   - Tests navigate to specific UI states using API stubs and page manipulation
   - Screenshots are captured at precise moments using viewport snapshots

2. **Visual Comparison**
   - Screenshots are uploaded to Argos CI platform
   - AI-powered visual diff engine compares against approved baselines
   - Differences are highlighted with 1% tolerance threshold
   - Results are reported back to GitHub pull requests

3. **Deterministic Test Environment**
   - Fixed test data from `tests/visual/fixtures/`
   - Consistent workspace configurations
   - Stubbed API endpoints to eliminate external dependencies
   - Disabled animations and enforced font loading

### Test Isolation Strategy

Each test is isolated to prevent interference:
- Dedicated user directories for each test run
- Clean environment variables via `.env.visual`
- API route interception to prevent real network calls
- Navigation blocking to prevent unwanted redirects

## How It Helps

### Early Detection of Visual Regressions

The system catches UI issues that traditional unit tests cannot detect:
- Accidental styling changes from CSS modifications
- Layout shifts from dependency updates
- Cross-browser rendering inconsistencies
- Theme and color scheme regressions

### Confidence in Refactoring

Developers can refactor code with confidence knowing that visual tests will catch unintended UI changes:
- Safe dependency upgrades
- Code restructuring without UI impact
- Performance optimizations that don't affect appearance

### Quality Gate for Pull Requests

Visual tests act as an automated code review step:
- Tests run automatically on every pull request
- Argos bot comments on PRs with comparison results
- Reviewers can approve or reject visual changes
- Prevents accidental UI breakage from merging

### Documentation Through Screenshots

The baseline screenshots serve as living documentation:
- Visual reference of current UI state
- Historical record of UI evolution
- Onboarding resource for new developers

### Cost-Effective Solution

Using Argos CI provides enterprise-grade visual testing at minimal cost:
- Free tier: 5,000 screenshots per month
- Pro tier: $30/month (vs alternatives at $359/month)
- Self-hosting option available if needed
- Native Playwright integration with minimal setup

## Workflow Architecture

### GitHub Actions Pipeline

The visual testing workflow runs in three scenarios:
1. Pull requests to main/master branches
2. Daily scheduled runs at 6 AM UTC
3. Manual workflow dispatch

### Parallel Execution

Tests run concurrently on both platforms:
- macOS and Windows jobs execute simultaneously
- Results are combined into single Argos build
- Total execution time: approximately 15-20 minutes

### Integration with CI/CD

Visual regression testing is integrated into the production release workflow:
- Runs after security validation and build steps
- Does not block releases if tests fail (continues with warning)
- Provides quality signal without becoming a deployment bottleneck

## Test Maintenance

### Baseline Management

Baselines are managed through the Argos dashboard:
- First run establishes initial baselines
- Subsequent runs compare against approved baselines
- Intentional changes require explicit approval
- Separate baselines per operating system

### Handling Changes

When UI changes are intentional:
1. Visual tests detect differences
2. Developer reviews changes in Argos dashboard
3. Approve changes to update baseline
4. Future tests use new baseline for comparison

### Adding New Tests

To add new visual tests:
1. Create test file in `tests/visual/`
2. Use `captureViewportSnapshot()` helper
3. Run tests with `ARGOS_UPLOAD=true` locally
4. Approve initial baseline in Argos dashboard

## Technical Requirements

### Build Prerequisites

Critical: Node-RED editor assets must be compiled before tests run:
```bash
npx grunt build
```

This step creates the `public/` directory with compiled JavaScript, CSS, and vendor libraries required for the editor UI to load.

### Environment Configuration

Tests require two environment files:
- `.env` (repository root): Argos authentication token
- `tests/visual/fixtures/env/.env.visual`: Test credentials and contract IDs

### Node-RED Startup

Global setup routine automatically:
- Spawns Node-RED process in background
- Seeds fixture workspace and device data
- Performs health checks before tests begin
- Captures logs to `tests/visual/.output/node-red.log`

## Troubleshooting

### Common Issues

**Editor fails to load**: Missing `npx grunt build` step. Verify `public/red/` directory exists.

**Tests timeout**: Node-RED startup may be slow in CI. Timeouts are already generous (60-90 seconds).

**Navigation interruptions**: Automatic redirects blocked by route interception in test setup.

**Platform differences**: Expected behavior. Argos creates separate baselines for macOS and Windows.

## Performance Metrics

### Current Benchmarks

- Total workflow duration: 30-40 minutes
- Visual test execution: 15-20 minutes
- Screenshot upload: 2-3 minutes
- Average screenshots per run: 20-30

### Success Criteria

- Zero false positives in stable UI
- Detection of all intentional UI changes
- Consistent results across test runs
- No flaky tests requiring retries

## Future Enhancements

### Potential Improvements

1. **Additional Coverage**: Expand to test more node types and editor features
2. **Mobile Viewports**: Add responsive design testing for tablet/mobile layouts
3. **Accessibility Testing**: Integrate contrast ratio and ARIA validation
4. **Performance Metrics**: Capture load times and rendering performance
5. **Animation Testing**: Validate smooth transitions and loading states

### Scalability Considerations

As the test suite grows:
- Parallel test execution can be increased
- Test sharding across multiple runners
- Selective test execution based on changed files
- Caching strategies for faster builds
