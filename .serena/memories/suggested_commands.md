```bash
# Install Node.js deps
npm install

# Build Node-RED editor assets (required before running)
npx grunt build

# Start Neuron Node Builder with custom settings
npm run start

# Watch/dev builds
npm run dev

# Run Grunt test suite
npm test           # runs `grunt`

# Package standalone executable and macOS artifacts
npm run package
npm run create-app-bundle
npm run create-dmg

# Full automated build/sign workflow
npm run build-workflow

# Validate signing setup
./scripts/test-signing-setup.sh
```
