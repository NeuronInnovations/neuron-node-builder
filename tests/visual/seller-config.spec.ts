import { test } from "./support/argos";
import {
  disableAnimations,
  waitForFonts,
  captureViewportSnapshot,
} from "./support/fixtures";
import {
  applySellerRuntimeState,
  openNodeEditor,
  registerApiStubs,
} from "./support/node-red";

const SELLER_NODE_ID = "sellerNode1";

test.describe("Seller configuration node", () => {
  test("Configuration editor (new device)", async ({ page, argosSnapshot }) => {
    await registerApiStubs(page, { sellerDeployed: false });
    await openNodeEditor(page, SELLER_NODE_ID);
    await disableAnimations(page);
    await waitForFonts(page);
    await captureViewportSnapshot(argosSnapshot, "Seller Config ▸ Draft");
  });

  test("Runtime insights with peers", async ({ page, argosSnapshot }) => {
    await registerApiStubs(page, { sellerDeployed: true });
    await openNodeEditor(page, SELLER_NODE_ID);
    await applySellerRuntimeState(page);
    await disableAnimations(page);
    await waitForFonts(page);
    await captureViewportSnapshot(argosSnapshot, "Seller Config ▸ Runtime");
  });
});
