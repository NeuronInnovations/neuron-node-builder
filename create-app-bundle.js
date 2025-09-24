const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const packageJson = require("./package.json");

const SUPPORTED_ARCHES = new Set(["x64", "arm64"]);

function getArgValue(flag, defaultValue) {
  const prefix = `--${flag}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  if (!arg) return defaultValue;
  return arg.slice(prefix.length);
}

const arch = getArgValue("arch", "x64");

if (!SUPPORTED_ARCHES.has(arch)) {
  console.error(
    `Unsupported architecture "${arch}". Supported values: ${Array.from(
      SUPPORTED_ARCHES
    ).join(", ")}`
  );
  process.exit(1);
}

const versionArg = getArgValue("version", "");
const version = versionArg || packageJson.version;

if (!version) {
  console.error(
    "Unable to determine version. Pass --version=<semver> or set package.json version."
  );
  process.exit(1);
}

const baseDirectory = path.resolve(__dirname);
const buildPath = path.join(baseDirectory, "build", "releases");
const executableName = `latest-macos-${arch}`;
const executablePath = path.join(buildPath, executableName);
const appBundleName = `neuron-node-builder-macos-${arch}-v${version}`;
const appPath = path.join(buildPath, `${appBundleName}.app`);

console.log(`Creating macOS app bundle for ${arch.toUpperCase()}...`);

if (!fs.existsSync(executablePath)) {
  console.error(`Executable not found at: ${executablePath}`);
  console.error("Please build the application first using `npm run package`.");
  process.exit(1);
}

if (fs.existsSync(appPath)) {
  fs.rmSync(appPath, { recursive: true, force: true });
}

const contentsPath = path.join(appPath, "Contents");
const macosPath = path.join(contentsPath, "MacOS");
const resourcesPath = path.join(contentsPath, "Resources");

fs.mkdirSync(macosPath, { recursive: true });
fs.mkdirSync(resourcesPath, { recursive: true });

const appExecutable = path.join(macosPath, "neuron-node-builder");
fs.copyFileSync(executablePath, appExecutable);
fs.chmodSync(appExecutable, 0o755);

const launcherScript = [
  "#!/bin/bash",
  "# Simple launcher for Neuron Node Builder",
  'cd "$(dirname "$0")"',
  'exec ./neuron-node-builder "$@"',
].join("\n");

console.log("Building menu bar app...");
try {
  execSync("./menubar/build-menubar.sh", { stdio: "inherit" });

  const menubarAppPath = path.join(
    baseDirectory,
    "menubar",
    "build",
    "NeuronNodeBuilderMenuBar.app",
    "Contents",
    "MacOS",
    "NeuronNodeBuilderMenuBar"
  );
  const menubarExecutablePath = path.join(
    macosPath,
    "NeuronNodeBuilderMenuBar"
  );

  if (fs.existsSync(menubarAppPath)) {
    fs.copyFileSync(menubarAppPath, menubarExecutablePath);
    fs.chmodSync(menubarExecutablePath, 0o755);
    console.log("✅ Menu bar app integrated successfully");
  } else {
    console.log("⚠️  Menu bar app not found, falling back to simple launcher");
    const launcherPath = path.join(macosPath, "Launcher");
    fs.writeFileSync(launcherPath, launcherScript);
    fs.chmodSync(launcherPath, 0o755);
  }
} catch (error) {
  console.log(
    "⚠️  Failed to build menu bar app, using simple launcher:",
    error.message
  );
  const launcherPath = path.join(macosPath, "Launcher");
  fs.writeFileSync(launcherPath, launcherScript);
  fs.chmodSync(launcherPath, 0o755);
}

const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>NeuronNodeBuilderMenuBar</string>
    <key>CFBundleIdentifier</key>
    <string>com.neuron.node-builder</string>
    <key>CFBundleName</key>
    <string>Neuron Node Builder</string>
    <key>CFBundleDisplayName</key>
    <string>Neuron Node Builder</string>
    <key>CFBundleVersion</key>
    <string>${version}</string>
    <key>CFBundleShortVersionString</key>
    <string>${version}</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>????</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.12</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>LSBackgroundOnly</key>
    <false/>
    <key>LSUIElement</key>
    <true/>
</dict>
</plist>`;

fs.writeFileSync(path.join(contentsPath, "Info.plist"), infoPlist);
fs.writeFileSync(path.join(contentsPath, "PkgInfo"), "APPL????");

const iconPath = path.join(baseDirectory, "public", "neuron-favicon.png");
if (fs.existsSync(iconPath)) {
  fs.copyFileSync(iconPath, path.join(resourcesPath, "AppIcon.png"));
  console.log("✅ Neuron favicon copied to app bundle");
} else {
  console.log("⚠️  Neuron favicon not found at:", iconPath);
}

const loadingFiles = [
  "loading.html",
  "loading.css",
  "loading.js",
  "neuron-favicon.png",
];
loadingFiles.forEach((fileName) => {
  const sourcePath = path.join(baseDirectory, "public", fileName);
  const destPath = path.join(resourcesPath, fileName);

  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✅ ${fileName} copied to app bundle`);
  } else {
    console.log(`⚠️  ${fileName} not found at:`, sourcePath);
  }
});

console.log(`App bundle created at: ${appPath}`);
console.log(
  `App bundle name: ${appBundleName}.app (architecture: ${arch.toUpperCase()})`
);
console.log("You can now run the signing workflow to create distributable artifacts.");
