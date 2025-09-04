(function() {
    'use strict';
    
    /**
     * Neuron Feedback Widget - Featurebase Integration
     * 
     * This widget integrates the Featurebase feedback system as a floating bubble
     * in the bottom-left corner of the Neuron interface.
     * 
     * LOADING STRATEGY:
     * - Wait for RED object to be available
     * - Wait for DOM to be ready
     * - Initialize Featurebase SDK
     * - Create floating feedback bubble
     * 
     * POSITIONING:
     * - Bottom-left corner to avoid conflicts with chat widget
     * - Responsive design with proper z-index layering
     * - Matches Neuron's dark theme
     */
    
    // Get configuration from config file or use defaults
    const rawConfig = window.NEURON_FEEDBACK_CONFIG || {
        organization: 'your-organization',
        theme: 'dark',
        placement: 'left',
        email: null,
        defaultBoard: null,
        locale: 'en',
        enabled: true,
        metadata: {
            application: 'Neuron Node-Pilot',
            version: '1.0.0',
            userAgent: navigator.userAgent
        }
    };
    
    // Clean and validate configuration for Featurebase SDK
    // Start with minimal required parameters to avoid validation errors
    const FEEDBACK_CONFIG = {
        organization: rawConfig.organization,
        theme: rawConfig.theme || 'dark',
        enabled: rawConfig.enabled !== false // Default to true if not specified
    };
    
    // Don't add placement to disable the default Featurebase button
    // We'll create our own custom button instead
    // if (rawConfig.placement && (rawConfig.placement === 'left' || rawConfig.placement === 'right')) {
    //     FEEDBACK_CONFIG.placement = rawConfig.placement;
    // }
    
    if (rawConfig.email && typeof rawConfig.email === 'string' && rawConfig.email.includes('@')) {
        FEEDBACK_CONFIG.email = rawConfig.email;
    }
    
    if (rawConfig.defaultBoard && typeof rawConfig.defaultBoard === 'string') {
        FEEDBACK_CONFIG.defaultBoard = rawConfig.defaultBoard;
    }
    
    if (rawConfig.locale && typeof rawConfig.locale === 'string') {
        FEEDBACK_CONFIG.locale = rawConfig.locale;
    }
    
    // Metadata should be a simple object, not stringified
    if (rawConfig.metadata && typeof rawConfig.metadata === 'object') {
        FEEDBACK_CONFIG.metadata = rawConfig.metadata;
    }
    
    // Widget state management
    let isInitialized = false;
    let feedbackWidget = null;
    let featurebaseSDK = null;
    
    // Utility functions
    function log(message, type = 'info') {
        const prefix = '[FEEDBACK WIDGET]';
        switch(type) {
            case 'error':
                console.error(prefix, message);
                break;
            case 'warn':
                console.warn(prefix, message);
                break;
            default:
                console.log(prefix, message);
        }
    }
    
    function isFeaturebaseSDKLoaded() {
        return typeof window.Featurebase !== 'undefined';
    }
    
    function loadFeaturebaseSDK() {
        return new Promise((resolve, reject) => {
            if (isFeaturebaseSDKLoaded()) {
                log('Featurebase SDK already loaded');
                resolve();
                return;
            }
            
            log('Loading Featurebase SDK...');
            
            // Create script element for Featurebase SDK
            const script = document.createElement('script');
            script.id = 'featurebase-sdk';
            script.src = 'https://do.featurebase.app/js/sdk.js';
            script.async = true;
            
            script.onload = () => {
                log('Featurebase SDK loaded successfully');
                resolve();
            };
            
            script.onerror = (error) => {
                log('Failed to load Featurebase SDK: ' + error.message, 'error');
                reject(error);
            };
            
            // Insert script into head
            const firstScript = document.getElementsByTagName('script')[0];
            if (firstScript && firstScript.parentNode) {
                firstScript.parentNode.insertBefore(script, firstScript);
            } else {
                document.head.appendChild(script);
            }
        });
    }
    
    function createFeedbackBubble() {
        if (feedbackWidget) {
            log('Feedback widget already exists');
            return;
        }
        
        log('Creating feedback bubble...');
        
        // Create the floating feedback bubble
        feedbackWidget = document.createElement('div');
        feedbackWidget.id = 'neuron-feedback-bubble';
        feedbackWidget.innerHTML = `
            <div class="feedback-bubble-content">
                <div class="feedback-bubble-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                    </svg>
                </div>
                <span class="feedback-bubble-text">Feedback</span>
            </div>
        `;
        
        // Add click event to open feedback widget
        feedbackWidget.addEventListener('click', () => {
            if (isFeaturebaseSDKLoaded() && window.Featurebase) {
                log('Opening feedback widget...');
                // Use the correct postMessage method to open the widget
                window.postMessage({
                    target: 'FeaturebaseWidget',
                    data: { 
                        action: 'openFeedbackWidget',
                        setBoard: FEEDBACK_CONFIG.defaultBoard || null
                    }
                }, '*');
            } else {
                log('Featurebase SDK not available', 'warn');
            }
        });
        
        // Add hover effects
        feedbackWidget.addEventListener('mouseenter', () => {
            feedbackWidget.classList.add('hover');
        });
        
        feedbackWidget.addEventListener('mouseleave', () => {
            feedbackWidget.classList.remove('hover');
        });
        
        // Append to body
        document.body.appendChild(feedbackWidget);
        log('Feedback bubble created and added to DOM');
    }
    
    function initializeFeaturebaseWidget() {
        if (!isFeaturebaseSDKLoaded()) {
            log('Featurebase SDK not loaded, cannot initialize widget', 'error');
            return;
        }
        
        if (isInitialized) {
            log('Featurebase widget already initialized');
            return;
        }
        
        log('Initializing Featurebase feedback widget...');
        
        // Create a clean config for Featurebase (remove our custom properties)
        const featurebaseConfig = { ...FEEDBACK_CONFIG };
        delete featurebaseConfig.enabled; // Remove our custom enabled property
        
        log('Configuration being sent:', featurebaseConfig);
        log('Organization name:', featurebaseConfig.organization);
        log('Expected Featurebase URL: https://' + featurebaseConfig.organization + '.featurebase.app');
        
        try {
            // Initialize the feedback widget with callback
            window.Featurebase('initialize_feedback_widget', featurebaseConfig, (err, callback) => {
                if (callback?.action === 'widgetReady') {
                    log('Featurebase widget is ready');
                    isInitialized = true;
                    
                    // Create the floating bubble after widget is ready
                    createFeedbackBubble();
                } else if (err) {
                    log('Error initializing Featurebase widget: ' + err.message, 'error');
                    
                    // Try with minimal configuration as fallback
                    log('Attempting fallback initialization with minimal config...');
                    tryFallbackInitialization();
                } else {
                    // Fallback: assume it's ready if no callback
                    log('Featurebase widget initialized (no callback received)');
                    isInitialized = true;
                    createFeedbackBubble();
                }
            });
            
        } catch (error) {
            log('Failed to initialize Featurebase widget: ' + error.message, 'error');
            // Try with minimal configuration as fallback
            tryFallbackInitialization();
        }
    }
    
    function tryFallbackInitialization() {
        log('Trying fallback initialization with minimal configuration...');
        
        const minimalConfig = {
            organization: rawConfig.organization,
            theme: 'dark'
        };
        
        log('Fallback configuration:', minimalConfig);
        
        try {
            window.Featurebase('initialize_feedback_widget', minimalConfig, (err, callback) => {
                if (callback?.action === 'widgetReady') {
                    log('Featurebase widget ready with fallback config');
                    isInitialized = true;
                    createFeedbackBubble();
                } else if (err) {
                    log('Fallback initialization also failed: ' + err.message, 'error');
                } else {
                    log('Fallback initialization completed (no callback)');
                    isInitialized = true;
                    createFeedbackBubble();
                }
            });
        } catch (error) {
            log('Fallback initialization failed: ' + error.message, 'error');
        }
    }
    
    function waitForRED() {
        return new Promise((resolve) => {
            if (typeof window.RED !== 'undefined') {
                resolve();
                return;
            }
            
            const checkRED = () => {
                if (typeof window.RED !== 'undefined') {
                    resolve();
                } else {
                    setTimeout(checkRED, 100);
                }
            };
            
            checkRED();
        });
    }
    
    function waitForDOMReady() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }
    
    // Main initialization function
    async function initializeFeedbackWidget() {
        try {
            log('Starting feedback widget initialization...');
            
            // Check if widget is enabled
            if (!FEEDBACK_CONFIG.enabled) {
                log('Feedback widget is disabled in configuration');
                return;
            }
            
            // Wait for DOM to be ready
            await waitForDOMReady();
            log('DOM is ready');
            
            // Wait for RED object (Node-RED interface)
            await waitForRED();
            log('RED object is available');
            
            // Load Featurebase SDK
            await loadFeaturebaseSDK();
            
            // Initialize the widget
            initializeFeaturebaseWidget();
            
        } catch (error) {
            log('Failed to initialize feedback widget: ' + error.message, 'error');
        }
    }
    
    // Auto-initialize when script loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeFeedbackWidget);
    } else {
        initializeFeedbackWidget();
    }
    
    // Export for manual initialization if needed
    window.NeuronFeedbackWidget = {
        init: initializeFeedbackWidget,
        isInitialized: () => isInitialized,
        openWidget: () => {
            if (isFeaturebaseSDKLoaded() && window.Featurebase) {
                window.postMessage({
                    target: 'FeaturebaseWidget',
                    data: { 
                        action: 'openFeedbackWidget',
                        setBoard: FEEDBACK_CONFIG.defaultBoard || null
                    }
                }, '*');
            }
        }
    };
    
})();
