import { test } from "./support/argos";
import {
  disableAnimations,
  waitForFonts,
  captureViewportSnapshot,
} from "./support/fixtures";
import { NODE_RED_BASE_URL } from "./support/node-red";

const mandatoryUrl = `${NODE_RED_BASE_URL}/neuron/pages/mandatory-update.html`;
const optionalUrl = `${NODE_RED_BASE_URL}/neuron/pages/optional-update.html`;

test.describe("Update gate experiences", () => {
  test("Mandatory update screen", async ({ page, argosSnapshot }) => {
    await page.goto(mandatoryUrl);
    await disableAnimations(page);
    await waitForFonts(page);
    await captureViewportSnapshot(argosSnapshot, "Update ▸ Mandatory");
  });

  test("Optional update screen", async ({ page, argosSnapshot }) => {
    await page.goto(optionalUrl);
    await disableAnimations(page);
    await waitForFonts(page);
    await captureViewportSnapshot(argosSnapshot, "Update ▸ Optional");
  });
});
