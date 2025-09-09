#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

class LoadingServer {
    constructor(port = 1881) {
        this.port = port;
        this.server = null;
        this.basePath = null;
        this.version = null;
    }

    findLoadingFiles() {
        // Try multiple possible paths for the loading files
        const possiblePaths = [
            path.resolve(__dirname, 'public'),
            path.resolve(process.cwd(), 'public'),
            path.resolve(__dirname, '..', 'public'),
            path.resolve(__dirname, '..', '..', 'public')
        ];

        for (const testPath of possiblePaths) {
            const loadingHtml = path.join(testPath, 'loading.html');
            if (fs.existsSync(loadingHtml)) {
                this.basePath = testPath;
                console.log(`✅ Found loading files at: ${this.basePath}`);
                return true;
            }
        }

        console.log('❌ Loading files not found in any tested paths');
        return false;
    }

    loadVersion() {
        // Try multiple possible paths for package.json
        const possiblePaths = [
            path.resolve(__dirname, 'package.json'),
            path.resolve(process.cwd(), 'package.json'),
            path.resolve(__dirname, '..', 'package.json'),
            path.resolve(__dirname, '..', '..', 'package.json')
        ];

        for (const packagePath of possiblePaths) {
            if (fs.existsSync(packagePath)) {
                try {
                    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                    this.version = packageJson.version || '1.0.0';
                    console.log(`✅ Found version: ${this.version} from ${packagePath}`);
                    return true;
                } catch (error) {
                    console.log(`⚠️ Error reading package.json at ${packagePath}: ${error.message}`);
                }
            }
        }

        console.log('⚠️ Could not find package.json, using default version');
        this.version = '1.0.0';
        return false;
    }

    getMimeType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml'
        };
        return mimeTypes[ext] || 'text/plain';
    }

    start() {
        if (!this.findLoadingFiles()) {
            console.log('❌ Cannot start loading server - files not found');
            return false;
        }

        // Load version from package.json
        this.loadVersion();

        this.server = http.createServer((req, res) => {
            const parsedUrl = url.parse(req.url, true);
            let filePath = parsedUrl.pathname;

            // Default to loading.html for root path
            if (filePath === '/') {
                filePath = '/loading.html';
            }

            // Remove leading slash and resolve path
            const safePath = path.normalize(filePath.replace(/^\/+/, ''));
            const fullPath = path.join(this.basePath, safePath);

            // Security check - ensure file is within base path
            if (!fullPath.startsWith(this.basePath)) {
                res.writeHead(403, { 'Content-Type': 'text/plain' });
                res.end('Forbidden');
                return;
            }

            // Check if file exists
            if (!fs.existsSync(fullPath)) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('File not found');
                return;
            }

            // Read and serve file
            try {
                let content = fs.readFileSync(fullPath, 'utf8');
                const mimeType = this.getMimeType(fullPath);
                
                // Inject version into HTML files
                if (mimeType === 'text/html' && this.version) {
                    content = content.replace(/v\d+\.\d+\.\d+/g, `v${this.version}`);
                    console.log(`📝 Injected version ${this.version} into HTML`);
                }
                
                res.writeHead(200, { 
                    'Content-Type': mimeType,
                    'Cache-Control': 'no-cache'
                });
                res.end(content);
            } catch (error) {
                console.error(`Error serving file ${filePath}:`, error.message);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            }
        });

        this.server.listen(this.port, '127.0.0.1', () => {
            console.log(`🌐 Loading server started on http://127.0.0.1:${this.port}`);
            console.log(`📁 Serving files from: ${this.basePath}`);
        });

        return true;
    }

    stop() {
        if (this.server) {
            this.server.close();
            console.log('🛑 Loading server stopped');
        }
    }

    getUrl() {
        return `http://127.0.0.1:${this.port}`;
    }
}

// Export for use in other modules
module.exports = LoadingServer;

// If run directly, start the server
if (require.main === module) {
    const server = new LoadingServer();
    if (server.start()) {
        console.log('Loading server is running. Press Ctrl+C to stop.');
        
        // Graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down loading server...');
            server.stop();
            process.exit(0);
        });
    } else {
        process.exit(1);
    }
}
