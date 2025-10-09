import { test } from "./support/argos";
import {
  disableAnimations,
  waitForFonts,
  captureViewportSnapshot,
} from "./support/fixtures";
import {
  applyBuyerRuntimeState,
  openNodeEditor,
  registerApiStubs,
} from "./support/node-red";

const BUYER_NODE_ID = "buyerNode1";

test.describe("Buyer configuration node", () => {
  test("Initial wiring (empty sellers)", async ({ page, argosSnapshot }) => {
    await registerApiStubs(page, { buyerDeployed: false });
    await openNodeEditor(page, BUYER_NODE_ID);
    await disableAnimations(page);
    await waitForFonts(page);
    await captureViewportSnapshot(argosSnapshot, "Buyer Config ▸ Draft");
  });

  test("Configured sellers with runtime topics", async ({ page, argosSnapshot }) => {
    await registerApiStubs(page, { buyerDeployed: true });
    await openNodeEditor(page, BUYER_NODE_ID);
    await applyBuyerRuntimeState(page);
    await disableAnimations(page);
    await waitForFonts(page);
    await captureViewportSnapshot(argosSnapshot, "Buyer Config ▸ Runtime");
  });
});
