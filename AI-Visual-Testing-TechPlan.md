# AI-Powered Visual Testing Roadmap for Node Builder

## Context & Goals

- Provide reliable cross-platform (macOS, Windows) UI validation of the Electron-based Node Builder before deeper buyer⇄seller integration tests.
- Automate high-impact visual sanity checks so that GitHub Actions can deliver a “robot eyes” thumbs-up/down ahead of human review.
- Leverage AI-assisted diffing to catch layout/branding regressions while minimizing flake from dynamic content.

## Tech Stack Snapshot

- **Application**: Node.js + Node-RED runtime, custom Neuron nodes defined as HTML/JS templates (jQuery-driven modals, form controls), Electron packaging for desktop delivery.
- **Automation Harness**: Playwright Test (TypeScript) for deterministic browser automation, built-in trace/video capture, effortless GitHub Actions integration, native multi-browser support.
- **AI Visual Layer**: LambdaTest SmartUI with the Playwright SDK for AI-assisted diffing, baseline management, DOM targeting/ignores, and SmartUI cloud storage. Percy or similar remains a tertiary fallback if we ever leave LambdaTest.
- **CI Infrastructure**: GitHub Actions workflows running on macOS-13 and Windows-2022 runners via job matrix; Node.js 18 LTS environment; Playwright browser binaries cached per OS; artifacts stored via Actions.
- **Reporting**: Playwright HTML report + SmartUI build URLs exposed in workflow summary comments; SmartUI stores per-screenshot diffs, baselines, and approvals.

## UI Coverage for AI Automation

### ✅ Implemented & Tested (macOS Chromium)

- **Startup & Gatekeeping** (`tests/visual/startup.spec.ts`)

  - ✅ `public/loading.html` + `public/loading.js`:
    - Default boot state: Spinner, progress bar (12%), "Starting Neuron Node Builder..." status text
    - Server ready state: 100% progress, "Redirecting to editor..." confirmation
    - Timeout + error guidance: Error section visible, retry button, diagnostic messaging
  - ✅ `neuron/pages/setup.html` (`tests/visual/setup.spec.ts`):
    - Initial guidance: Hedera credential wizard with notice banner, empty form state
    - Successful credential save: Green success banner with redirect message
    - Error guidance state: Red error banner with network failure messaging
  - ✅ `neuron/pages/mandatory-update.html` & `optional-update.html` (`tests/visual/updates.spec.ts`):
    - Mandatory update screen: Version comparison, alert banner, update CTA
    - Optional update screen: Dismissible prompt, skip/update options

- **Seller Workflow** (`tests/visual/seller-config.spec.ts`)

  - ✅ `neuron/nodes/seller.html`:
    - Configuration editor (new device): Empty device metadata form, reinstatement dropdown showing "Create new device", contract selector, price/description fields
    - Runtime insights with peers: Populated runtime info (EVM address with copy button, balance with faucet link, topics), mock peer connection data

- **Buyer Workflow** (`tests/visual/buyer-config.spec.ts`)

  - ✅ `neuron/nodes/buyer.html`:
    - Initial wiring (empty sellers): Smart contract selector, empty seller EVM table with "Not deployed" status indicators
    - Configured sellers with runtime topics: Multi-row seller table showing Connected/Pending states with timestamps, runtime info panel populated

- **Shared Monitoring Widgets** (`tests/visual/connection-status.spec.ts`)

  - ✅ `neuron/nodes/connection-status.html` (within seller node editor):
    - Idle state: Empty peer connection panel, "No peers" placeholder
    - Connecting telemetry: Loading spinner, "Fetching peers..." status
    - Active peer table: 2+ connected peers with truncated keys, last-seen timestamps, connection status dots

- **Utility Nodes & Dialogs** (`tests/visual/utility-nodes.spec.ts`)
  - ✅ `neuron/nodes/stdin.html` (StdIn Read): Node selector dialog, device dropdown, clear button states
  - ✅ `neuron/nodes/stdin-w.html` (StdIn Write): Write variant with payload input field
  - ✅ `neuron/nodes/stdout.html`: Output stream configuration, topic display
  - ✅ `neuron/nodes/stderr.html`: Error stream configuration, styling differences from stdout
  - ✅ `neuron/nodes/neuron-p2p.html`: Node selection workflow with Select/Clear buttons, target node info display
  - ❌ `neuron/nodes/neuron-gpt.html`: **Removed** - Node no longer exists in current build

### Test Coverage Summary

- **Total Test Suites**: 7 spec files
- **Total Test Cases**: 20 scenarios
- **Passing**: 20/20 (100%)
- **Platform Coverage**: macOS Chromium (Windows pending CI setup)
- **Key UI States Validated**: Empty/populated forms, success/error banners, loading states, runtime data display, multi-row tables, connection status indicators

## Tooling & Environment Notes

