import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Page } from "@playwright/test";

const repoRoot = path.resolve(__dirname, "..", "..", "..");
const NODE_RED_BASE_URL = process.env.NODE_RED_BASE_URL || "http://127.0.0.1:1880";

/**
 * Get URL for a fixture file
 *
 * Returns HTTP URL when running visual tests (for Argos CI compatibility)
 * Returns file:// URL for local development without visual testing
 *
 * @param segments - Path segments relative to repository root
 * @returns URL string (either http:// or file://)
 *
 * @example
 * fixtureUrl("public", "loading.html")
 * // → "http://127.0.0.1:1880/public/loading.html" (in visual tests)
 * // → "file:///path/to/project/public/loading.html" (in local dev)
 */
export const fixtureUrl = (...segments: string[]): string => {
  const visualTestMode = process.env.VISUAL_TEST_MODE === "1";

  if (visualTestMode) {
    // Convert to HTTP URL for Argos CI and visual testing compatibility
    // Map common paths to their HTTP equivalents
    const pathString = segments.join("/");

    if (pathString.startsWith("tests/visual/fixtures/")) {
      // tests/visual/fixtures/foo.html → http://localhost:1880/visual-fixtures/foo.html
      const relativePath = pathString.replace("tests/visual/fixtures/", "");
      return `${NODE_RED_BASE_URL}/visual-fixtures/${relativePath}`;
    } else if (pathString.startsWith("public/")) {
      // public/loading.html → http://localhost:1880/public/loading.html
      const relativePath = pathString.replace("public/", "");
      return `${NODE_RED_BASE_URL}/public/${relativePath}`;
    }

    // Fallback: use file:// URL and log warning
    console.warn(
      `[fixtures] Warning: Unknown path pattern "${pathString}" - falling back to file:// URL. ` +
      `Visual snapshots may fail. Add mapping to fixtureUrl() helper.`
    );
  }

  // Return file:// URL for local testing or unknown paths
  const absolutePath = path.resolve(repoRoot, ...segments);
  return pathToFileURL(absolutePath).toString();
};

export async function disableAnimations(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        transition: none !important;
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        animation-iteration-count: 1 !important;
      }
    `,
  });
}

export async function waitForFonts(page: Page): Promise<void> {
  await page.evaluate(async () => {
    if ("fonts" in document && typeof document.fonts.ready !== "undefined") {
      await (document as any).fonts.ready;
    }
  });
}

/**
 * Options for visual snapshot capture
 * Compatible with both Argos CI and other visual testing tools
 */
export type SmartUISnapshotOptions = {
  /** Capture full page screenshot (default: true) */
  fullPage?: boolean;

  /** CSS selectors to include in snapshot */
  selectDOM?: Record<string, string[]>;

  /** CSS selectors to exclude from snapshot */
  ignoreDOM?: Record<string, string[]>;

  /** Element/region to capture */
  element?: Record<string, unknown>;

  /** Additional provider-specific options */
  [key: string]: unknown;
};

/**
 * Function signature for visual snapshot capture
 * Works with Argos CI and other providers
 */
export type SmartUISnapshotFn = (
  checkName: string,
  options?: SmartUISnapshotOptions
) => Promise<void>;

/**
 * Capture a full-page visual snapshot
 *
 * Wrapper function that ensures consistent full-page screenshot capture
 * across all visual tests. Works with Argos CI snapshot function.
 *
 * @param snapshot - Snapshot function from test fixture (argosSnapshot)
 * @param checkName - Human-readable checkpoint name
 * @param options - Optional screenshot configuration
 *
 * @example
 * await captureViewportSnapshot(argosSnapshot, "Loading ▸ Default");
 */
export async function captureViewportSnapshot(
  snapshot: SmartUISnapshotFn,
  checkName: string,
  options?: SmartUISnapshotOptions
): Promise<void> {
  await snapshot(checkName, { fullPage: true, ...(options ?? {}) });
}
