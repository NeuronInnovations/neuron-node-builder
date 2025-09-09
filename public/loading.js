// Loading page JavaScript for Neuron Node Builder
class LoadingManager {
    constructor() {
        this.nodeRedUrl = 'http://localhost:1880';
        this.checkInterval = 2000; // Check every 2 seconds
        this.maxAttempts = 150; // Max 5 minutes (150 * 2 seconds)
        this.attempts = 0;
        this.startTime = Date.now();
        
        // Status messages for different phases
        this.statusMessages = [
            { phase: 'initializing', message: 'Initializing application...', details: 'Setting up the development environment.' },
            { phase: 'loading', message: 'Loading modules...', details: 'Loading Node-RED and Neuron components.' },
            { phase: 'starting', message: 'Starting server...', details: 'Launching the Node-RED server.' },
            { phase: 'connecting', message: 'Connecting to services...', details: 'Establishing connections to Neuron services.' },
            { phase: 'ready', message: 'Almost ready...', details: 'Finalizing startup process.' }
        ];
        
        this.currentPhase = 0;
        this.init();
    }
    
    init() {
        console.log('🚀 Neuron Node Builder Loading Manager initialized');
        this.updateProgress(0);
        this.startHealthCheck();
        this.startStatusRotation();
    }
    
    startStatusRotation() {
        // Rotate through status messages to show progress
        setInterval(() => {
            if (this.currentPhase < this.statusMessages.length - 1) {
                this.currentPhase++;
                this.updateStatus();
            }
        }, 10000); // Change status every 10 seconds
    }
    
    updateStatus() {
        const status = this.statusMessages[this.currentPhase];
        document.getElementById('statusMessage').textContent = status.message;
        document.getElementById('statusDetails').textContent = status.details;
    }
    
    updateProgress(percentage) {
        const progressFill = document.getElementById('progressFill');
        const loadingText = document.getElementById('loadingText');
        
        progressFill.style.width = `${percentage}%`;
        
        // Update loading text based on progress
        if (percentage < 20) {
            loadingText.textContent = 'Starting Neuron Node Builder...';
        } else if (percentage < 40) {
            loadingText.textContent = 'Loading modules...';
        } else if (percentage < 60) {
            loadingText.textContent = 'Starting server...';
        } else if (percentage < 80) {
            loadingText.textContent = 'Connecting to services...';
        } else if (percentage < 95) {
            loadingText.textContent = 'Almost ready...';
        } else {
            loadingText.textContent = 'Redirecting to editor...';
        }
    }
    
    async startHealthCheck() {
        console.log('🔍 Starting health check for Node-RED server...');
        
        const checkServer = async () => {
            this.attempts++;
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            
            // Update progress based on attempts (with some randomness for natural feel)
            const baseProgress = Math.min((this.attempts / this.maxAttempts) * 90, 90);
            const randomVariation = Math.random() * 5;
            const progress = Math.min(baseProgress + randomVariation, 90);
            this.updateProgress(progress);
            
            console.log(`🔍 Health check attempt ${this.attempts}/${this.maxAttempts} (${elapsed}s elapsed)`);
            
            try {
                const response = await fetch(this.nodeRedUrl, {
                    method: 'HEAD',
                    mode: 'no-cors', // Avoid CORS issues
                    cache: 'no-cache'
                });
                
                // If we get here without an error, the server is responding
                console.log('✅ Node-RED server is ready!');
                this.handleServerReady();
                return;
                
            } catch (error) {
                console.log(`⏳ Server not ready yet (attempt ${this.attempts}): ${error.message}`);
                
                if (this.attempts >= this.maxAttempts) {
                    console.error('❌ Timeout waiting for Node-RED server');
                    this.handleTimeout();
                    return;
                }
                
                // Continue checking
                setTimeout(checkServer, this.checkInterval);
            }
        };
        
        // Start the first check
        checkServer();
    }
    
    handleServerReady() {
        console.log('🎉 Node-RED server is ready, redirecting...');
        
        // Update UI to show success
        this.updateProgress(100);
        document.getElementById('statusMessage').textContent = 'Ready!';
        document.getElementById('statusDetails').textContent = 'Redirecting to Neuron Node Builder editor...';
        
        // Add a small delay for user to see the success state
        setTimeout(() => {
            console.log('🔄 Redirecting to Node-RED editor...');
            window.location.href = this.nodeRedUrl;
        }, 1000);
    }
    
