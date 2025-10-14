/**
 * Argos CI Visual Testing Configuration
 *
 * Argos is an open-source visual testing platform that integrates with Playwright
 * to automatically capture, upload, and compare screenshots against baselines.
 *
 * Documentation: https://argos-ci.com/docs
 * Playwright Integration: https://argos-ci.com/docs/quickstart/playwright
 */

module.exports = {
  /**
   * Project identification token
   * Get this from: https://app.argos-ci.com/settings
   * Store in .env as ARGOS_TOKEN for security
   */
  token: process.env.ARGOS_TOKEN,

  /**
   * Upload configuration for parallel test execution
   * When running tests on multiple platforms (macOS, Windows), each platform
   * runs as a separate job but contributes to the same build.
   */
  upload: {
    // Enable parallel uploads from different CI jobs
    parallel: process.env.CI === "true",

    // Total number of parallel jobs contributing to this build
    // Must match the number of matrix jobs in GitHub Actions
    parallelTotal: process.env.ARGOS_PARALLEL_TOTAL
      ? parseInt(process.env.ARGOS_PARALLEL_TOTAL, 10)
      : process.env.CI
      ? 2
      : 1, // 2 platforms (macOS, Windows) on CI

    // Index of current job (1-based, as required by Argos)
    // Each platform gets a unique index: macOS=1, Windows=2
    parallelIndex: process.env.ARGOS_PARALLEL_INDEX
      ? parseInt(process.env.ARGOS_PARALLEL_INDEX, 10)
      : 1,
  },

  /**
   * Visual comparison settings
   * Threshold determines how sensitive the comparison is to changes
   */
  threshold: 0.01, // 1% pixel difference tolerance (adjust based on your needs)

  /**
   * Project name in Argos dashboard
   * Should match the project created in Argos CI
   */
  project: "neuron-node-builder",

  /**
   * Build identification
   * Helps track builds in the Argos dashboard
   */
  buildName:
    process.env.ARGOS_BUILD_NAME ||
    `neuron-build-${process.env.GITHUB_RUN_ID || Date.now()}`,

  /**
   * Git branch information
   * Auto-detected from GitHub Actions environment or git
   */
  branch:
    process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || undefined, // Let Argos auto-detect from git

  /**
   * CI detection
   * Argos behaves differently in CI vs local development
   */
  ci: process.env.CI === "true",

  /**
   * Root directory for screenshot paths
   * Relative paths in screenshots will be resolved from here
   */
  root: __dirname,
};
