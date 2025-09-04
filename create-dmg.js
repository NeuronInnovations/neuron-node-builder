const appdmg = require('appdmg');
const path = require('path');
const fs = require('fs');

// Read version from package.json
const packageJson = require('./package.json');
const version = packageJson.version; // e.g., "4.0.10"

const baseDirectory = path.resolve(__dirname);
const distPath = path.join(baseDirectory, 'dist');
const buildPath = path.join(baseDirectory, 'build', 'releases');
const appBundleName = `neuron-node-builder-macos-x64-v${version}`;
const appPath = path.join(buildPath, `${appBundleName}.app`);
const dmgPath = path.join(distPath, `${appBundleName}.dmg`);

if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath);
}

if (!fs.existsSync(appPath)) {
    console.error(`Application bundle not found at: ${appPath}`);
    console.error('Please build the application first using `npm run package`');
    process.exit(1);
}

// Check if assets exist, use defaults if not
const iconPath = path.join(baseDirectory, 'neuron', 'theme', 'neuronLogo.png');
const backgroundPath = path.join(baseDirectory, 'assets', 'dmg-background.png');

const dmgOptions = {
    target: dmgPath,
    basepath: baseDirectory,
    specification: {
        "title": appBundleName,
        "window": {
            "size": {
                "width": 600,
                "height": 400
            }
        },
        "contents": [
            { "x": 150, "y": 150, "type": "file", "path": appPath },
            { "x": 450, "y": 150, "type": "link", "path": "/Applications" }
        ]
    }
};

// Add icon if it exists
if (fs.existsSync(iconPath)) {
    dmgOptions.specification.icon = iconPath;
}

// Add background if it exists
if (fs.existsSync(backgroundPath)) {
    dmgOptions.specification.background = backgroundPath;
}

const ee = appdmg(dmgOptions);

ee.on('progress', function (info) {
    console.log(info);
});

ee.on('finish', function () {
    console.log('DMG created successfully!');
});

ee.on('error', function (err) {
    console.error('Error creating DMG:', err);
    process.exit(1);
});
