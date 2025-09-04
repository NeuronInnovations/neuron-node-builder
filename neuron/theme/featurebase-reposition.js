(function() {
    console.log('Featurebase reposition script loaded');
    
    // Configuration
    const config = {
        position: 'left', // 'left' or 'right'
        offset: '20px',   // Distance from the edge
        checkInterval: 1000, // How often to check for elements (ms)
        maxAttempts: 30, // Maximum number of attempts to find elements
        zIndex: 10000 // High z-index to ensure it's on top
    };
    
    let attempts = 0;
    
    function repositionFeaturebase() {
        if (attempts > config.maxAttempts) {
            console.log('Stopping Featurebase reposition attempts');
            clearInterval(intervalId);
            return;
        }
        
        attempts++;
        
        // Try multiple possible selectors for Featurebase elements
        const selectors = [
            '#featurebase-frame',
            '#featurebase-button',
            '.featurebase-widget',
            '.fb-widget',
            '[class*="featurebase"]',
            '[id*="featurebase"]',
            '[class*="fb_"]',
            '[id*="fb_"]',
            'iframe[src*="featurebase"]',
            'iframe[src*="widget.featurebase"]'
        ];
        
        let foundElements = false;
        
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                foundElements = true;
                
                // Apply left positioning
                if (config.position === 'left') {
                    element.style.right = 'auto';
                    element.style.left = config.offset;
                } else {
                    element.style.left = 'auto';
                    element.style.right = config.offset;
                }
                
                // Ensure proper z-index
                element.style.zIndex = config.zIndex;
                
                // Add custom class for additional CSS targeting
                element.classList.add('neuron-repositioned');
                
                console.log('Repositioned Featurebase element:', selector);
            });
        });
        
        if (foundElements) {
            console.log('Successfully repositioned Featurebase elements');
        }
    }
    
    // Initial reposition attempt
    repositionFeaturebase();
    
    // Set up interval to catch dynamically loaded elements
    const intervalId = setInterval(repositionFeaturebase, config.checkInterval);
    
    // Also observe DOM changes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length > 0) {
                repositionFeaturebase();
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
    });
    
    // Listen for messages from Featurebase iframe (if it uses postMessage)
    window.addEventListener('message', function(event) {
        // You might need to adjust this based on Featurebase's messaging
        if (event.data && event.data.type === 'featurebase:ready') {
            repositionFeaturebase();
        }
    });
    
})();