    handleTimeout() {
        console.error('⏰ Timeout waiting for Node-RED server to start');
        
        // Show error state
        document.getElementById('loadingText').textContent = 'Startup timeout';
        document.getElementById('statusMessage').textContent = 'Server startup is taking longer than expected';
        document.getElementById('statusDetails').textContent = 'This might be due to system performance or network issues.';
        
        // Show error section
        document.getElementById('errorSection').style.display = 'block';
        document.getElementById('errorMessage').textContent = 'Startup timeout';
        document.getElementById('errorDetails').textContent = 'The Node-RED server is taking longer than expected to start. Please try restarting the application.';
        
        // Hide loading elements
        document.querySelector('.spinner').style.display = 'none';
        document.querySelector('.progress-bar').style.display = 'none';
    }
    
    handleError(error) {
        console.error('❌ Error during startup:', error);
        
        // Show error state
        document.getElementById('loadingText').textContent = 'Startup error';
        document.getElementById('statusMessage').textContent = 'An error occurred during startup';
        document.getElementById('statusDetails').textContent = 'Please check the application logs for more details.';
        
        // Show error section
        document.getElementById('errorSection').style.display = 'block';
        document.getElementById('errorMessage').textContent = 'Startup error';
        document.getElementById('errorDetails').textContent = error.message || 'An unexpected error occurred. Please try restarting the application.';
        
        // Hide loading elements
        document.querySelector('.spinner').style.display = 'none';
        document.querySelector('.progress-bar').style.display = 'none';
    }
}

// Initialize the loading manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Loading page loaded');
    
    // Add a small delay to ensure DOM is fully ready
    setTimeout(() => {
        loadLogo();
    }, 100);
    
    new LoadingManager();
});

// Load logo with fallback
function loadLogo() {
    const logo = document.getElementById('logo');
    if (!logo) {
        console.error('❌ Logo element not found!');
        return;
    }
    
    console.log('🖼️ Starting logo loading process...');
    console.log('🔍 Logo element:', logo);
    console.log('🔍 Logo element dimensions:', logo.offsetWidth, 'x', logo.offsetHeight);
    
    // Try AppIcon.png first (for app bundle), then fallback to neuron-favicon.png
    const logoPaths = ['AppIcon.png', 'neuron-favicon.png'];
    let currentIndex = 0;
    
    function tryNextLogo() {
        if (currentIndex >= logoPaths.length) {
            console.warn('⚠️ Could not load any logo image - all paths failed');
            // Set a placeholder or show error
            logo.style.border = '2px dashed #ccc';
            logo.style.backgroundColor = '#f0f0f0';
            logo.style.display = 'flex';
            logo.style.alignItems = 'center';
            logo.style.justifyContent = 'center';
            logo.style.fontSize = '12px';
            logo.style.color = '#666';
            logo.alt = 'Logo not found';
            logo.textContent = 'N';
            return;
        }
        
        const logoPath = logoPaths[currentIndex];
        console.log(`🖼️ Trying to load logo: ${logoPath}`);
        
        const img = new Image();
        img.onload = () => {
            console.log(`✅ Logo loaded successfully: ${logoPath}`);
            logo.src = logoPath;
            logo.style.border = 'none'; // Remove any error styling
            logo.style.display = 'block'; // Ensure it's visible
            logo.style.backgroundColor = '#f0f0f0'; // Add background to make it visible
        };
        img.onerror = (error) => {
            console.log(`❌ Failed to load logo: ${logoPath}`, error);
            currentIndex++;
            tryNextLogo();
        };
        img.src = logoPath;
    }
    
    tryNextLogo();
}

// Handle page visibility changes (in case user switches tabs)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('👁️ Page hidden, pausing health checks');
    } else {
        console.log('👁️ Page visible, resuming health checks');
    }
});

// Handle window focus/blur
window.addEventListener('focus', () => {
    console.log('🎯 Window focused');
});

window.addEventListener('blur', () => {
    console.log('🎯 Window blurred');
});
