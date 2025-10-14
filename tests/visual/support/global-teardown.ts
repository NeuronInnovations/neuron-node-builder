import fs from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const SERVER_INFO_PATH = path.resolve(
  __dirname,
  "..",
  ".output",
  "node-red-server.json"
);

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "EPERM") {
      return true;
    }
    return false;
  }
}

async function waitForExit(pid: number, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!isProcessAlive(pid)) {
      return true;
    }
    await delay(500);
  }
  return !isProcessAlive(pid);
}

async function cleanupUserHome(userHome: string): Promise<void> {
  if (!userHome) {
    return;
  }
  try {
    await fs.promises.rm(userHome, { recursive: true, force: true });
  } catch (error) {
    console.warn(`Failed to remove visual test user home ${userHome}:`, error);
  }
}

export default async function globalTeardown(): Promise<void> {
  if (!fs.existsSync(SERVER_INFO_PATH)) {
    return;
  }

  let serverInfo: { pid?: number; userHome?: string; logPath?: string } = {};
  try {
    const raw = fs.readFileSync(SERVER_INFO_PATH, "utf-8");
    serverInfo = JSON.parse(raw);
  } catch (error) {
    console.warn("Unable to parse Node-RED server info:", error);
  }

  const { pid, userHome, logPath } = serverInfo;

  if (pid && isProcessAlive(pid)) {
    try {
      process.kill(pid, process.platform === "win32" ? undefined : "SIGTERM");
      const exited = await waitForExit(pid, 10_000);
      if (!exited) {
        process.kill(pid, "SIGKILL");
      }
    } catch (error) {
      console.warn(`Failed to terminate Node-RED process ${pid}:`, error);
    }
  }

  if (logPath && fs.existsSync(logPath)) {
    try {
      fs.appendFileSync(logPath, "\n[visual-tests] Node-RED teardown complete\n");
    } catch (error) {
      console.warn("Unable to append to Node-RED log:", error);
    }
  }

  await cleanupUserHome(userHome ?? "");

  try {
    fs.unlinkSync(SERVER_INFO_PATH);
  } catch (error) {
    // Best effort cleanup; ignore.
  }
}
