const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read version from package.json
const packageJson = require('./package.json');
const version = packageJson.version; // e.g., "4.0.10"

const baseDirectory = path.resolve(__dirname);
const buildPath = path.join(baseDirectory, 'build', 'releases');
const executablePath = path.join(buildPath, 'latest-macos-x64');
const appBundleName = `neuron-node-builder-macos-x64-v${version}`;
const appPath = path.join(buildPath, `${appBundleName}.app`);

console.log('Creating macOS app bundle...');

// Check if executable exists
if (!fs.existsSync(executablePath)) {
    console.error(`Executable not found at: ${executablePath}`);
    console.error('Please build the application first using `npm run package`');
    process.exit(1);
}

// Create app bundle structure
const contentsPath = path.join(appPath, 'Contents');
const macosPath = path.join(contentsPath, 'MacOS');
const resourcesPath = path.join(contentsPath, 'Resources');

fs.mkdirSync(macosPath, { recursive: true });
fs.mkdirSync(resourcesPath, { recursive: true });

// Copy executable
const appExecutable = path.join(macosPath, 'neuron-node-builder');
fs.copyFileSync(executablePath, appExecutable);
fs.chmodSync(appExecutable, 0o755);

// Create Info.plist
const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>neuron-node-builder</string>
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
    <string>10.15</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>LSBackgroundOnly</key>
    <false/>
    <key>LSUIElement</key>
    <false/>
</dict>
</plist>`;

fs.writeFileSync(path.join(contentsPath, 'Info.plist'), infoPlist);

// Create PkgInfo
fs.writeFileSync(path.join(contentsPath, 'PkgInfo'), 'APPL????');

// Copy icon if exists
const iconPath = path.join(baseDirectory, 'neuron', 'theme', 'neuronLogo.png');
if (fs.existsSync(iconPath)) {
    fs.copyFileSync(iconPath, path.join(resourcesPath, 'AppIcon.png'));
}

console.log(`App bundle created at: ${appPath}`);
console.log(`App bundle name: ${appBundleName}.app`);
console.log('You can now run `npm run create-dmg` to create the DMG file.');