- Seed a canonical Node Builder workspace export to drive deterministic test data (pre-created buyer/seller nodes). Store under `tests/visual/fixtures/` and restore before Playwright runs.
- Stub external Hedera calls where feasible (mock fetch endpoints or intercept network requests) to keep UI states predictable.
- Use Playwright projects for `chromium-mac` and `chromium-win` with consistent viewport and environment variables; disable animations when possible.
- Store SmartUI settings in `.smartui.json`: define browser matrix, viewports, device list, timeout and render waits, and host allowlist as needed.
- Manage SmartUI credentials via `LT_USERNAME`, `LT_ACCESS_KEY`, and `PROJECT_TOKEN`; keep per-environment tokens in GitHub Secrets. Local runs should rely on `.env.visual` and the SmartUI CLI’s config.
- Use SmartUI DOM selection/ignore primitives (`selectDOM`, `ignoreDOM`) to isolate static regions and mute dynamic widgets (timestamps, random IDs, counters).

## Implementation Plan

1. **Tooling Preparation**

   - Add SmartUI dependencies: `@lambdatest/smartui-cli`, `@lambdatest/playwright-driver`, ensure `@playwright/test` remains pinned, and commit `.smartui.json` skeleton scoped to the browsers/viewports we care about.
   - Replace the Applitools helper with a SmartUI wrapper that exposes `smartuiSnapshot` (local) and `lambdatest_action` commands (cloud) while preserving our `tests/visual` fixtures.
   - Document baseline governance (who approves, how to roll baselines forward) inside TESTING_GUIDE.md and team runbooks.

2. **Baseline Capture (Local)**

   - Execute the visual suite locally via `npx smartui --config .smartui.json exec -- npx playwright test tests/visual --project=chromium-mac` (and repeat for Windows) to seed SmartUI with golden baselines.
   - Use DOM include/ignore options to stabilise dynamic blocks; scroll helpers capture lazy-loaded content ahead of snapshots.

3. **Windows Coverage**

   - Run the same suite on a Windows workstation/runner; confirm font, scroll, and viewport parity. Tune `.smartui.json` thresholds and waits until macOS + Windows builds stabilise.
   - Ensure SmartUI stores macOS and Windows snapshots as separate browsers within the same project for quick diffing.

4. **GitHub Actions Integration**

   - Extend `.github/workflows/build-and-sign-production.yml` with a `visual-ai-tests` job that pulls build artifacts, exports SmartUI secrets, runs `npx smartui --config .smartui.json exec -- npx playwright test tests/visual` on the matrix, and publishes SmartUI build URLs to the workflow summary.
   - Block signing/publishing jobs on SmartUI status by wiring the job into the dependency graph. Mirror the job in a PR-focused workflow for fast feedback.
   - Configure the optional GitHub Status capability in SmartUI so commits show pass/fail with diff links.

5. **Robustness Hardening**

   - Enforce UI readiness checks (`.spinner` hidden, fonts loaded, Node-RED health) before calling `smartuiSnapshot` to control flake.
   - Capture Playwright traces/screenshots on failure; SmartUI already stores diff artifacts. Monitor retry policy and fine-tune waits as we build confidence.

6. **Rollout & Maintenance**
   - Launch in “notify” mode (non-blocking) for the first week. After baselines settle, require the SmartUI job on release-critical branches.
   - Schedule a nightly extended suite using HyperExecute or self-hosted runners to cover additional flows without slowing PRs.
   - Track metrics: diff acceptance time, skipped builds, retry counts. Revisit DOM include/ignore rules quarterly.

## Risks & Mitigations

- **Dynamic Data Variance**: Normalize timestamps and random IDs pre-snapshot; use SmartUI `ignoreDOM` or `selectDOM` filters to fence off volatile areas.
- **Baseline Drift**: Enforce peer review for baseline updates; SmartUI retains build history so we can audit changes.
- **Runner Resource Limits**: Cache Playwright browsers, reuse build artifacts, and keep the SmartUI matrix tight to stay under the 15-minute workflow budget.
- **Third-Party Availability**: If SmartUI is unreachable, tests fail fast—fall back to Playwright’s native `expect(page).toHaveScreenshot` for critical flows until service recovers.

## Next Actions

1. Create a SmartUI project in LambdaTest, capture the generated `PROJECT_TOKEN`, and add `LT_USERNAME`, `LT_ACCESS_KEY`, and project token to GitHub Secrets and local `.env.visual`.
2. Prototype the Playwright SmartUI helper locally, validate one editor snapshot end-to-end, and commit `.smartui.json` tuned for macOS 1440×900.
3. Ship a PR adding the SmartUI CLI workflow (macOS + Windows matrix) in notify mode; iterate on DOM ignores until diffs stabilise.
4. Once nightly + PR jobs are stable, delete residual Applitools code and secrets, and update TESTING_GUIDE.md to reference the SmartUI process.
