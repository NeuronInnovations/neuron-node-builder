#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('node:os');

// Resolve path to the .env file
const envPath = path.resolve(os.homedir(), '.neuron-node-builder', '.env');

// Check if the .env file exists and create if needed
if (!fs.existsSync(envPath)) {
  const envTemplate = path.resolve(__dirname, '.env.example');
  if (fs.existsSync(envTemplate)) {
    fs.copyFileSync(envTemplate, envPath);
  }
}

// Load .env file
require('dotenv').config({
  path: envPath,
});

// Construct binary map
const binaries = {
  'win32': 'neuron-wrapper-win64.exe',
  'darwin': 'neuron-wrapper-darwin64',
  'linux': 'neuron-wrapper-linux64'
};

// Resolve path to the neuron-wrapper binary
const binPath = path.resolve(__dirname, 'build', 'bin', binaries[os.platform()]);

// Check if the binary exists
if (!fs.existsSync(binPath)) {
  console.error(`Binary not found: ${binPath}`);
  process.exit(1);
}

// Resolve path to the CLI JS file inside node_modules
const cliPath = path.resolve(__dirname, 'packages', 'node_modules', 'node-red', 'red.js');

// Pass command line args through to Node-RED
const args = [
  '--settings',
  path.resolve(__dirname, 'neuron-settings.js')
];

const child = spawn(process.execPath, [cliPath, ...args], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NEURON_SDK_PATH: binPath,
    NEURON_ENV_PATH: envPath,
  }
});

child.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Node-RED process exited with code: ${code}`);
  }
});

// Open browser to localhost:1880 after a short delay to allow Node-RED to start
setTimeout(() => {
  try {
    const opener = require('opener');
    opener('http://localhost:1880');
  } catch (err) {
    // Silently fail if browser cannot be opened
  }
}, 3000); // Wait 3 seconds for Node-RED to start up
