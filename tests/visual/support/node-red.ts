import type { Page, Route } from "@playwright/test";
import path from "node:path";

import sellerDevice from "../fixtures/workspaces/devices/sellerNode1.json";
import buyerDevice from "../fixtures/workspaces/devices/buyerNode1.json";

const NODE_RED_BASE_URL =
  process.env.NODE_RED_BASE_URL ?? "http://127.0.0.1:1880";

type NodeHint = { type: string; name?: string };

const NODE_HINTS: Record<string, NodeHint> = {
  sellerNode1: { type: "seller config", name: "Jetvision Seller" },
  buyerNode1: { type: "buyer config", name: "Ops Control Center" },
  stdinRead1: { type: "stdin r", name: "Telemetry Input" },
  stdinWrite1: { type: "stdin w", name: "Device Reinstatement" },
  stdoutWrite1: { type: "stdout w", name: "Seller Stream" },
  stderrRead1: { type: "stderr r", name: "Diagnostics" },
  neuronP2p1: { type: "neuron-p2p", name: "Jetvision Stream" },
  neuronGpt1: { type: "neuron-gpt", name: "Builder Copilot" },
};

const sellerConnectionStatus = {
  nodeId: "sellerNode1",
  nodeType: "seller",
  isConnected: true,
  peers: [
    {
      publicKey: "302e020100300506032b657004220420b1938e6",
      connectionStatus: "connected",
      lastSeen: "Just now",
      evmAddress: "0x19AF…f9c2",
    },
    {
      publicKey: "302e020100300506032b657004220420ffee8899",
      connectionStatus: "pending",
      lastSeen: "2 min ago",
      evmAddress: "0xb18C…92aa",
    },
  ],
  lastUpdate: new Date().toISOString(),
  reconnectAttempts: 0,
  totalPeers: 2,
  connectedPeers: 1,
  disconnectedPeers: 0,
};

const buyerConnectionStatus = {
  nodeId: "buyerNode1",
  nodeType: "buyer",
  isConnected: true,
  peers: [
    {
      publicKey: "302a300506032b65700321008f9d4b",
      connectionStatus: "connected",
      lastSeen: "Just now",
      evmAddress: "0x19AF…f9c2",
    },
    {
      publicKey: "302a300506032b6570032100aa9933",
      connectionStatus: "connected",
      lastSeen: "45s ago",
      evmAddress: "0xb18C…92aa",
    },
  ],
  lastUpdate: new Date().toISOString(),
  reconnectAttempts: 0,
  totalPeers: 2,
  connectedPeers: 2,
  disconnectedPeers: 0,
};

export type ApiStubOptions = {
  sellerDeployed?: boolean;
  buyerDeployed?: boolean;
};

type Json = Record<string, unknown>;

