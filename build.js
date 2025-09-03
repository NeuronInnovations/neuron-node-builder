const fs = require('fs');
const { execSync } = require('child_process');
const axios = require('axios');
const { input } = require('@inquirer/prompts');
const chalk = require('chalk');
const path = require('path');

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
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
    };
    
    if (process.env.GH_BUILD_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.GH_BUILD_TOKEN}`;
    }

    async function getLatestTag() {
        // Use direct download approach - skip GitHub API entirely
        console.log(chalk.blue('📥 Using direct download approach to avoid rate limits'));
        return 'v0.0.1-alpha';
    }

    // Check for no-prompt mode (CI environment or explicit flag)
    const isNoPromptMode = process.env.CI === 'true' || process.argv.includes('--no-prompt');
    
    let tag;

    if (isNoPromptMode) {
        // In CI or no-prompt mode, automatically use the latest tag
        tag = await getLatestTag();
        console.log(chalk.blue(`CI/No-prompt mode: Using latest tag: ${tag}`));
    } else {
        // Interactive mode - prompt user for tag
        tag = await input({
            message: 'Provide neuron-wrapper dependency version/tag',
            default: await getLatestTag(),
        });
    }

    console.log(chalk.blue(`Building using neuron-wrapper tag: ${tag}`));

    console.log(chalk.green.underline('Finding Assets'));

    async function getAssets() {
        // Use hardcoded asset list to avoid GitHub API rate limits
        console.log(chalk.blue('📋 Using hardcoded asset list for direct downloads'));
        return [
            { 
                name: 'neuron-wrapper-darwin64',
                url: `https://github.com/NeuronInnovations/neuron-sdk-websocket-wrapper/releases/download/${tag}/neuron-wrapper-darwin64`
            },
            { 
                name: 'neuron-wrapper-linux32',
                url: `https://github.com/NeuronInnovations/neuron-sdk-websocket-wrapper/releases/download/${tag}/neuron-wrapper-linux32`
            },
            { 
                name: 'neuron-wrapper-linux64',
                url: `https://github.com/NeuronInnovations/neuron-sdk-websocket-wrapper/releases/download/${tag}/neuron-wrapper-linux64`
            },
            { 
                name: 'neuron-wrapper-win32.exe',
                url: `https://github.com/NeuronInnovations/neuron-sdk-websocket-wrapper/releases/download/${tag}/neuron-wrapper-win32.exe`
            },
            { 
                name: 'neuron-wrapper-win64.exe',
                url: `https://github.com/NeuronInnovations/neuron-sdk-websocket-wrapper/releases/download/${tag}/neuron-wrapper-win64.exe`
            }
        ];
    }

    const assets = await getAssets();

    console.log(chalk.blue(`Found ${assets.length} assets`));

    console.log(chalk.green.underline('Downloading Assets'));

    async function downloadAsset(asset) {
        try {
            console.log(chalk.blue(`Downloading asset: ${asset.name}`));

            const binDir = directories[1];

            if (!fs.existsSync(binDir)) {
                fs.mkdirSync(binDir, { recursive: true });
            }

            const downloadResponse = await axios.get(asset.url, {
                responseType: 'stream',
            });

            const filePath = path.join(binDir, asset.name);
            const writer = fs.createWriteStream(filePath);

            downloadResponse.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    // Make the file executable on Unix-like systems
                    if (process.platform !== 'win32') {
                        fs.chmodSync(filePath, 0o755);
                    }
                    console.log(chalk.blue(`Downloaded ${asset.name} to ${filePath}`));
                    resolve(filePath);
                });
                writer.on('error', reject);
            });
        } catch (error) {
            console.error(chalk.red('Error downloading asset:'), error.message);

            process.exit(1);
        }
    }

    for (const asset of assets) {
        await downloadAsset(asset);
    }

    // Verify all binaries are downloaded before building
    console.log(chalk.yellow('🔍 Verifying all binaries are downloaded...'));
    const buildBinPath = path.join(baseDirectory, 'build', 'bin');
    const requiredBinaries = [
        'neuron-wrapper-darwin64',
        'neuron-wrapper-linux32', 
        'neuron-wrapper-linux64',
        'neuron-wrapper-win32.exe',
        'neuron-wrapper-win64.exe'
    ];
    
    let allBinariesExist = true;
    for (const binary of requiredBinaries) {
        const binaryPath = path.join(buildBinPath, binary);
        if (fs.existsSync(binaryPath)) {
            const stats = fs.statSync(binaryPath);
            console.log(chalk.green(`✅ ${binary} exists (${(stats.size / 1024 / 1024).toFixed(2)} MB)`));
        } else {
            console.log(chalk.red(`❌ ${binary} missing`));
            allBinariesExist = false;
        }
    }
    
    if (!allBinariesExist) {
        console.error(chalk.red('❌ Not all required binaries are downloaded. Cannot proceed with build.'));
        process.exit(1);
    }
    
    console.log(chalk.green('✅ All binaries verified successfully!'));

    console.log(chalk.green.underline('Building Executables'));

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
                scripts: [
                    "packages/node_modules/node-red/**",
                ],
                assets: [
                    "package.json",
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
                        "--gc-interval=100"
                    ],
             
            }

            const configPath = path.join(directories[2], `pkg-${target}.json`);

            fs.writeFileSync(configPath, JSON.stringify(pkgConfig, null, 2));

            // Debug: Show what's being included in pkg
            console.log(chalk.yellow('🔍 PKG Configuration Debug:'));
            console.log(chalk.grey(`Scripts: ${pkgConfig.scripts.join(', ')}`));
            console.log(chalk.grey(`Assets count: ${pkgConfig.assets.length}`));
            
            // Debug: Show all assets being included
            console.log(chalk.yellow('📋 All assets being included:'));
            pkgConfig.assets.forEach((asset, index) => {
                const assetType = asset.includes('build/bin/') ? '🔧 BINARY' :
                                asset.includes('neuron-settings.js') ? '⚙️  SETTINGS' :
                                asset.includes('node_modules') ? '📦 MODULE' :
                                asset.includes('neuron/') ? '🧠 NEURON' :
                                asset.includes('public/') ? '🌐 PUBLIC' :
                                asset.includes('flows.json') ? '📊 FLOWS' :
                                '📄 FILE';
                console.log(chalk.blue(`  ${index + 1}. ${assetType} ${asset}`));
            });
            
            // Debug: Show specific important files
            console.log(chalk.yellow('🎯 Critical files check:'));
            const criticalFiles = [
                'neuron-settings.js',
                'build/bin',
                'flows.json',
                'packages/node_modules/node-red'
            ];
            
            criticalFiles.forEach(file => {
                const asset = pkgConfig.assets.find(a => a.includes(file));
                if (asset) {
                    console.log(chalk.green(`  ✅ ${file} -> ${asset}`));
                } else {
                    console.log(chalk.red(`  ❌ ${file} -> NOT FOUND`));
                }
            });
            
            console.log(chalk.grey(`Target binary for this build: ${bin}`));
            console.log(chalk.grey(`Full binary path: ${path.join(baseDirectory, 'build', 'bin', bin)}`));
            
            // Debug: Show pkg command context
            console.log(chalk.yellow('🚀 PKG Command Context:'));
            console.log(chalk.grey(`Working directory: ${process.cwd()}`));
            console.log(chalk.grey(`Base directory: ${baseDirectory}`));
            console.log(chalk.grey(`Config path: ${configPath}`));
            console.log(chalk.grey(`Output path: ${outputPath}`));
            
            // Debug: Check if build/bin directory exists and what's in it
            const buildBinPath = path.join(baseDirectory, 'build', 'bin');
            if (fs.existsSync(buildBinPath)) {
                const binFiles = fs.readdirSync(buildBinPath);
                console.log(chalk.green(`✅ Build bin directory exists: ${buildBinPath}`));
                console.log(chalk.grey(`Binary files found: ${binFiles.join(', ')}`));
                
                // Check specific binary for this target
                if (fs.existsSync(path.join(buildBinPath, bin))) {
                    console.log(chalk.green(`✅ Target binary exists: ${bin}`));
                    const stats = fs.statSync(path.join(buildBinPath, bin));
                    console.log(chalk.grey(`Binary size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`));
                } else {
                    console.log(chalk.red(`❌ Target binary missing: ${bin}`));
                }
            } else {
                console.log(chalk.red(`❌ Build bin directory missing: ${buildBinPath}`));
            }

            const command = `pkg --config ${configPath} -t ${target} --cjs -o ${outputPath} index.js`;

            console.log(chalk.yellow('🔧 PKG Command Details:'));
            console.log(chalk.grey(`Command: ${command}`));
            console.log(chalk.grey(`Entry point: index.js`));
            console.log(chalk.grey(`Config file: ${configPath}`));
            console.log(chalk.grey(`Target: ${target}`));
            console.log(chalk.grey(`Output: ${outputPath}`));
            
            // Debug: Show what pkg will see
            console.log(chalk.yellow('👀 PKG will see these paths:'));
            console.log(chalk.grey(`From entry point 'index.js', pkg will resolve:`));
            pkgConfig.assets.forEach((asset, index) => {
                if (asset.includes('../../')) {
                    const resolvedPath = path.resolve(process.cwd(), asset);
                    console.log(chalk.blue(`  ${asset} -> ${resolvedPath}`));
                }
            });
            
            console.log(chalk.grey(`Running: ${command}`));

            execSync(command);

            console.log(chalk.blue(`Built ${target}`));
        } catch (error) {
            console.error(chalk.red('Error building executable:'), error.message);

            process.exit(1);
        }
    }

    const targets = {
        'node18-win-x64': { bin: 'neuron-wrapper-win64.exe', output: 'latest-win-x64.exe' },
        'node18-macos-x64': { bin: 'neuron-wrapper-darwin64', output: 'latest-macos-x64' },
        'node18-linux-x64': { bin: 'neuron-wrapper-linux64', output: 'latest-linux-x64' },
    };

    for (const target of Object.keys(targets)) {
        buildExecutable(target, targets[target].bin, targets[target].output);
    }
}

build();