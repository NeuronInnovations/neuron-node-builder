/**
 * Neuron Feedback Widget Configuration
 * 
 * This file contains configuration options for the Featurebase feedback widget.
 * Modify these settings to customize the feedback widget behavior.
 */

window.NEURON_FEEDBACK_CONFIG = {
    // Featurebase organization name (REQUIRED)
    // Replace 'your-organization' with your actual Featurebase organization name
    // This should match your Featurebase subdomain (e.g., if your URL is https://myorg.featurebase.app, use 'myorg')
    organization: 'Neuron',
    
    // Optional: User email for feedback submissions
    // Can be set dynamically based on logged-in user
    email: null,
    
    // Optional: Default board for feedback submissions
    defaultBoard: null,
    
    // Theme: 'light' or 'dark' (defaults to 'dark' to match Neuron)
    theme: 'dark',
    
    // Widget placement: 'left' or 'right'
    placement: 'left',
    
    // Language/locale setting
    locale: 'en',
    
    // Enable/disable the feedback widget
    enabled: true,
    
    // Custom metadata to include with feedback submissions
    metadata: {
        application: 'Neuron Node-Pilot',
        version: '1.0.0',
        // Add any additional metadata here
    },
    
    // Custom styling options
    styling: {
        // Position adjustments (in pixels)
        bottom: 20,
        left: 20,
        
        // Custom colors (optional - will use default if not specified)
        backgroundColor: null, // e.g., '#1D1D1D'
        borderColor: null,     // e.g., '#333'
        textColor: null,       // e.g., '#ffffff'
        accentColor: null,     // e.g., '#4CAF50'
    }
};

// Helper function to get user email from authentication
function getFeedbackUserEmail() {
    try {
        // Try to get email from JWT token (if using authentication)
        const token = localStorage.getItem('chat-token');
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.email || payload.preferred_username || null;
        }
    } catch (error) {
        console.log('[FEEDBACK CONFIG] Could not extract email from token:', error.message);
    }
    
    // Fallback: return null (user will need to enter email manually)
    return null;
}

// Helper function to get application version
function getApplicationVersion() {
    // Try to get version from various sources
    if (window.NEURON_VERSION) {
        return window.NEURON_VERSION;
    }
    
    // Check package.json or other version sources
    if (window.RED && window.RED.version) {
        return window.RED.version;
    }
    
    return '1.0.0'; // Default version
}

// Auto-configure based on available data
if (window.NEURON_FEEDBACK_CONFIG) {
    // Set user email if available
    if (!window.NEURON_FEEDBACK_CONFIG.email) {
        window.NEURON_FEEDBACK_CONFIG.email = getFeedbackUserEmail();
    }
    
    // Set application version
    window.NEURON_FEEDBACK_CONFIG.metadata.version = getApplicationVersion();
    
    // Set user agent
    window.NEURON_FEEDBACK_CONFIG.metadata.userAgent = navigator.userAgent;
    
    // Set current URL
    window.NEURON_FEEDBACK_CONFIG.metadata.currentUrl = window.location.href;
}

console.log('[FEEDBACK CONFIG] Configuration loaded:', window.NEURON_FEEDBACK_CONFIG);