function respondJson(route: Route, body: Json, status = 200): Promise<void> {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

function handleSellerRoute(
  route: Route,
  options: ApiStubOptions
): Promise<void> {
  const url = new URL(route.request().url());
  const pathname = url.pathname;

  if (pathname.startsWith("/seller/device-exists/")) {
    return respondJson(route, {
      success: true,
      exists: options.sellerDeployed ?? false,
    });
  }

  if (pathname.startsWith("/seller/devices/eligible")) {
    return respondJson(route, {
      success: true,
      devices: [
        {
          filename: "sellerNode1",
          role: "seller",
          deviceName: sellerDevice.deviceName,
          evmAddress: sellerDevice.evmAddress,
          nodeId: sellerDevice.nodeId,
        },
      ],
      activeNodeIds: options.sellerDeployed ? ["sellerNode1"] : [],
      count: 1,
    });
  }

  if (pathname === "/seller/devices") {
    return respondJson(route, {
      success: true,
      devices: [sellerDevice],
    });
  }

  if (pathname.startsWith("/seller/connection-status/")) {
    return respondJson(route, sellerConnectionStatus);
  }

  if (pathname.startsWith("/seller/refresh-connections/")) {
    return respondJson(route, {
      success: true,
      status: sellerConnectionStatus,
    });
  }

  if (pathname.startsWith("/seller/last-seen/")) {
    return respondJson(route, {
      success: true,
      lastSeen: "Just now",
      topic: pathname.split("/").pop(),
    });
  }

  if (pathname.startsWith("/seller/publickey-to-evm/")) {
    return respondJson(route, {
      success: true,
      evmAddress: sellerDevice.evmAddress,
    });
  }

  if (pathname.startsWith("/seller/device-info-by-evm/")) {
    return respondJson(route, {
      success: true,
      device: sellerDevice,
    });
  }

  if (pathname.startsWith("/seller/device-info/")) {
    return respondJson(route, {
      success: true,
      device: sellerDevice,
    });
  }

  return respondJson(route, { success: true });
}

function handleBuyerRoute(
  route: Route,
  options: ApiStubOptions
): Promise<void> {
  const url = new URL(route.request().url());
  const pathname = url.pathname;

  if (pathname.startsWith("/buyer/device-exists/")) {
    return respondJson(route, {
      success: true,
      exists: options.buyerDeployed ?? false,
    });
  }

  if (pathname.startsWith("/buyer/devices/eligible")) {
    return respondJson(route, {
      success: true,
      devices: [
        {
          filename: "buyerNode1",
          role: "buyer",
          deviceName: buyerDevice.deviceName,
          evmAddress: buyerDevice.evmAddress,
          nodeId: buyerDevice.nodeId,
        },
      ],
      activeNodeIds: options.buyerDeployed ? ["buyerNode1"] : [],
      count: 1,
    });
  }

  if (pathname === "/buyer/devices") {
    return respondJson(route, {
      success: true,
      devices: [buyerDevice],
    });
  }

  if (pathname.startsWith("/buyer/connection-status/")) {
    return respondJson(route, buyerConnectionStatus);
  }

  if (pathname.startsWith("/buyer/refresh-connections/")) {
    return respondJson(route, {
      success: true,
      status: buyerConnectionStatus,
    });
  }

  if (pathname.startsWith("/buyer/fetch-device-by-evm/")) {
    return respondJson(route, {
      success: true,
      device: buyerDevice,
    });
  }

  if (pathname.startsWith("/buyer/evm-to-publickey/")) {
    return respondJson(route, {
      success: true,
      publicKey: buyerDevice.publicKey,
    });
  }

  if (pathname.startsWith("/buyer/device-info/")) {
    return respondJson(route, {
      success: true,
      device: buyerDevice,
    });
  }

  if (pathname.startsWith("/buyer/last-seen/")) {
    return respondJson(route, {
      success: true,
      lastSeen: "Just now",
      topic: pathname.split("/").pop(),
    });
  }

  return respondJson(route, { success: true });
}

function handleDeviceRoute(route: Route): Promise<void> {
  const url = new URL(route.request().url());
  const filename = path.basename(url.pathname);
  if (filename === "sellerNode1" || filename === "sellerNode1.json") {
    return respondJson(route, {
      success: true,
      data: sellerDevice,
    });
  }
  if (filename === "buyerNode1" || filename === "buyerNode1.json") {
    return respondJson(route, {
      success: true,
      data: buyerDevice,
    });
  }
  if (url.pathname.includes("/device/balance")) {
    return respondJson(route, {
      success: true,
      balance: "132.442",
      unit: "ℏ",
    });
  }
  return respondJson(route, { success: true });
}

function handleNeuronRoute(route: Route): Promise<void> {
  return respondJson(route, { success: true, status: "ok" });
}

export async function registerApiStubs(
  page: Page,
  options: ApiStubOptions
): Promise<void> {
  await page.route("**/seller/**", async (route) => {
    const type = route.request().resourceType();
    if (type !== "xhr" && type !== "fetch") {
      await route.continue();
      return;
    }
    await handleSellerRoute(route, options);
  });

  await page.route("**/buyer/**", async (route) => {
    const type = route.request().resourceType();
    if (type !== "xhr" && type !== "fetch") {
      await route.continue();
      return;
    }
    await handleBuyerRoute(route, options);
  });

  await page.route("**/device/**", async (route) => {
    const type = route.request().resourceType();
    if (type !== "xhr" && type !== "fetch") {
      await route.continue();
      return;
    }
    await handleDeviceRoute(route);
  });

  await page.route("**/neuron/**", async (route) => {
    const type = route.request().resourceType();
    if (type !== "xhr" && type !== "fetch") {
      await route.continue();
      return;
    }
    await handleNeuronRoute(route);
  });

  // Set visual test mode flag BEFORE page loads to prevent health check reconnecting banners
  await page.addInitScript(() => {
    (window as any).NEURON_VISUAL_TEST_MODE = true;
  });

  // Verify Node-RED server is responding before navigation
  // This prevents race conditions in CI environments
  console.log("[node-red] Verifying server health before navigation...");
  try {
    const healthResponse = await fetch(NODE_RED_BASE_URL, {
      method: "HEAD",
      signal: AbortSignal.timeout(10_000),
    });
    if (!healthResponse.ok) {
      throw new Error(`Server responded with status ${healthResponse.status}`);
    }
    console.log("[node-red] Server health check passed");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Node-RED server health check failed: ${message}. ` +
        `Ensure the server is running at ${NODE_RED_BASE_URL}`
    );
  }

  // Navigate to Node-RED editor
  // Use 'domcontentloaded' instead of 'networkidle' because Node-RED has continuous
  // WebSocket/polling activity that prevents networkidle from ever being reached
  // Increase timeout to 45s to account for slow startup and CI overhead
  await page.goto(NODE_RED_BASE_URL, {
    waitUntil: "domcontentloaded",
    timeout: 45_000,
  });

  // Debug: Log the actual URL we landed on
  const currentUrl = page.url();
  console.log(`[node-red] Navigation completed. Current URL: ${currentUrl}`);

  // Debug: Log page title to see what page we're on
  const pageTitle = await page.title();
  console.log(`[node-red] Page title: "${pageTitle}"`);

  // CRITICAL: Detect if we're on setup page (means VISUAL_TEST_MODE didn't work)
  if (
    currentUrl.includes("/neuron/pages/setup.html") ||
    (await page
      .locator("text=/hedera.*operator/i")
      .isVisible()
      .catch(() => false))
  ) {
    console.error(
      "[node-red] ❌ LANDED ON SETUP PAGE - VISUAL_TEST_MODE NOT WORKING"
    );
    console.error("[node-red] Environment check:");
    console.error(`  - VISUAL_TEST_MODE: ${process.env.VISUAL_TEST_MODE}`);
    console.error(`  - CI: ${process.env.CI}`);

    // Capture screenshot for debugging
    await page
      .screenshot({
        path: path.join(__dirname, "..", ".output", "setup-page-redirect.png"),
        fullPage: true,
      })
      .catch(() => {
        /* ignore screenshot errors */
      });

    throw new Error(
      "Node-RED redirected to setup page instead of showing editor. " +
        "This means VISUAL_TEST_MODE environment variable is not being respected. " +
        "Check that the variable is set correctly in global-setup.ts and neuron-settings.js"
    );
  }

  // Wait for Node-RED editor to fully initialize with progressive timeout strategy
  const CI = process.env.CI === "true";
  const PALETTE_TIMEOUT = CI ? 60_000 : 20_000; // Increase CI timeout to 60s
  const SPINNER_TIMEOUT = CI ? 90_000 : 45_000; // Increase to 90s for CI
  const SCROLL_TIMEOUT = CI ? 30_000 : 15_000; // Increase to 30s for CI

  try {
    // First wait for the palette container to exist (should be immediate)
    // Increased timeout for CI environments (especially macOS runners)
    console.log(
      `[node-red] Waiting for palette (timeout: ${PALETTE_TIMEOUT}ms)...`
    );
    await page.waitForSelector("#red-ui-palette", {
      state: "attached",
      timeout: PALETTE_TIMEOUT,
    });

    // Then wait for the spinner to disappear (indicates nodes are loading)
    // In CI environments this can take longer, so use generous timeout
    console.log(
      `[node-red] Waiting for spinner to hide (timeout: ${SPINNER_TIMEOUT}ms)...`
    );
    await page.waitForSelector("#red-ui-palette > .red-ui-palette-spinner", {
      state: "hidden",
      timeout: SPINNER_TIMEOUT,
    });

    // Finally ensure the palette content is visible (nodes loaded)
    console.log(
      `[node-red] Waiting for palette content (timeout: ${SCROLL_TIMEOUT}ms)...`
    );
    await page.waitForSelector(".red-ui-palette-scroll:not(.hide)", {
      state: "visible",
      timeout: SCROLL_TIMEOUT,
    });

    console.log("[node-red] ✅ Editor palette fully initialized");
  } catch (error) {
    // Log current state for debugging
    const paletteExists = await page.locator("#red-ui-palette").count();
    const spinnerHidden = await page
      .locator("#red-ui-palette > .red-ui-palette-spinner")
      .isHidden()
      .catch(() => false);
    const scrollVisible = await page
      .locator(".red-ui-palette-scroll")
      .isVisible()
      .catch(() => false);

    console.error("[node-red] Palette initialization failed:");
    console.error(`  - Palette exists: ${paletteExists > 0}`);
    console.error(`  - Spinner hidden: ${spinnerHidden}`);
    console.error(`  - Scroll visible: ${scrollVisible}`);

    // Debug: Capture what page elements exist to understand what page we're on
    const bodyText = await page
      .locator("body")
      .textContent()
      .catch(() => "Unable to read body text");
    console.error(`[node-red] Page body text (first 500 chars):`);
    console.error(`  ${bodyText?.substring(0, 500)}`);

    // Check for common indicators
    const hasSetupForm = await page.locator('form, input[type="text"]').count();
    const hasRedUiElements = await page.locator('[class*="red-ui"]').count();
    console.error(`[node-red] Page analysis:`);
    console.error(`  - Form/input elements: ${hasSetupForm}`);
    console.error(`  - red-ui-* elements: ${hasRedUiElements}`);

    throw error;
  }
}

/**
 * Helper: Check if Node-RED server is connected and stable
 */
async function ensureServerConnection(page: Page): Promise<void> {
  // Check for reconnecting banner
  const reconnectingBanner = page.locator("text=/Reconnecting to server/i");
  const networkError = page.locator(
    "text=/Network error/i, text=/cannot reach server/i"
  );

  const isReconnecting = await reconnectingBanner
    .isVisible()
    .catch(() => false);
  const hasNetworkError = await networkError.isVisible().catch(() => false);

  if (isReconnecting || hasNetworkError) {
    throw new Error(
      "Node-RED server connection lost or unstable. " +
        "Check tests/visual/.output/node-red.log for errors. " +
        "Server may have crashed during initialization."
    );
  }

  // Verify RED object is available
  const redAvailable = await page
    .evaluate(() => {
      return !!(window as any).RED;
    })
    .catch(() => false);

  if (!redAvailable) {
    throw new Error(
      "RED object not available - Node-RED client not initialized"
    );
  }
}

/**
 * Helper: Robustly dismiss the "unknown node types" dialog
 */
async function dismissUnknownNodesDialog(page: Page): Promise<void> {
  const unknownNodesClose = page.locator(
    "div:has-text('Flows stopped due to missing node types') button:has-text('Close')"
  );

  try {
    // Wait longer for dialog to appear (increased from 1s to 3s)
    await unknownNodesClose.waitFor({ state: "visible", timeout: 3_000 });

    // Click and wait for dialog to close
    await unknownNodesClose.click();

    // Wait for dialog animation to complete
    await page.waitForTimeout(500);

    // Verify dialog is actually gone
    await unknownNodesClose.waitFor({ state: "hidden", timeout: 2_000 });
  } catch (error) {
    // Dialog not present or already dismissed - this is OK
    // Silent fail as this is expected in many cases
  }
}

export async function openNodeEditor(
  page: Page,
  nodeId: string
): Promise<void> {
  const hint = NODE_HINTS[nodeId];

  if (!hint) {
    throw new Error(`No node hint registered for ${nodeId}`);
  }

  // ENHANCEMENT 1: Check server health FIRST
  await ensureServerConnection(page);

  const workspace = page.locator("#red-ui-workspace-chart");
  await workspace.waitFor({ timeout: 15_000 });

  // ENHANCEMENT 2: Improved dialog dismissal
  await dismissUnknownNodesDialog(page);

  // ENHANCEMENT 3: Add retry logic for waitForFunction
  let attempt = 0;
  const maxAttempts = 3;
  let lastError: Error | undefined;

  while (attempt < maxAttempts) {
    try {
      await page.waitForFunction(
        ({ hint }) => {
          const red = (window as typeof window & { RED?: any }).RED;
          if (!red?.nodes?.filterNodes) {
            return false;
          }
          const candidates = red.nodes.filterNodes({ type: hint.type }) || [];

          const node = hint.name
            ? candidates.find((n: any) => n.name === hint.name)
            : candidates[0];

          if (!node) {
            return false;
          }
          (window as any).__visualTargetNodeId = node.id;
          return true;
        },
        { hint },
        { timeout: 20_000 } // Increased from 15s to 20s
      );
      break; // Success - exit retry loop
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      attempt++;

      if (attempt >= maxAttempts) {
        throw new Error(
          `Failed to find node ${hint.type}/${
            hint.name || "default"
          } after ${maxAttempts} attempts. ` +
            `Last error: ${lastError.message}`
        );
      }

      // Wait a bit before retrying
      await page.waitForTimeout(1000);

      // Re-check server connection before retry
      await ensureServerConnection(page);
    }
  }

  await page.evaluate(
    ({ hint }) => {
      const red = (window as typeof window & { RED: any }).RED;
      const candidates = red.nodes.filterNodes({ type: hint.type }) || [];

      const node = hint.name
        ? candidates.find((n: any) => n.name === hint.name)
        : candidates[0];

      if (!node) {
        throw new Error(`Node with hint ${JSON.stringify(hint)} not found`);
      }

      red.view.reveal(node.id);
      red.view.select(node.id);
      red.editor.edit(node);
    },
    { hint }
  );

  await page.waitForSelector(".red-ui-tray", { state: "visible" });
}

export async function applySellerRuntimeState(page: Page): Promise<void> {
  await page.evaluate(() => {
    const $ = (window as typeof window & { jQuery: any }).jQuery;
    $("#no-device-message").hide();
    $("#runtime-information-section").show();

    $("#node-input-evmAddress").val("0.0.482193@hedera");
    $("#node-input-publicKey").val("302e020100300506032b657004220420b1938e6");
    $("#node-input-balance").val("132.442 ℏ");
    $("#node-input-stdInTopic").val("0.0.123456-stdin");
    $("#node-input-stdOutTopic").val("0.0.123456-stdout");
    $("#node-input-stdErrTopic").val("0.0.123456-stderr");

    const peersSummary = $("#peers-summary");
    peersSummary.text("1 connected, 2 total peers");
    peersSummary.show();

    const peersTable = $("#peers-table");
    const tableBody = $("#peers-table-body");
    tableBody.empty();
    peersTable.show();
    $("#no-peers-message").hide();

    const peers = [
      {
        address: "0.0.60192@hedera",
        status: "Connected",
        lastSeen: "Now",
      },
      {
        address: "0.0.60168@hedera",
        status: "Pending",
        lastSeen: "45s ago",
      },
    ];

    peers.forEach((peer) => {
      const row = $("<tr></tr>");
      row.append(
        $("<td></td>").append(
          $('<span class="code-text"></span>').text(peer.address)
        )
      );
      row.append(
        $('<td style="text-align:center;"></td>').append(
          $('<span class="badge"></span>')
            .addClass(peer.status === "Connected" ? "success" : "warning")
            .text(peer.status)
        )
      );
      row.append($('<td style="text-align:center;"></td>').text(peer.lastSeen));
      tableBody.append(row);
    });

    $("#last-update-time").text("Just now");
  });
}

export async function applyBuyerRuntimeState(page: Page): Promise<void> {
  await page.evaluate(() => {
    const $ = (window as typeof window & { jQuery: any }).jQuery;
    $("#buyer-runtime-banner").hide();
    $("#runtime-information-section").show();

    $("#node-input-evmAddress").val("0.0.239991@hedera");
    $("#node-input-publicKey").val("302a300506032b65700321008f9d4b");
    $("#node-input-balance").val("88.100 ℏ");
    $("#node-input-stdInTopic").val("0.0.998877-stdin");
    $("#node-input-stdOutTopic").val("0.0.998877-stdout");
    $("#node-input-stdErrTopic").val("0.0.998877-stderr");

    const table = $("#devices-table");
    const body = $("#devices-table-body");
    table.show();
    body.empty();
    $("#no-devices-message").hide();

    const devices = [
      {
        address: "0x19AF…f9c2",
        status: "Connected",
        lastSeen: "Just now",
      },
      {
        address: "0xb18C…92aa",
        status: "Pending",
        lastSeen: "2 min ago",
      },
    ];

    devices.forEach((device) => {
      const row = $("<tr></tr>");
      row.append(
        $("<td></td>").append(
          $('<span class="code-text"></span>').text(device.address)
        )
      );
      row.append(
        $('<td style="text-align:center;"></td>').append(
          $('<span class="badge"></span>')
            .addClass(device.status === "Connected" ? "success" : "warning")
            .text(device.status)
        )
      );
      row.append(
        $('<td style="text-align:center;"></td>').text(device.lastSeen)
      );
      row.append(
        $('<td style="text-align:center;"></td>').append(
          $(
            '<button class="red-ui-button" style="padding:6px 10px;">Remove</button>'
          )
        )
      );
      body.append(row);
    });

    $("#device-count").text(devices.length.toString());
  });
}

export async function applyConnectionWidgetState(
  page: Page,
  state: "idle" | "loading" | "active"
): Promise<void> {
  await page.evaluate((mode) => {
    const $ = (window as typeof window & { jQuery: any }).jQuery;
    const dot = $("#status-dot");
    const text = $("#status-text");
    const loading = $("#peers-loading");
    const content = $("#peers-content");
    const noPeers = $("#no-peers-message");
    const table = $("#peers-table");
    const tbody = $("#peers-table-body");
    const summary = $("#peers-summary");

    dot.removeClass("connected connecting disconnected");

    if (mode === "idle") {
      dot.addClass("disconnected");
      text.text("Disconnected");
      loading.hide();
      content.hide();
      noPeers.show();
      table.hide();
      summary.hide();
      tbody.empty();
      $("#last-update-time").text("Never");
      return;
    }

    if (mode === "loading") {
      dot.addClass("connecting");
      text.text("Connecting…");
      loading.show();
      content.hide();
      noPeers.hide();
      table.hide();
      summary.hide();
      tbody.empty();
      $("#last-update-time").text("—");
      return;
    }

    dot.addClass("connected");
    text.text("Connected (2/3 peers)");
    loading.hide();
    content.show();
    noPeers.hide();
    table.show();
    summary.text("2 connected, 3 total peers").show();
    tbody.empty();

    const peers = [
      {
        publicKey: "302a300506032b657003210089f4…",
        status: "Connected",
        lastUpdate: "Just now",
      },
      {
        publicKey: "302a300506032b65700321009ab2…",
        status: "Connected",
        lastUpdate: "45s ago",
      },
      {
        publicKey: "302a300506032b6570032100aa23…",
        status: "Pending",
        lastUpdate: "2m ago",
      },
    ];

    peers.forEach((peer) => {
      const row = $("<tr></tr>");
      row.append(
        $("<td></td>").append(
          $('<span class="code-text"></span>').text(peer.publicKey)
        )
      );
      row.append(
        $('<td style="text-align:center;"></td>').append(
          $('<span class="badge"></span>')
            .addClass(peer.status === "Connected" ? "success" : "warning")
            .text(peer.status)
        )
      );
      row.append(
        $('<td style="text-align:center;"></td>').text(peer.lastUpdate)
      );
      tbody.append(row);
    });

    $("#last-update-time").text("Just now");
  }, state);
}

export { NODE_RED_BASE_URL };
