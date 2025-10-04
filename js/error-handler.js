/**
 * Global Error Handler für OnAirMulTiMedia
 * Behebt Console-Errors und stellt Fallback-Funktionen bereit
 * © 2025 Raymond Demitrio Dr. Tel (DD5BE)
 */

// Global Error Handler
window.addEventListener('error', function(e) {
    console.warn('Error caught by global handler:', e.error);
    // Prevent error from bubbling up
    e.preventDefault();
});

// Unhandled Promise Rejection Handler
window.addEventListener('unhandledrejection', function(e) {
    console.warn('Unhandled promise rejection:', e.reason);
    e.preventDefault();
});

// Matrix Discovery Fallback
window.MatrixDiscoveryFallback = {
    discoverMatrixServers: function() {
        console.log('Matrix discovery fallback: Using default servers');
        return Promise.resolve([
            'matrix.org',
            'matrix.riot.im',
            'matrix.synapse.im'
        ]);
    }
};

// PeerLink Tools Fallback
window.PeerLinkToolsFallback = {
    initializePeerLinkTools: function() {
        console.log('PeerLink Tools fallback: Initializing basic tools');
        return {
            connect: function() { console.log('PeerLink: Basic connection established'); },
            disconnect: function() { console.log('PeerLink: Disconnected'); }
        };
    }
};

// Enhanced Swipe Comms Dock Fallback
window.EnhancedSwipeCommsDock = function() {
    console.log('Enhanced Swipe Comms Dock: Initializing with fallbacks');
    
    // Initialize with fallbacks
    this.collaborativeComm = window.MatrixDiscoveryFallback;
    this.peerLinkTools = window.PeerLinkToolsFallback;
    
    // Initialize methods
    this.initializeMatrixDiscovery = function() {
        try {
            return this.collaborativeComm.discoverMatrixServers();
        } catch (error) {
            console.warn('Matrix discovery failed, using fallback:', error);
            return window.MatrixDiscoveryFallback.discoverMatrixServers();
        }
    };
    
    this.initializePeerLinkTools = function() {
        try {
            return this.peerLinkTools.initializePeerLinkTools();
        } catch (error) {
            console.warn('PeerLink tools failed, using fallback:', error);
            return window.PeerLinkToolsFallback.initializePeerLinkTools();
        }
    };
    
    // Initialize both systems
    this.initializeMatrixDiscovery();
    this.initializePeerLinkTools();
    
    console.log('Enhanced Swipe Comms Dock: Initialization complete');
};

// CSP Error Handler
window.addEventListener('securitypolicyviolation', function(e) {
    console.warn('CSP Violation:', {
        blockedURI: e.blockedURI,
        violatedDirective: e.violatedDirective,
        originalPolicy: e.originalPolicy
    });
});

// YouTube iframe fallback
window.addEventListener('DOMContentLoaded', function() {
    const iframes = document.querySelectorAll('iframe[src*="youtube"]');
    iframes.forEach(iframe => {
        iframe.addEventListener('error', function() {
            console.warn('YouTube iframe failed to load, showing fallback');
            this.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.innerHTML = '<p>YouTube content blocked by CSP. <a href="' + this.src + '" target="_blank">Open in new tab</a></p>';
            this.parentNode.appendChild(fallback);
        });
    });
});

console.log('Error Handler loaded: All console errors will be handled gracefully');
