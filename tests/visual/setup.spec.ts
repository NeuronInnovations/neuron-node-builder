import type { Page } from "@playwright/test";
import { test } from "./support/argos";
import {
  disableAnimations,
  waitForFonts,
  captureViewportSnapshot,
} from "./support/fixtures";
import { NODE_RED_BASE_URL } from "./support/node-red";

const setupUrl = `${NODE_RED_BASE_URL}/neuron/pages/setup.html`;

const renderStatus = async (
  page: Page,
  variant: "idle" | "success" | "error"
): Promise<void> => {
  await page.evaluate((state) => {
    const banner = document.querySelector(".notice") as HTMLElement | null;
    const status = document.getElementById("status") as HTMLElement | null;
    const loading = document.getElementById("loading") as HTMLElement | null;

    if (!status || !loading || !banner) {
      return;
    }

    const setStatus = (text: string, klass: string) => {
      status.textContent = text;
      status.className = `status ${klass}`;
      status.style.display = "block";
    };

    if (state === "idle") {
      banner.style.display = "block";
      status.style.display = "none";
      loading.style.display = "none";
      return;
    }

    if (state === "success") {
      banner.style.display = "block";
      loading.style.display = "none";
      setStatus(
        "✅ Credentials saved successfully! Redirecting to Node-RED…",
        "success"
      );
      return;
    }

    banner.style.display = "block";
    loading.style.display = "none";
    setStatus("❌ Network error: Unable to reach Hedera faucet.", "error");
  }, variant);
};

test.describe("Credentials setup flow", () => {
  test("Initial guidance", async ({ page, argosSnapshot }) => {
    await page.goto(setupUrl);
    await disableAnimations(page);
    await waitForFonts(page);
    await renderStatus(page, "idle");
    await captureViewportSnapshot(argosSnapshot, "Setup ▸ Initial");
  });

  test("Successful credential save", async ({ page, argosSnapshot }) => {
    await page.goto(setupUrl);
    await disableAnimations(page);
    await waitForFonts(page);
    await renderStatus(page, "success");
    await captureViewportSnapshot(argosSnapshot, "Setup ▸ Success");
  });

  test("Error guidance state", async ({ page, argosSnapshot }) => {
    await page.goto(setupUrl);
    await disableAnimations(page);
    await waitForFonts(page);
    await renderStatus(page, "error");
    await captureViewportSnapshot(argosSnapshot, "Setup ▸ Error");
  });
});
