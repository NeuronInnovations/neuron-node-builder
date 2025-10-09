import type { FullConfig } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { randomUUID } from "node:crypto";
import { verifyVisualTestEnvironment } from "./verify-environment";

const SERVER_INFO_PATH = path.resolve(
  __dirname,
  "..",
  ".output",
  "node-red-server.json"
);

const HEALTHCHECK_URL = "http://127.0.0.1:1880";
const HEALTHCHECK_TIMEOUT_MS = 60_000;
const HEALTHCHECK_INTERVAL_MS = 1_500;

function ensureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function waitForHealth(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown = undefined;
  let consecutiveSuccesses = 0;
  const REQUIRED_SUCCESSES = 3; // Require 3 consecutive successful checks

  console.log("[visual-setup] Waiting for Node-RED health...");

  while (Date.now() < deadline) {
    try {
      // Check 1: Base URL responds
      const response = await fetch(url, { method: "GET" });

      if (!response.ok) {
        consecutiveSuccesses = 0;
        lastError = new Error(
          `Health check returned status ${response.status}`
        );
        await delay(HEALTHCHECK_INTERVAL_MS);
        continue;
      }

      // Check 2: Admin API is responsive (or at least returns something)
      // Note: 404 can be OK if flows aren't deployed yet
      const flowsResponse = await fetch(`${url}/flows`, {
        method: "GET",
        headers: { Accept: "application/json" },
      }).catch(() => null);

      // Only fail if we can't reach the endpoint at all or get 500 errors
      if (flowsResponse && flowsResponse.status >= 500) {
        consecutiveSuccesses = 0;
        lastError = new Error(
          `Admin API check failed: ${flowsResponse.status}`
        );
        await delay(HEALTHCHECK_INTERVAL_MS);
        continue;
      }
      // 200, 401, 404 are all OK - server is responding
      // The base URL check above already confirms editor is accessible

      consecutiveSuccesses++;
      console.log(
        `[visual-setup] Health check passed (${consecutiveSuccesses}/${REQUIRED_SUCCESSES})`
      );

      if (consecutiveSuccesses >= REQUIRED_SUCCESSES) {
        console.log("[visual-setup] Node-RED is healthy and stable");
        return;
      }
    } catch (error) {
      consecutiveSuccesses = 0;
      lastError = error;
    }

    await delay(HEALTHCHECK_INTERVAL_MS);
  }

  const message =
    lastError instanceof Error
      ? lastError.message
      : String(lastError ?? "unknown");
  throw new Error(
    `Node-RED health check failed after ${timeoutMs}ms: ${message}`
  );
}

/**
 * Check Node-RED log for critical initialization errors
 */
async function checkForInitializationErrors(logPath: string): Promise<void> {
  if (!fs.existsSync(logPath)) {
    console.warn("[visual-setup] Log file not found yet, skipping error check");
    return;
  }

  const logContent = fs.readFileSync(logPath, "utf-8");

  // Critical error patterns that indicate fatal issues
  const criticalPatterns = [
    /Error: Cannot find module(?!.*node-red-contrib-ai-agent)/i, // Exclude ai-agent which we know about
    /EADDRINUSE/i,
    /Fatal error/i,
    /Uncaught exception/i,
    /ENOENT.*required/i,
  ];

  // Warning patterns that are OK for visual tests
  const acceptableWarnings = [
    /missing node types/i, // We handle this in tests
    /private key cannot be decoded/i, // Expected with some mock scenarios
    /node-red-contrib-ai-agent/i, // Known missing optional dependency
  ];

  const lines = logContent.split("\n");
  const errors: string[] = [];

  for (const line of lines) {
    const isCritical = criticalPatterns.some((pattern) => pattern.test(line));
    const isAcceptable = acceptableWarnings.some((pattern) =>
      pattern.test(line)
    );

    if (isCritical && !isAcceptable) {
      errors.push(line.trim());
    }
  }

  if (errors.length > 0) {
    console.error("[visual-setup] Critical initialization errors detected:");
    errors.forEach((err) => console.error(`  - ${err.substring(0, 150)}`));
    throw new Error(
      `Node-RED started with critical errors. Check ${logPath} for details.\n` +
        `First error: ${errors[0].substring(0, 200)}`
    );
  }

  console.log("[visual-setup] No critical initialization errors detected");
}

