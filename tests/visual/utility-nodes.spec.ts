import { test } from "./support/argos";
import {
  disableAnimations,
  waitForFonts,
  captureViewportSnapshot,
} from "./support/fixtures";
import { openNodeEditor, registerApiStubs } from "./support/node-red";

const NODE_IDS = {
  stdinRead: "stdinRead1",
  stdinWrite: "stdinWrite1",
  stdoutWrite: "stdoutWrite1",
  stderrRead: "stderrRead1",
  neuronP2p: "neuronP2p1",
};

test.describe("Utility node editors", () => {
  test.beforeEach(async ({ page }) => {
    await registerApiStubs(page, { sellerDeployed: true, buyerDeployed: true });
  });

  test("StdIn (Read)", async ({ page, argosSnapshot }) => {
    await openNodeEditor(page, NODE_IDS.stdinRead);
    await disableAnimations(page);
    await waitForFonts(page);
    await captureViewportSnapshot(argosSnapshot, "Utility ▸ StdIn");
  });

  test("StdIn (Write)", async ({ page, argosSnapshot }) => {
    await openNodeEditor(page, NODE_IDS.stdinWrite);
    await disableAnimations(page);
    await waitForFonts(page);
    await captureViewportSnapshot(argosSnapshot, "Utility ▸ StdIn Write");
  });

  test("StdOut", async ({ page, argosSnapshot }) => {
    await openNodeEditor(page, NODE_IDS.stdoutWrite);
    await disableAnimations(page);
    await waitForFonts(page);
    await captureViewportSnapshot(argosSnapshot, "Utility ▸ StdOut");
  });

  test("StdErr", async ({ page, argosSnapshot }) => {
    await openNodeEditor(page, NODE_IDS.stderrRead);
    await disableAnimations(page);
    await waitForFonts(page);
    await captureViewportSnapshot(argosSnapshot, "Utility ▸ StdErr");
  });

  test("Neuron P2P", async ({ page, argosSnapshot }) => {
    await openNodeEditor(page, NODE_IDS.neuronP2p);
    await disableAnimations(page);
    await waitForFonts(page);
    await captureViewportSnapshot(argosSnapshot, "Utility ▸ Neuron P2P");
  });
});
