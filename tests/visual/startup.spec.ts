import type { Page } from "@playwright/test";
import { test } from "./support/argos";
import {
  disableAnimations,
  fixtureUrl,
  waitForFonts,
  captureViewportSnapshot,
} from "./support/fixtures";

const loadingUrl = fixtureUrl("public", "loading.html");

const setLoadingState = async (
  page: Page,
  state: "default" | "ready" | "error"
) => {
  await page.evaluate((mode) => {
    const loadingText = document.getElementById("loadingText");
    const statusMessage = document.getElementById("statusMessage");
    const statusDetails = document.getElementById("statusDetails");
    const progressFill = document.getElementById(
      "progressFill"
    ) as HTMLElement | null;
    const spinner = document.querySelector(".spinner") as HTMLElement | null;
    const errorSection = document.getElementById(
      "errorSection"
    ) as HTMLElement | null;

    if (
      !loadingText ||
      !statusMessage ||
      !statusDetails ||
      !progressFill ||
      !spinner ||
      !errorSection
    ) {
      return;
    }

    if (mode === "default") {
      loadingText.textContent = "Starting Neuron Node Builder...";
      statusMessage.textContent = "Initializing application...";
      statusDetails.textContent =
        "Please wait while we set up your development environment.";
      progressFill.style.width = "12%";
      spinner.style.display = "block";
      errorSection.style.display = "none";
      return;
    }

    if (mode === "ready") {
      loadingText.textContent = "Redirecting to editor...";
      statusMessage.textContent = "Ready!";
      statusDetails.textContent =
        "Redirecting to Neuron Node Builder editor...";
      progressFill.style.width = "100%";
      spinner.style.display = "none";
      errorSection.style.display = "none";
      return;
    }

    loadingText.textContent = "Startup error";
    statusMessage.textContent = "Server startup is taking longer than expected";
    statusDetails.textContent =
      "This might be due to system performance or network issues.";
    progressFill.style.width = "0%";
    spinner.style.display = "none";
    errorSection.style.display = "block";
  }, state);
};

test.describe("Startup loading experience", () => {
  test("Default boot state", async ({ page, argosSnapshot }) => {
    // Block navigation before loading page
    await page.route("**/*", async (route) => {
      const url = route.request().url();
      // Block redirects to Node-RED but allow loading.html and its assets
      if (url.includes("localhost:1880") && !url.includes("loading")) {
        console.log(`[TEST] Blocked redirect to: ${url}`);
        await route.abort();
      } else {
        await route.continue();
      }
    });

    await page.goto(loadingUrl, { waitUntil: "domcontentloaded" });
    await disableAnimations(page);
    await waitForFonts(page);
    await setLoadingState(page, "default");
    await captureViewportSnapshot(argosSnapshot, "Loading ▸ Default");
  });

  test("Server ready state", async ({ page, argosSnapshot }) => {
    // Block navigation before loading page
    await page.route("**/*", async (route) => {
      const url = route.request().url();
      if (url.includes("localhost:1880") && !url.includes("loading")) {
        console.log(`[TEST] Blocked redirect to: ${url}`);
        await route.abort();
      } else {
        await route.continue();
      }
    });

    await page.goto(loadingUrl, { waitUntil: "domcontentloaded" });
    await disableAnimations(page);
    await waitForFonts(page);
    await setLoadingState(page, "ready");
    await captureViewportSnapshot(argosSnapshot, "Loading ▸ Ready");
  });

  test("Timeout + error guidance", async ({ page, argosSnapshot }) => {
    // Block navigation before loading page
    await page.route("**/*", async (route) => {
      const url = route.request().url();
      if (url.includes("localhost:1880") && !url.includes("loading")) {
        console.log(`[TEST] Blocked redirect to: ${url}`);
        await route.abort();
      } else {
        await route.continue();
      }
    });

    await page.goto(loadingUrl, { waitUntil: "domcontentloaded" });
    await disableAnimations(page);
    await waitForFonts(page);
    await setLoadingState(page, "error");
    await captureViewportSnapshot(argosSnapshot, "Loading ▸ Timeout");
  });
});
