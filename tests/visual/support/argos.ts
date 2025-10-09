/**
 * Argos CI Visual Testing Fixture
 *
 * This module provides a Playwright test fixture that integrates with Argos CI
 * for automated visual regression testing. It wraps the Argos screenshot API
 * to provide a consistent interface for capturing and uploading screenshots.
 *
 * Key Features:
 * - Automatic screenshot capture with descriptive names
 * - Full-page screenshot support
 * - Error handling and logging
 * - Test context integration (test name, project, etc.)
 *
 * Usage:
 *   import { test, expect } from "./support/argos";
 *
 *   test("my visual test", async ({ page, argosSnapshot }) => {
 *     await page.goto("http://localhost:3000");
 *     await argosSnapshot("homepage");
 *   });
 */

import { test as base } from "@playwright/test";
import { argosScreenshot } from "@argos-ci/playwright";
import type { SmartUISnapshotOptions } from "./fixtures";

/**
 * Function signature for taking Argos snapshots
 * Accepts a checkpoint name and optional configuration
 */
export type ArgosSnapshotFn = (
  checkName: string,
  options?: SmartUISnapshotOptions
) => Promise<void>;

/**
 * Normalize snapshot names to ensure they're valid and readable
 *
 * Rules:
 * - Convert non-ASCII characters to spaces
 * - Collapse multiple spaces into one
 * - Remove special characters (keep alphanumeric, spaces, hyphens, parentheses)
 * - Limit to 180 characters for compatibility
 *
 * @param input - Raw snapshot name from test
 * @returns Normalized, URL-safe snapshot name
 */
function normalizeSnapshotName(input: string): string {
  // Convert non-printable ASCII to spaces
  const ascii = input.replace(/[^ -~]/g, " ");

  // Collapse multiple spaces
  const collapsed = ascii.replace(/\s+/g, " ").trim();

  // Keep only safe characters: alphanumeric, space, hyphen, underscore, parentheses
  const safe = collapsed.replace(/[^0-9A-Za-z _\-()]/g, "");

  // Truncate to reasonable length
  return safe.slice(0, 180) || "visual-check";
}

/**
 * Playwright fixtures extended with Argos snapshot capability
 */
export type ArgosFixtures = {
  argosSnapshot: ArgosSnapshotFn;
};

/**
 * Extended Playwright test with Argos visual testing support
 *
 * This fixture automatically:
 * 1. Injects the argosSnapshot function into each test
 * 2. Builds descriptive screenshot names from test context
 * 3. Handles errors gracefully with detailed logging
 * 4. Uploads screenshots to Argos cloud for comparison
 */
export const test = base.extend<ArgosFixtures>({
  argosSnapshot: async ({ page }, use, testInfo) => {
    /**
     * Take a visual snapshot with Argos CI
     *
     * @param checkName - Human-readable checkpoint name (e.g., "homepage", "modal open")
     * @param options - Screenshot options (fullPage, clip region, etc.)
     */
    const takeSnapshot: ArgosSnapshotFn = async (checkName, options) => {
      // Build a descriptive name that includes test context
      // Format: "Test Name - Checkpoint (project-name)"
      // Example: "Startup loading - Default state (chromium-mac)"
      const rawName = `${testInfo.title} - ${checkName} (${testInfo.project.name})`;
      const screenshotName = normalizeSnapshotName(rawName);

      try {
        // Capture screenshot with Argos
        await argosScreenshot(page, screenshotName, {
          // Default to full-page screenshots
          fullPage: options?.fullPage ?? true,

          // Map additional options if provided
          // Note: Argos has different option names than LambdaTest SmartUI
          ...(options?.element && { clip: options.element as any }),
        });

        console.log(`[argos] snapshot captured: ${screenshotName}`);
      } catch (error) {
        console.error(
          `[argos] snapshot failed: ${screenshotName}`,
          error instanceof Error ? error.message : String(error)
        );

        // Re-throw to fail the test
        throw error;
      }
    };

    // Provide the snapshot function to the test
    await use(takeSnapshot);
  },
});

/**
 * Re-export expect for convenience
 * Allows importing both test and expect from this module
 */
export const expect = test.expect;
