import fs from "node:fs";
import path from "node:path";

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

export async function verifyVisualTestEnvironment(): Promise<ValidationResult> {
  const result: ValidationResult = {
    passed: true,
    errors: [],
    warnings: [],
  };

  const repoRoot = path.resolve(__dirname, "..", "..", "..");

  // Check 1: Validate .env.visual file
  const envPath = path.resolve(
    repoRoot,
    "tests",
    "visual",
    "fixtures",
    "env",
    ".env.visual"
  );

  if (!fs.existsSync(envPath)) {
    result.errors.push(`.env.visual not found at ${envPath}`);
    result.passed = false;
    return result;
  }

  const envContent = fs.readFileSync(envPath, "utf-8");

  // Validate Hedera key format
  const keyMatch = envContent.match(/HEDERA_OPERATOR_KEY=([^\n]+)/);
  if (keyMatch) {
    const key = keyMatch[1].trim();

    // Should be 96 hex characters (DER prefix + key)
    if (!/^[0-9a-fA-F]{96}$/.test(key)) {
      result.errors.push(
        `Invalid HEDERA_OPERATOR_KEY format. Expected 96 hex characters, got: ${key.substring(
          0,
          20
        )}...`
      );
      result.passed = false;
    }
  } else {
    result.errors.push("HEDERA_OPERATOR_KEY not found in .env.visual");
    result.passed = false;
  }

  // Validate Operator ID format
  const operatorIdMatch = envContent.match(/HEDERA_OPERATOR_ID=([^\n]+)/);
  if (operatorIdMatch) {
    const id = operatorIdMatch[1].trim();
    if (!/^\d+\.\d+\.\d+$/.test(id)) {
      result.warnings.push(
        `HEDERA_OPERATOR_ID format looks unusual: ${id}. Expected format: 0.0.XXXXX`
      );
    }
  }

  // Validate HEDERA_RPC URL is present
  const rpcMatch = envContent.match(/HEDERA_RPC=([^\n]+)/);
  if (!rpcMatch) {
    result.errors.push(
      "HEDERA_RPC not found in .env.visual. This is required for contract operations. " +
        "Add: HEDERA_RPC=https://testnet.hashio.io/api"
    );
    result.passed = false;
  } else {
    const rpcUrl = rpcMatch[1].trim();
    if (!rpcUrl.startsWith("http://") && !rpcUrl.startsWith("https://")) {
      result.errors.push(
        `HEDERA_RPC must be a valid HTTP(S) URL, got: ${rpcUrl}`
      );
      result.passed = false;
    }
  }

  // Check 2: Validate mock SDK binary exists and is executable
  const sdkPath = path.resolve(
    repoRoot,
    "tests",
    "visual",
    "fixtures",
    "bin",
    "neuron-sdk-mock"
  );

  if (!fs.existsSync(sdkPath)) {
    result.errors.push(`Mock SDK binary not found at ${sdkPath}`);
    result.passed = false;
  } else {
    try {
      fs.accessSync(sdkPath, fs.constants.X_OK);
    } catch {
      result.warnings.push(
        `Mock SDK binary at ${sdkPath} is not executable. Run: chmod +x ${sdkPath}`
      );
    }
  }

  // Check 3: Validate workspace fixture
  const workspacePath = path.resolve(
    repoRoot,
    "tests",
    "visual",
    "fixtures",
    "workspaces",
    "visual-baseline.json"
  );

  if (!fs.existsSync(workspacePath)) {
    result.errors.push(`Workspace fixture not found at ${workspacePath}`);
    result.passed = false;
  } else {
    try {
      const workspace = JSON.parse(fs.readFileSync(workspacePath, "utf-8"));

      // Check for problematic node types
      const nodes = workspace.filter((n: any) => n.type && n.type !== "tab");
      const nodeTypes = nodes.map((n: any) => n.type);

      // Check for neuron-gpt which should be removed
      if (nodeTypes.includes("neuron-gpt")) {
        result.errors.push(
          "Workspace still includes neuron-gpt node type which causes initialization failures. " +
            "Remove this node from visual-baseline.json"
        );
        result.passed = false;
      }

      // Validate node structure
      for (const node of nodes) {
        if (!node.id || !node.z) {
          result.warnings.push(
            `Node ${
              node.name || node.type
            } is missing required fields (id or z)`
          );
        }
      }
    } catch (error) {
      result.errors.push(`Failed to parse workspace fixture: ${error}`);
      result.passed = false;
    }
  }

  // Check 4: Verify required environment variables for Argos CI (only when enabled)
  const argosEnabled = process.env.ARGOS_UPLOAD === "true";

  if (argosEnabled) {
    const required = ["ARGOS_TOKEN"];
    const missing = required.filter(
      (key) => !process.env[key] || process.env[key] === ""
    );

    if (missing.length > 0) {
      result.errors.push(
        `Missing required environment variables: ${missing.join(", ")}. ` +
          "These are required for Argos CI visual regression. " +
          "Add ARGOS_TOKEN to GitHub secrets or set ARGOS_UPLOAD=false to skip."
      );
      result.passed = false;
    }
  }

  // Check 5: Verify output directories can be created
  const outputDir = path.resolve(repoRoot, "tests", "visual", ".output");
  const sdkLogDir = path.resolve(repoRoot, "tests", "visual", ".sdk-logs");

  for (const dir of [outputDir, sdkLogDir]) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // Test write access
      const testFile = path.join(dir, ".write-test");
      fs.writeFileSync(testFile, "test");
      fs.unlinkSync(testFile);
    } catch (error) {
      result.errors.push(`Cannot write to directory ${dir}: ${error}`);
      result.passed = false;
    }
  }

  // Check 6: Verify Node-RED entry point exists
  const nodeRedEntry = path.resolve(
    repoRoot,
    "packages",
    "node_modules",
    "node-red",
    "red.js"
  );

  if (!fs.existsSync(nodeRedEntry)) {
    result.errors.push(
      `Node-RED entry point not found at ${nodeRedEntry}. Run 'npm install' first.`
    );
    result.passed = false;
  }

  return result;
}

// CLI tool for manual verification
if (require.main === module) {
  verifyVisualTestEnvironment().then((result) => {
    console.log("\n🔍 Visual Test Environment Validation\n");
    console.log("═".repeat(50));

    if (result.errors.length > 0) {
      console.log("\n❌ ERRORS:");
      result.errors.forEach((err) => console.log(`   - ${err}`));
    }

    if (result.warnings.length > 0) {
      console.log("\n⚠️  WARNINGS:");
      result.warnings.forEach((warn) => console.log(`   - ${warn}`));
    }

    console.log("\n" + "═".repeat(50));

    if (result.passed) {
      console.log("✅ All validations passed!\n");
      process.exit(0);
    } else {
      console.log(
        "❌ Validation failed. Fix errors above before running tests.\n"
      );
      process.exit(1);
    }
  });
}
