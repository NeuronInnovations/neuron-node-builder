#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('node:os');

// Resolve path to the .env file
const envPath = path.resolve(os.homedir(), '.neuron-node-builder', '.env');

console.log(`Using .env file: ${envPath}`);

// Check if the .env file exists
if (fs.existsSync(envPath)) {
  console.log('Env path exists');
} else {
  console.log('Env path does not exist');

  const envTemplate = path.resolve(__dirname, '.env.example');
  fs.copyFileSync(envTemplate, envPath);
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


console.log(`Using binary for ${os.platform()}: ${binaries[os.platform()]}`);

// DEBUG: Show current working directory and __dirname
console.log('🔍 Debug Info:');
console.log(`Current working directory: ${process.cwd()}`);
console.log(`__dirname: ${__dirname}`);

// DEBUG: List all files and directories under /snapshot/neuron-green
const snapshotPath = '/snapshot/neuron-green';
console.log(`\n📁 Snapshot directory structure:`);
if (fs.existsSync(snapshotPath)) {
  try {
    const listDirectory = (dir, indent = '') => {
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);
        const type = stats.isDirectory() ? '📁' : '📄';
        const size = stats.isFile() ? ` (${(stats.size / 1024).toFixed(1)} KB)` : '';
        console.log(`${indent}${type} ${item}${size}`);
        
        // Recursively list subdirectories (limit depth to avoid overwhelming output)
        if (stats.isDirectory() && indent.length < 6) {
          try {
            listDirectory(fullPath, indent + '  ');
          } catch (err) {
            console.log(`${indent}  ❌ Error reading subdirectory: ${err.message}`);
          }
        }
      });
    };
    
    listDirectory(snapshotPath);
  } catch (err) {
    console.log(`❌ Error listing snapshot directory: ${err.message}`);
  }
} else {
  console.log(`❌ Snapshot directory not found: ${snapshotPath}`);
}

// DEBUG: Check specific paths we're interested in
const pathsToCheck = [
  '/snapshot/neuron-green/build/bin',
  '/snapshot/neuron-green/bin',
  '/snapshot/neuron-green/build',
  '/snapshot/neuron-green'
];

console.log(`\n🔍 Checking specific paths:`);
pathsToCheck.forEach(checkPath => {
  if (fs.existsSync(checkPath)) {
    try {
      const items = fs.readdirSync(checkPath);
      console.log(`✅ ${checkPath} exists with ${items.length} items: ${items.slice(0, 10).join(', ')}${items.length > 10 ? '...' : ''}`);
    } catch (err) {
      console.log(`⚠️ ${checkPath} exists but cannot read: ${err.message}`);
    }
  } else {
    console.log(`❌ ${checkPath} does not exist`);
  }
});

// Resolve path to the neuron-wrapper binary
const binPath = path.resolve(__dirname, 'build', 'bin', binaries[os.platform()]);

console.log(`\n🔍 Binary path resolution:`);
console.log(`Using neuron-wrapper binary: ${binPath}`);

// Check if the binary exists
if (fs.existsSync(binPath)) {
  console.log('✅ Binary path exists');
} else {
  console.log('❌ Binary path does not exist');
  console.log('Binary path attempted:', binPath);
  
  // Try to find the binary in other locations
  console.log('\n🔍 Searching for binary in other locations...');
  const searchPaths = [
    path.join(__dirname, 'build', 'bin'),
    path.join(__dirname, 'bin'),
    path.join(__dirname, '..', 'build', 'bin'),
    path.join(__dirname, '..', 'bin'),
    '/snapshot/neuron-green/build/bin',
    '/snapshot/neuron-green/bin'
  ];
  
  searchPaths.forEach(searchPath => {
    if (fs.existsSync(searchPath)) {
      try {
        const items = fs.readdirSync(searchPath);
        console.log(`📁 ${searchPath}: ${items.join(', ')}`);
      } catch (err) {
        console.log(`⚠️ ${searchPath}: Error reading - ${err.message}`);
      }
    } else {
      console.log(`❌ ${searchPath}: Does not exist`);
    }
  });
  
  process.exit(1);
}

// Resolve path to the CLI JS file inside node_modules
const cliPath = path.resolve(__dirname, 'packages', 'node_modules', 'node-red', 'red.js');

// Pass command line args through to Node-RED
// const args = process.argv.slice(2);
const args = [
  '--settings',
  path.resolve(__dirname, 'neuron-settings.js')
];

console.log(process.execPath, cliPath, args);

fs.readdir(__dirname, (err, files) => {
  files.forEach(file => {
    // will also include directory names
    console.log(file);
  });
});

const child = spawn(process.execPath, [cliPath, ...args], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NEURON_SDK_PATH: binPath,
    NEURON_ENV_PATH: envPath,
  }
});

child.on('exit', (code) => {
  console.log('Process Exited', code);
});

// Open browser to localhost:1880 after a short delay to allow Node-RED to start
setTimeout(() => {
  try {
    const opener = require('opener');
    opener('http://localhost:1880');
  } catch (err) {
    console.log('Could not open browser:', err.message);
  }
}, 3000); // Wait 3 seconds for Node-RED to start up