/**
 * Verify Argos CI token is configured
 * Argos requires a project token for authentication
 */
function validateArgosToken(): void {
  const argosToken = process.env.ARGOS_TOKEN;

  if (!argosToken || argosToken.trim() === "") {
    throw new Error(
      `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `❌ Argos CI Token Required\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `The ARGOS_TOKEN environment variable is not set.\n\n` +
        `Argos CI requires a project token for visual regression testing.\n\n` +
        `To fix this:\n` +
        `  1. Sign up at https://argos-ci.com (free tier: 5,000 screenshots/month)\n` +
        `  2. Create a project for "neuron-node-builder"\n` +
        `  3. Get your project token from the settings\n` +
        `  4. Add to your .env file:\n` +
        `     ARGOS_TOKEN=your-argos-project-token\n\n` +
        `  5. Then run: npm run test:visual\n\n` +
        `For local testing without Argos upload:\n` +
        `  ARGOS_UPLOAD=false npm run test:visual\n\n` +
        `Documentation: https://argos-ci.com/docs/quickstart/playwright\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
    );
  }

  console.log("[visual-setup] ✅ Argos CI token validated\n");
}

export default async function globalSetup(_config: FullConfig): Promise<void> {
  // Validate test environment first
  console.log("[visual-setup] Validating test environment...");
  const validation = await verifyVisualTestEnvironment();

  if (!validation.passed) {
    console.error("\n[visual-setup] Environment validation failed:");
    validation.errors.forEach((err) => console.error(`  ❌ ${err}`));
    throw new Error(
      "Visual test environment validation failed. Fix errors above and retry."
    );
  }

  if (validation.warnings.length > 0) {
    console.warn("\n[visual-setup] Environment warnings:");
    validation.warnings.forEach((warn) => console.warn(`  ⚠️  ${warn}`));
  }

  console.log("[visual-setup] ✅ Environment validation passed\n");

  // Validate Argos CI token when running in CI or when upload is explicitly enabled
  const isCI = process.env.CI === "true";
  const argosUploadEnabled = process.env.ARGOS_UPLOAD === "true";

  if (isCI || argosUploadEnabled) {
    console.log("[visual-setup] Validating Argos CI configuration...");
    validateArgosToken();
  } else {
    console.log(
      "[visual-setup] Argos upload disabled - snapshots will be captured locally only\n"
    );
  }

  const repoRoot = path.resolve(__dirname, "..", "..", "..");
  const visualEnvPath = path.resolve(
    repoRoot,
    "tests",
    "visual",
    "fixtures",
    "env",
    ".env.visual"
  );

  if (!fs.existsSync(visualEnvPath)) {
    throw new Error(`Visual testing env file not found at ${visualEnvPath}`);
  }

  // Point Neuron services to the fixture environment and user directories.
  process.env.NEURON_ENV_PATH = visualEnvPath;
  process.env.VISUAL_TEST_MODE = process.env.VISUAL_TEST_MODE ?? "1";

  const userHome = fs.mkdtempSync(path.join(os.tmpdir(), "neuron-visual-"));
  process.env.NEURON_USER_PATH = userHome;

  const userDir = path.join(userHome, "node_red_userdir");
  ensureDirectory(userDir);

  // Seed canonical flows.
  const workspaceSource = path.resolve(
    repoRoot,
    "tests",
    "visual",
    "fixtures",
    "workspaces",
    "visual-baseline.json"
  );
  if (!fs.existsSync(workspaceSource)) {
    throw new Error(`Workspace fixture missing at ${workspaceSource}`);
  }
  fs.copyFileSync(workspaceSource, path.join(userDir, "flows.json"));

  const flowsCredPath = path.join(userDir, "flows_cred.json");
  if (!fs.existsSync(flowsCredPath)) {
    fs.writeFileSync(flowsCredPath, "{}", "utf-8");
  }

  // Seed device fixtures used by buyer/seller editors.
  const devicesFixtureDir = path.resolve(
    repoRoot,
    "tests",
    "visual",
    "fixtures",
    "workspaces",
    "devices"
  );
  const devicesTargetDir = path.join(userDir, "devices");
  ensureDirectory(devicesTargetDir);

  if (fs.existsSync(devicesFixtureDir)) {
    const deviceFiles = fs.readdirSync(devicesFixtureDir);
    console.log(
      `[visual-setup] Copying ${deviceFiles.length} device fixture files...`
    );

    for (const entry of deviceFiles) {
      const sourcePath = path.join(devicesFixtureDir, entry);
      const targetPath = path.join(devicesTargetDir, entry);
      fs.copyFileSync(sourcePath, targetPath);
      const size = fs.statSync(targetPath).size;
      console.log(`[visual-setup]   ✓ ${entry} (${size} bytes)`);
    }

    // Verify all files were copied
    const copiedFiles = fs.readdirSync(devicesTargetDir);
    if (copiedFiles.length === 0) {
      throw new Error(
        `No device files found in ${devicesTargetDir} after copy. ` +
          `Source: ${devicesFixtureDir}`
      );
    }
    console.log(`[visual-setup] Device files verified in: ${devicesTargetDir}`);
  } else {
    console.warn(
      `[visual-setup] Device fixtures directory not found: ${devicesFixtureDir}`
    );
  }

  // Ensure SDK log folder exists as referenced by fixtures.
  const sdkLogDir = path.resolve(repoRoot, "tests", "visual", ".sdk-logs");
  ensureDirectory(sdkLogDir);

  const outputDir = path.resolve(repoRoot, "tests", "visual", ".output");
  ensureDirectory(outputDir);

  const nodePath = process.execPath;
  const nodeRedEntry = path.resolve(
    repoRoot,
    "packages",
    "node_modules",
    "node-red",
    "red.js"
  );
  const settingsPath = path.resolve(repoRoot, "neuron-settings.js");

  if (!fs.existsSync(nodeRedEntry)) {
    throw new Error(`Node-RED entrypoint not found at ${nodeRedEntry}`);
  }

  const logPath = path.join(outputDir, "node-red.log");
  const logStream = fs.createWriteStream(logPath, { flags: "a" });

  const childEnv = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV ?? "test",
    PORT: process.env.PORT ?? "1880",
    PLAYWRIGHT_VISUAL_RUN_ID: randomUUID(),
  };

  const nodeRedProcess = spawn(
    nodePath,
    [nodeRedEntry, "--settings", settingsPath],
    {
      cwd: repoRoot,
      env: childEnv,
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
    }
  );

  nodeRedProcess.stdout?.pipe(logStream);
  nodeRedProcess.stderr?.pipe(logStream);

  let startupError: Error | undefined;
  let exited = false;

  nodeRedProcess.once("exit", (code, signal) => {
    exited = true;
    const info = code !== null ? `exit code ${code}` : `signal ${signal}`;
    startupError = new Error(`Node-RED process exited prematurely (${info}).`);
  });

  try {
    await waitForHealth(`${HEALTHCHECK_URL}/`, HEALTHCHECK_TIMEOUT_MS);

    // Check for initialization errors after health check passes
    await checkForInitializationErrors(logPath);

    // Verify Node API is responding (palette will need this to load nodes)
    console.log("[visual-setup] Verifying Node API readiness...");
    const paletteCheck = await fetch(`${HEALTHCHECK_URL}/red/nodes`, {
      method: "GET",
      headers: { Accept: "application/json" },
    }).catch(() => null);

    if (paletteCheck && paletteCheck.ok) {
      console.log(
        "[visual-setup] ✅ Node API responding (palette will load)\n"
      );
    } else {
      console.warn(
        "[visual-setup] ⚠️ Node API not responding - palette may be slow to load\n"
      );
    }
  } catch (error) {
    if (!exited) {
      nodeRedProcess.kill();
    }
    throw error instanceof Error ? error : new Error(String(error));
  }

  if (startupError) {
    throw startupError;
  }

  const serverInfo = {
    pid: nodeRedProcess.pid,
    userHome,
    logPath,
  };

  fs.writeFileSync(SERVER_INFO_PATH, JSON.stringify(serverInfo, null, 2));

  nodeRedProcess.once("exit", () => {
    logStream.end();
  });
}
