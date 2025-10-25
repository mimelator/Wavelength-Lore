/**
 * Advanced Click Diagnostic
 * Paste this in browser console on the map page to debug click behavior
 */

function enableAdvancedClickDiagnostic() {
    console.log('🔧 ENABLING ADVANCED CLICK DIAGNOSTIC');
    console.log('='.repeat(50));
    
    // Add visual debugging to all overlays
    const overlays = document.querySelectorAll('.location-overlay');
    console.log(`Found ${overlays.length} location overlays`);
    
    overlays.forEach(overlay => {
        const locationId = overlay.getAttribute('data-location');
        
        // Add visible border for debugging
        overlay.style.border = '2px solid rgba(255, 0, 0, 0.8)';
        overlay.style.background = 'rgba(255, 255, 0, 0.3)';
        
        // Add click logging
        overlay.addEventListener('click', function(e) {
            console.log(`🎯 CLICK DETECTED on ${locationId}:`, {
                locationId: locationId,
                clickCoords: { x: e.clientX, y: e.clientY },
                overlayRect: this.getBoundingClientRect(),
                timestamp: new Date().toLocaleTimeString()
            });
        }, true); // Use capture phase
        
        // Add hover logging  
        overlay.addEventListener('mouseenter', function() {
            console.log(`👆 HOVER ENTER: ${locationId}`);
            this.style.background = 'rgba(0, 255, 0, 0.5)';
        });
        
        overlay.addEventListener('mouseleave', function() {
            console.log(`👋 HOVER LEAVE: ${locationId}`);
            this.style.background = 'rgba(255, 255, 0, 0.3)';
        });
        
        console.log(`📍 ${locationId}: Position(${overlay.style.left}, ${overlay.style.top}) Size(${overlay.style.width}, ${overlay.style.height})`);
    });
    
    // Also monitor for any showMapDisambiguationModal calls
    const originalModal = window.showMapDisambiguationModal;
    window.showMapDisambiguationModal = function(locationId) {
        console.log(`🏛️ MODAL CALLED: showMapDisambiguationModal("${locationId}")`);
        if (originalModal) {
            return originalModal.call(this, locationId);
        } else {
            console.log('❌ Original modal function not found!');
        }
    };
    
    console.log('✅ Diagnostic enabled! Now:');
    console.log('1. Try hovering over locations - should see yellow/green highlights');
    console.log('2. Try clicking - should see detailed click logs');
    console.log('3. Look for red borders around clickable areas');
}

// Auto-run
enableAdvancedClickDiagnostic();