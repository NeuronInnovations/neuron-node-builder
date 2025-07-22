#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

class NodeBuildInstaller {
    constructor() {
        this.projectRoot = process.cwd();
        this.buildDir = path.join(this.projectRoot, 'dist');
        this.srcDir = path.join(this.projectRoot, 'src');
        this.packageJson = this.loadPackageJson();
    }

    loadPackageJson() {
        try {
            const packagePath = path.join(this.projectRoot, 'package.json');
            return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        } catch (error) {
            console.error(chalk.red('Error loading package.json:'), error.message);
            process.exit(1);
        }
    }

    log(message, type = 'info') {
        const colors = {
            info: chalk.blue,
            success: chalk.green,
            warning: chalk.yellow,
            error: chalk.red
        };
        console.log(colors[type](`[${type.toUpperCase()}] ${message}`));
    }

    async clean() {
        this.log('Cleaning build directory...');
        if (fs.existsSync(this.buildDir)) {
            fs.rmSync(this.buildDir, { recursive: true, force: true });
        }
        fs.mkdirSync(this.buildDir, { recursive: true });
        this.log('Build directory cleaned', 'success');
    }

    async installDependencies() {
        this.log('Installing dependencies...');
        try {
            execSync('npm ci', { stdio: 'inherit', cwd: this.projectRoot });
            this.log('Dependencies installed successfully', 'success');
        } catch (error) {
            this.log('Failed to install dependencies', 'error');
            throw error;
        }
    }

    async runTests() {
        this.log('Running tests...');
        try {
            execSync('npm test', { stdio: 'inherit', cwd: this.projectRoot });
            this.log('All tests passed', 'success');
        } catch (error) {
            this.log('Tests failed', 'error');
            throw error;
        }
    }

    async build() {
        this.log('Building project...');
        
        // Copy source files
        if (fs.existsSync(this.srcDir)) {
            this.copyDirectory(this.srcDir, path.join(this.buildDir, 'src'));
        }

        // Copy package.json and other essential files
        const filesToCopy = ['package.json', 'README.md', 'LICENSE'];
        filesToCopy.forEach(file => {
            const srcPath = path.join(this.projectRoot, file);
            const destPath = path.join(this.buildDir, file);
            if (fs.existsSync(srcPath)) {
                fs.copyFileSync(srcPath, destPath);
            }
        });

        this.log('Project built successfully', 'success');
    }

    copyDirectory(src, dest) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }

        const entries = fs.readdirSync(src, { withFileTypes: true });
        
        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            
            if (entry.isDirectory()) {
                this.copyDirectory(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }

    async createInstaller() {
        this.log('Creating installer package...');
        
        const installerScript = `#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Installing ${this.packageJson.name} v${this.packageJson.version}...');

// Installation logic here
try {
    // Install dependencies
    execSync('npm install --production', { stdio: 'inherit' });
    console.log('Installation completed successfully!');
} catch (error) {
    console.error('Installation failed:', error.message);
    process.exit(1);
}
`;

        fs.writeFileSync(path.join(this.buildDir, 'install.js'), installerScript);
        
        // Make installer executable on Unix systems
        if (process.platform !== 'win32') {
            fs.chmodSync(path.join(this.buildDir, 'install.js'), '755');
        }

        this.log('Installer created successfully', 'success');
    }

    async package() {
        this.log('Creating distribution package...');
        
        const packageName = `${this.packageJson.name}-${this.packageJson.version}.tar.gz`;
        const packagePath = path.join(this.projectRoot, packageName);
        
        try {
            // Create tarball
            execSync(`tar -czf "${packagePath}" -C "${this.buildDir}" .`, { stdio: 'inherit' });
            this.log(`Package created: ${packageName}`, 'success');
        } catch (error) {
            this.log('Failed to create package', 'error');
            throw error;
        }
    }

    async run(tasks = ['clean', 'install', 'test', 'build', 'installer', 'package']) {
        const startTime = Date.now();
        this.log(`Starting build process for ${this.packageJson.name} v${this.packageJson.version}`);
        
        try {
            for (const task of tasks) {
                switch (task) {
                    case 'clean':
                        await this.clean();
                        break;
                    case 'install':
                        await this.installDependencies();
                        break;
                    case 'test':
                        await this.runTests();
                        break;
                    case 'build':
                        await this.build();
                        break;
                    case 'installer':
                        await this.createInstaller();
                        break;
                    case 'package':
                        await this.package();
                        break;
                    default:
                        this.log(`Unknown task: ${task}`, 'warning');
                }
            }
            
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            this.log(`Build completed successfully in ${duration}s`, 'success');
            
        } catch (error) {
            this.log(`Build failed: ${error.message}`, 'error');
            process.exit(1);
        }
    }
}

// CLI handling
if (require.main === module) {
    const args = process.argv.slice(2);
    const builder = new NodeBuildInstaller();
    
    if (args.length === 0) {
        builder.run();
    } else {
        builder.run(args);
    }
}

module.exports = NodeBuildInstaller;