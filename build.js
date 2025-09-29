const fs = require("fs");
const { execSync } = require("child_process");
const axios = require("axios");
const { input } = require("@inquirer/prompts");
const chalk = require("chalk");
const path = require("path");

async function build() {
  const baseDirectory = path.dirname(__filename);

  const directories = [
    `${baseDirectory}/build/releases`,
    `${baseDirectory}/build/bin`,
    `${baseDirectory}/build/config`,
  ];

  console.log(chalk.grey(`Release directory: ${directories[0]}`));
  console.log(chalk.grey(`Downloaded binary directory: ${directories[1]}`));
  console.log(chalk.grey(`Config directory: ${directories[2]}`));

  if (!fs.existsSync(directories[0])) {
    fs.mkdirSync(directories[0], { recursive: true });
  }

  if (!fs.existsSync(directories[1])) {
    fs.mkdirSync(directories[1], { recursive: true });
  }

  if (!fs.existsSync(directories[2])) {
    fs.mkdirSync(directories[2], { recursive: true });
  }

  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (process.env.GH_BUILD_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GH_BUILD_TOKEN}`;
  }

  const defaultWrapperTag = "v0.0.1-alpha";

  async function getLatestTag() {
    const overrideTag = process.env.NEURON_WRAPPER_TAG || process.env.WRAPPER_TAG;

    if (overrideTag) {
      console.log(chalk.blue(`🔖 Using wrapper tag override: ${overrideTag}`));
      return overrideTag;
    }

    console.log(
      chalk.blue("📥 Using direct download approach to avoid rate limits")
    );
    return defaultWrapperTag;
  }

  // Check for no-prompt mode (CI environment or explicit flag)
  const isNoPromptMode =
    process.env.CI === "true" || process.argv.includes("--no-prompt");

  let tag;

  if (isNoPromptMode) {
    // In CI or no-prompt mode, automatically use the latest tag
    tag = await getLatestTag();
    console.log(chalk.blue(`CI/No-prompt mode: Using latest tag: ${tag}`));
  } else {
    // Interactive mode - prompt user for tag
    tag = await input({
      message: "Provide neuron-wrapper dependency version/tag",
      default: await getLatestTag(),
    });
  }

  console.log(chalk.blue(`Building using neuron-wrapper tag: ${tag}`));

  console.log(chalk.green.underline("Finding Assets"));

  const wrapperAssets = [
    {
      id: "macos-x64",
      bin: "neuron-wrapper-darwin64",
      candidates: [
        { name: "neuron-wrapper-darwin64" },
        { name: "neuron-wrapper-darwin64.zip", archive: "zip", expected: "neuron-wrapper-darwin64" },
        { name: "neuron-wrapper-macos-x64" },
        { name: "neuron-wrapper-macos-x64.zip", archive: "zip", expected: "neuron-wrapper-darwin64" },
      ],
    },
    {
      id: "macos-arm64",
      bin: "neuron-wrapper-darwin-arm64",
      candidates: [
        { name: "neuron-wrapper-darwin-arm64" },
        { name: "neuron-wrapper-darwin-arm64.zip", archive: "zip", expected: "neuron-wrapper-darwin-arm64" },
        { name: "neuron-wrapper-macos-arm64" },
        { name: "neuron-wrapper-macos-arm64.zip", archive: "zip", expected: "neuron-wrapper-darwin-arm64" },
        { name: "neuron-wrapper-arm64" },
        { name: "neuron-wrapper-arm64.zip", archive: "zip", expected: "neuron-wrapper-darwin-arm64" },
        { name: "neuron-wrapper-darwin-arm64.tar.gz", archive: "tar", expected: "neuron-wrapper-darwin-arm64" },
      ],
    },
    {
      id: "win-x86",
      bin: "neuron-wrapper-win32.exe",
      candidates: [
        { name: "neuron-wrapper-win32.exe" },
        { name: "neuron-wrapper-win32.zip", archive: "zip", expected: "neuron-wrapper-win32.exe" },
      ],
    },
    {
      id: "win-x64",
      bin: "neuron-wrapper-win64.exe",
      candidates: [
        { name: "neuron-wrapper-win64.exe" },
        { name: "neuron-wrapper-win64.zip", archive: "zip", expected: "neuron-wrapper-win64.exe" },
      ],
    },
  ];

  console.log(chalk.blue(`📋 Preparing to download ${wrapperAssets.length} wrapper assets`));
  console.log(chalk.green.underline("Downloading Assets"));

  const wrapperTagCandidates = Array.from(new Set([tag, defaultWrapperTag]));
  console.log(
    chalk.blue(`Wrapper tag resolution order: ${wrapperTagCandidates.join(' -> ')}`)
  );

  function findFirstFileRecursive(dir, targetName) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!targetName && entry.name.startsWith('.')) {
          continue;
        }
        const match = findFirstFileRecursive(fullPath, targetName);
        if (match) {
          return match;
        }
      } else if (!targetName || entry.name === targetName) {
        if (!targetName && entry.name.startsWith('.')) {
          continue;
        }
        return fullPath;
      }
    }
    return null;
  }

  function materializeAsset(tempFilePath, destinationPath, candidate, contextLabel) {
    const archiveType = candidate.archive;
    if (!archiveType) {
      if (fs.existsSync(destinationPath)) {
        fs.unlinkSync(destinationPath);
      }
      fs.renameSync(tempFilePath, destinationPath);
      return;
    }

    const extractDir = path.join(
      path.dirname(tempFilePath),
      `.extract-${contextLabel}-${Date.now()}`
    );
    fs.mkdirSync(extractDir, { recursive: true });

    try {
      if (archiveType === "zip") {
        execSync(`unzip -qq "${tempFilePath}" -d "${extractDir}"`);
      } else if (archiveType === "tar") {
        execSync(`tar -xzf "${tempFilePath}" -C "${extractDir}"`);
      } else {
        throw new Error(`Unsupported archive type: ${archiveType}`);
      }

      const targetName =
        candidate.inner || candidate.expected || path.basename(destinationPath);
      const extractedPath = findFirstFileRecursive(
        extractDir,
        targetName === path.basename(destinationPath) ? undefined : targetName
      );

      if (!extractedPath) {
        throw new Error(
          `Archive did not contain expected file (${targetName || 'auto-detected'})`
        );
      }

      if (fs.existsSync(destinationPath)) {
        fs.unlinkSync(destinationPath);
      }
      fs.copyFileSync(extractedPath, destinationPath);
    } finally {
      fs.rmSync(extractDir, { recursive: true, force: true });
      fs.unlinkSync(tempFilePath);
    }
  }

  async function downloadAsset(asset) {
    const binDir = directories[1];
    if (!fs.existsSync(binDir)) {
      fs.mkdirSync(binDir, { recursive: true });
    }

    const normalizedCandidates = asset.candidates.map((candidate) =>
      typeof candidate === "string" ? { name: candidate } : candidate
    );

    for (const tagCandidate of wrapperTagCandidates) {
      for (const candidate of normalizedCandidates) {
        const url = `https://github.com/NeuronInnovations/neuron-sdk-websocket-wrapper/releases/download/${tagCandidate}/${candidate.name}`;
        const safeName = candidate.name.replace(/\//g, '-');
        const tempFilePath = path.join(
          binDir,
          `${safeName}-${tagCandidate}.tmp`
        );
        const destinationPath = path.join(binDir, asset.bin);

        try {
          console.log(
            chalk.blue(
              `Downloading ${asset.id} wrapper candidate: tag=${tagCandidate}, asset=${candidate.name}`
            )
          );
          const downloadResponse = await axios.get(url, { responseType: "stream" });
          const writer = fs.createWriteStream(tempFilePath);
          downloadResponse.data.pipe(writer);

          await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
          });

          materializeAsset(
            tempFilePath,
            destinationPath,
            candidate,
            `${asset.id}-${tagCandidate}`
          );

          if (process.platform !== "win32") {
            fs.chmodSync(destinationPath, 0o755);
          }

          console.log(
            chalk.blue(
              `✅ Downloaded ${asset.id} wrapper to ${destinationPath} (tag: ${tagCandidate}, source: ${candidate.name})`
            )
          );
          return;
        } catch (error) {
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }

          const status = error.response?.status;
          if (status === 404) {
            console.log(
              chalk.yellow(
                `⚠️  Wrapper candidate ${candidate.name} not found for tag ${tagCandidate} (HTTP 404). Trying next option...`
              )
            );
            continue;
          }

          console.error(
            chalk.red(
              `Error downloading ${asset.id} wrapper from ${candidate.name} (tag ${tagCandidate}):`
            ),
            error.message
          );
          process.exit(1);
        }
      }
    }

    console.error(
      chalk.red(`❌ Failed to download ${asset.id} wrapper from any known candidate name or tag.`)
    );
    console.error(
      chalk.red(
        `   Tags tried: ${wrapperTagCandidates.join(', ')} | Candidates: ${normalizedCandidates
          .map((c) => c.name)
          .join(', ')}`
      )
    );
    process.exit(1);
  }

  for (const asset of wrapperAssets) {
    await downloadAsset(asset);
  }

  // Verify all binaries are downloaded before building
  console.log(chalk.yellow("🔍 Verifying all binaries are downloaded..."));
  const buildBinPath = path.join(baseDirectory, "build", "bin");
  const wrapperBinaryNames = wrapperAssets.map((asset) => asset.bin);
  const requiredBinaries = [...wrapperBinaryNames];

  let allBinariesExist = true;
  for (const binary of requiredBinaries) {
    const binaryPath = path.join(buildBinPath, binary);
    if (fs.existsSync(binaryPath)) {
      const stats = fs.statSync(binaryPath);
      console.log(
        chalk.green(
          `✅ ${binary} exists (${(stats.size / 1024 / 1024).toFixed(2)} MB)`
        )
      );
    } else {
      console.log(chalk.red(`❌ ${binary} missing`));
      allBinariesExist = false;
    }
  }

  if (!allBinariesExist) {
    console.error(
      chalk.red(
        "❌ Not all required binaries are downloaded. Cannot proceed with build."
      )
    );
    process.exit(1);
  }

  console.log(chalk.green("✅ All binaries verified successfully!"));

  console.log(chalk.green.underline("Building Executables"));

  async function buildExecutable(target, bin, output) {
    try {
      console.log(chalk.blue(`Building ${target}`));

      const binPath = path.join(directories[1], bin);

      if (!fs.existsSync(binPath)) {
        console.error(chalk.red(`Binary ${bin} not found`));

        process.exit(1);
      }

      const outputPath = path.join(directories[0], output);

      console.log(chalk.grey(`Using binary: ${binPath}`));
      console.log(chalk.grey(`Output: ${outputPath}`));

      const pkgConfig = {
        scripts: ["packages/node_modules/node-red/**"],
        assets: [
          "../../package.json",
          "../../neuron/**",
          "../../packages/node_modules/@node-red/**",
          "../../packages/node_modules/node-red/**",
          "../../flows.json",
          `../../build/bin/${bin}`,
          "../../neuron-settings.js",
          "../../.env.example",
          "../../node_modules/**",
          "../../public/**",
        ],
        nodeOptions: [
          "--max-old-space-size=8192",
          "--max-semi-space-size=256",
          "--gc-interval=100",
        ],
      };

      const configPath = path.join(directories[2], `pkg-${target}.json`);

      fs.writeFileSync(configPath, JSON.stringify(pkgConfig, null, 2));

      // Debug: Show what's being included in pkg
      console.log(chalk.yellow("🔍 PKG Configuration Debug:"));
      console.log(chalk.grey(`Scripts: ${pkgConfig.scripts.join(", ")}`));
      console.log(chalk.grey(`Assets count: ${pkgConfig.assets.length}`));

      // Debug: Show all assets being included
      console.log(chalk.yellow("📋 All assets being included:"));
      pkgConfig.assets.forEach((asset, index) => {
        const assetType = asset.includes("build/bin/")
          ? "🔧 BINARY"
          : asset.includes("neuron-settings.js")
          ? "⚙️  SETTINGS"
          : asset.includes("node_modules")
          ? "📦 MODULE"
          : asset.includes("neuron/")
          ? "🧠 NEURON"
          : asset.includes("public/")
          ? "🌐 PUBLIC"
          : asset.includes("flows.json")
          ? "📊 FLOWS"
          : "📄 FILE";
        console.log(chalk.blue(`  ${index + 1}. ${assetType} ${asset}`));
      });

      // Debug: Show specific important files
      console.log(chalk.yellow("🎯 Critical files check:"));
      const criticalFiles = [
        "neuron-settings.js",
        "build/bin",
        "flows.json",
        "packages/node_modules/node-red",
      ];

      criticalFiles.forEach((file) => {
        const asset = pkgConfig.assets.find((a) => a.includes(file));
        if (asset) {
          console.log(chalk.green(`  ✅ ${file} -> ${asset}`));
        } else {
          console.log(chalk.red(`  ❌ ${file} -> NOT FOUND`));
        }
      });

      console.log(chalk.grey(`Target binary for this build: ${bin}`));
      console.log(
        chalk.grey(
          `Full binary path: ${path.join(baseDirectory, "build", "bin", bin)}`
        )
      );

      // Debug: Show pkg command context
      console.log(chalk.yellow("🚀 PKG Command Context:"));
      console.log(chalk.grey(`Working directory: ${process.cwd()}`));
      console.log(chalk.grey(`Base directory: ${baseDirectory}`));
      console.log(chalk.grey(`Config path: ${configPath}`));
      console.log(chalk.grey(`Output path: ${outputPath}`));

      // Debug: Check if build/bin directory exists and what's in it
      const buildBinPath = path.join(baseDirectory, "build", "bin");
      if (fs.existsSync(buildBinPath)) {
        const binFiles = fs.readdirSync(buildBinPath);
        console.log(
          chalk.green(`✅ Build bin directory exists: ${buildBinPath}`)
        );
        console.log(chalk.grey(`Binary files found: ${binFiles.join(", ")}`));

        // Check specific binary for this target
        if (fs.existsSync(path.join(buildBinPath, bin))) {
          console.log(chalk.green(`✅ Target binary exists: ${bin}`));
          const stats = fs.statSync(path.join(buildBinPath, bin));
          console.log(
            chalk.grey(
              `Binary size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`
            )
          );
        } else {
          console.log(chalk.red(`❌ Target binary missing: ${bin}`));
        }
      } else {
        console.log(
          chalk.red(`❌ Build bin directory missing: ${buildBinPath}`)
        );
      }

      const command = `pkg --config ${configPath} -t ${target} --cjs -o ${outputPath} index.js`;

      console.log(chalk.yellow("🔧 PKG Command Details:"));
      console.log(chalk.grey(`Command: ${command}`));
      console.log(chalk.grey(`Entry point: index.js`));
      console.log(chalk.grey(`Config file: ${configPath}`));
      console.log(chalk.grey(`Target: ${target}`));
      console.log(chalk.grey(`Output: ${outputPath}`));

      // Debug: Show what pkg will see
      console.log(chalk.yellow("👀 PKG will see these paths:"));
      console.log(chalk.grey(`From entry point 'index.js', pkg will resolve:`));
      pkgConfig.assets.forEach((asset, index) => {
        if (asset.includes("../../")) {
          const resolvedPath = path.resolve(process.cwd(), asset);
          console.log(chalk.blue(`  ${asset} -> ${resolvedPath}`));
        }
      });

      console.log(chalk.grey(`Running: ${command}`));

      execSync(command);

      console.log(chalk.blue(`Built ${target}`));
    } catch (error) {
      console.error(chalk.red("Error building executable:"), error.message);

      process.exit(1);
    }
  }

  const targets = {
    "node18-win-x64": {
      bin: "neuron-wrapper-win64.exe",
      output: "latest-win-x64.exe",
    },
    "node18-macos-x64": {
      bin: "neuron-wrapper-darwin64",
      output: "latest-macos-x64",
    },
    "node18-macos-arm64": {
      bin: "neuron-wrapper-darwin-arm64",
      output: "latest-macos-arm64",
    },
  };

  for (const target of Object.keys(targets)) {
    buildExecutable(target, targets[target].bin, targets[target].output);
  }
}

build();
