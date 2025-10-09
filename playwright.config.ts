import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import path from "path";

process.env.PLAYWRIGHT_TSCONFIG = path.resolve(
  __dirname,
  "tsconfig.playwright.json"
);

// Load environment variables from repository root .env file
loadEnv({ path: path.resolve(__dirname, ".env") });

// Load Hedera test data from visual test fixtures
loadEnv({
  path: path.resolve(__dirname, "tests/visual/fixtures/env/.env.visual"),
});

const CI = process.env.CI === "true";

export default defineConfig({
  testDir: path.resolve(__dirname, "tests/visual"),
  outputDir: path.resolve(__dirname, "tests/visual/.output"),
  timeout: 90_000,
  expect: {
    timeout: 5_000,
  },
  retries: CI ? 1 : 0,
  reporter: [
    ["list"],
    [
      "html",
      {
        open: "never",
        outputFolder: path.resolve(
          __dirname,
          "tests/visual/.playwright-report"
        ),
      },
    ],
    // Argos CI reporter for visual regression testing
    // Automatically uploads screenshots to Argos for comparison
    [
      "@argos-ci/playwright/reporter",
      {
        // Only upload to Argos in CI or when explicitly enabled
        uploadToArgos: CI || process.env.ARGOS_UPLOAD === "true",

        // Project token for authentication
        token: process.env.ARGOS_TOKEN,
      },
    ],
  ],
  fullyParallel: false,
  workers: CI ? 4 : undefined,
  use: {
    viewport: { width: 1440, height: 900 },
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    ignoreHTTPSErrors: true,
    javaScriptEnabled: true,
    navigationTimeout: 30_000,
  },
  globalSetup: path.resolve(__dirname, "tests/visual/support/global-setup.ts"),
  globalTeardown: path.resolve(
    __dirname,
    "tests/visual/support/global-teardown.ts"
  ),
  projects: [
    {
      name: "chromium-mac",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        locale: "en-US",
        timezoneId: "UTC",
        colorScheme: "dark",
      },
    },
    {
      name: "chromium-win",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        locale: "en-US",
        timezoneId: "UTC",
        colorScheme: "dark",
      },
    },
  ],
});
