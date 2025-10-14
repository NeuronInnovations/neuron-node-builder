import { test } from "./support/argos";
import {
  disableAnimations,
  waitForFonts,
  captureViewportSnapshot,
} from "./support/fixtures";
import {
  applyConnectionWidgetState,
  openNodeEditor,
  registerApiStubs,
} from "./support/node-red";

const SELLER_NODE_ID = "sellerNode1";

async function focusConnectionWidget(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    const element = document.getElementById("connected-peers-container");
    if (element) {
      element.scrollIntoView({ block: "center", behavior: "instant" });
    }
  });
}

test.describe("Connection status widget", () => {
  test("Idle state", async ({ page, argosSnapshot }) => {
    await registerApiStubs(page, { sellerDeployed: false });
    await openNodeEditor(page, SELLER_NODE_ID);
    await applyConnectionWidgetState(page, "idle");
    await focusConnectionWidget(page);
    await disableAnimations(page);
    await waitForFonts(page);
    await captureViewportSnapshot(argosSnapshot, "Connection ▸ Idle");
  });

  test("Connecting telemetry", async ({ page, argosSnapshot }) => {
    await registerApiStubs(page, { sellerDeployed: true });
    await openNodeEditor(page, SELLER_NODE_ID);
    await applyConnectionWidgetState(page, "loading");
    await focusConnectionWidget(page);
    await disableAnimations(page);
    await waitForFonts(page);
    await captureViewportSnapshot(argosSnapshot, "Connection ▸ Connecting");
  });

  test("Active peer table", async ({ page, argosSnapshot }) => {
    await registerApiStubs(page, { sellerDeployed: true });
    await openNodeEditor(page, SELLER_NODE_ID);
    await applyConnectionWidgetState(page, "active");
    await focusConnectionWidget(page);
    await disableAnimations(page);
    await waitForFonts(page);
    await captureViewportSnapshot(argosSnapshot, "Connection ▸ Active");
  });
});
