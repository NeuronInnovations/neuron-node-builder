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

// Build and integrate the menu bar app
console.log('Building menu bar app...');
try {
    execSync('./menubar/build-menubar.sh', { stdio: 'inherit' });
    
    // Copy the menu bar app executable
    const menubarAppPath = path.join(baseDirectory, 'menubar', 'build', 'NeuronNodeBuilderMenuBar.app', 'Contents', 'MacOS', 'NeuronNodeBuilderMenuBar');
    const menubarExecutablePath = path.join(macosPath, 'NeuronNodeBuilderMenuBar');
    
    if (fs.existsSync(menubarAppPath)) {
        fs.copyFileSync(menubarAppPath, menubarExecutablePath);
        fs.chmodSync(menubarExecutablePath, 0o755);
        console.log('✅ Menu bar app integrated successfully');
    } else {
        console.log('⚠️  Menu bar app not found, falling back to simple launcher');
        // Fallback to simple launcher
        const launcherScript = `#!/bin/bash
# Simple launcher for Neuron Node Builder
cd "$(dirname "$0")"
exec ./neuron-node-builder "$@"
`;
        const launcherPath = path.join(macosPath, 'Launcher');
        fs.writeFileSync(launcherPath, launcherScript);
        fs.chmodSync(launcherPath, 0o755);
    }
} catch (error) {
    console.log('⚠️  Failed to build menu bar app, using simple launcher:', error.message);
    // Fallback to simple launcher
    const launcherScript = `#!/bin/bash
# Simple launcher for Neuron Node Builder
cd "$(dirname "$0")"
exec ./neuron-node-builder "$@"
`;
    const launcherPath = path.join(macosPath, 'Launcher');
    fs.writeFileSync(launcherPath, launcherScript);
    fs.chmodSync(launcherPath, 0o755);
}

// Create Info.plist
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
    <string>10.15</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>LSBackgroundOnly</key>
    <false/>
    <key>LSUIElement</key>
    <true/>
</dict>
</plist>`;

fs.writeFileSync(path.join(contentsPath, 'Info.plist'), infoPlist);

// Create PkgInfo
fs.writeFileSync(path.join(contentsPath, 'PkgInfo'), 'APPL????');

// Copy icon if exists
const iconPath = path.join(baseDirectory, 'public', 'neuron-favicon.png');
if (fs.existsSync(iconPath)) {
    fs.copyFileSync(iconPath, path.join(resourcesPath, 'AppIcon.png'));
    console.log('✅ Neuron favicon copied to app bundle');
} else {
    console.log('⚠️  Neuron favicon not found at:', iconPath);
}

console.log(`App bundle created at: ${appPath}`);
console.log(`App bundle name: ${appBundleName}.app`);
console.log('You can now run `./sign-and-notarize-app.sh` to create file for distribution.');
