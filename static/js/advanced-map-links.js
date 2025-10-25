/**
 * Advanced Map Link Management System
 * 
 * Instead of relying on SVG click targets, this system uses:
 * 1. HTML overlay elements for precise click detection
 * 2. Screen coordinate mapping for accuracy
 * 3. Visual feedback system for better UX
 * 4. Fallback to SVG if overlay fails
 */

class MapLinkManager {
    constructor(mapContainer, svgElement) {
        this.mapContainer = mapContainer;
        this.svgElement = svgElement;
        this.overlayContainer = null;
        this.locationData = new Map();
        this.isInitialized = false;
        
        this.init();
    }
    
    init() {
        console.log('🗺️ Initializing Advanced Map Link Management System');
        
        // Create overlay container
        this.createOverlayContainer();
        
        // Extract location data from SVG
        this.extractLocationData();
        
        // Create HTML overlay elements
        this.createOverlayElements();
        
        // Set up resize handling
        this.setupResizeHandling();
        
        this.isInitialized = true;
        console.log(`✅ Map Link Manager initialized with ${this.locationData.size} locations`);
    }
    
    createOverlayContainer() {
        // Remove existing overlay if it exists
        const existing = this.mapContainer.querySelector('.map-overlay-container');
        if (existing) existing.remove();
        
        this.overlayContainer = document.createElement('div');
        this.overlayContainer.className = 'map-overlay-container';
        this.overlayContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10;
        `;
        
        this.mapContainer.appendChild(this.overlayContainer);
        console.log('🎯 Created overlay container');
    }
    
    extractLocationData() {
        // Find all elements with data-location in SVG
        const locationElements = this.svgElement.querySelectorAll('[data-location]');
        
        locationElements.forEach(element => {
            const locationId = element.getAttribute('data-location');
            if (!locationId) return;
            
            const cx = parseFloat(element.getAttribute('cx'));
            const cy = parseFloat(element.getAttribute('cy'));
            const r = parseFloat(element.getAttribute('r')) || 15;
            
            if (isNaN(cx) || isNaN(cy)) return;
            
            this.locationData.set(locationId, {
                svgCoords: { x: cx, y: cy, radius: r },
                element: element,
                title: locationId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            });
        });
        
        console.log(`📍 Extracted ${this.locationData.size} locations:`, Array.from(this.locationData.keys()));
    }
    
    createOverlayElements() {
        this.locationData.forEach((data, locationId) => {
            const overlayElement = this.createLocationOverlay(locationId, data);
            this.overlayContainer.appendChild(overlayElement);
        });
        
        // Update positions
        this.updateOverlayPositions();
    }
    
    createLocationOverlay(locationId, data) {
        const overlay = document.createElement('div');
        overlay.className = 'location-overlay';
        overlay.setAttribute('data-location', locationId);
        overlay.title = `Click to explore ${data.title}`;
        
        overlay.style.cssText = `
            position: absolute;
            width: ${data.svgCoords.radius * 2 + 10}px;
            height: ${data.svgCoords.radius * 2 + 10}px;
            border-radius: 50%;
            pointer-events: all;
            cursor: pointer;
            background: rgba(0, 123, 255, 0.1);
            border: 2px solid transparent;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100;
        `;
        
        // Add visual indicator (optional dot in center)
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            width: 4px;
            height: 4px;
            background: rgba(0, 123, 255, 0.6);
            border-radius: 50%;
            pointer-events: none;
        `;
        overlay.appendChild(indicator);
        
        // Add click handler
        overlay.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleLocationClick(locationId, e);
        });
        
        // Add hover effects
        overlay.addEventListener('mouseenter', () => {
            overlay.style.background = 'rgba(0, 123, 255, 0.2)';
            overlay.style.border = '2px solid rgba(0, 123, 255, 0.6)';
            overlay.style.transform = 'scale(1.1)';
            
            console.log(`🎯 Hovering over ${locationId}`);
        });
        
        overlay.addEventListener('mouseleave', () => {
            overlay.style.background = 'rgba(0, 123, 255, 0.1)';
            overlay.style.border = '2px solid transparent';
            overlay.style.transform = 'scale(1)';
        });
        
        return overlay;
    }
    
    updateOverlayPositions() {
        if (!this.svgElement) return;
        
        const svgRect = this.svgElement.getBoundingClientRect();
        const containerRect = this.mapContainer.getBoundingClientRect();
        
        // Calculate SVG coordinate to screen coordinate mapping
        const scaleX = svgRect.width / 1024; // SVG viewBox width
        const scaleY = svgRect.height / 1024; // SVG viewBox height
        
        console.log('📐 SVG mapping:', { 
            svgRect: { width: svgRect.width, height: svgRect.height },
            scale: { x: scaleX, y: scaleY },
            offset: { x: svgRect.left - containerRect.left, y: svgRect.top - containerRect.top }
        });
        
        this.locationData.forEach((data, locationId) => {
            const overlay = this.overlayContainer.querySelector(`[data-location="${locationId}"]`);
            if (!overlay) return;
            
            // Convert SVG coordinates to screen coordinates
            const screenX = (data.svgCoords.x * scaleX) + (svgRect.left - containerRect.left);
            const screenY = (data.svgCoords.y * scaleY) + (svgRect.top - containerRect.top);
            
            // Center the overlay on the coordinate
            const overlaySize = data.svgCoords.radius * 2 + 10;
            overlay.style.left = `${screenX - overlaySize / 2}px`;
            overlay.style.top = `${screenY - overlaySize / 2}px`;
            
            console.log(`📍 ${locationId}: SVG(${data.svgCoords.x}, ${data.svgCoords.y}) -> Screen(${Math.round(screenX)}, ${Math.round(screenY)})`);
        });
    }
    
    handleLocationClick(locationId, event) {
        console.log(`🎯 Location clicked: ${locationId}`);
        console.log('Click details:', {
            locationId,
            clickCoords: { x: event.clientX, y: event.clientY },
            timestamp: new Date().toISOString()
        });
        
        // Call the existing disambiguation system
        if (typeof showMapDisambiguationModal === 'function') {
            showMapDisambiguationModal(locationId);
        } else {
            console.warn('⚠️ showMapDisambiguationModal not found, falling back to alert');
            alert(`Navigate to ${locationId}?`);
        }
        
        // Add click feedback
        const overlay = event.target.closest('.location-overlay');
        if (overlay) {
            overlay.style.background = 'rgba(0, 255, 0, 0.3)';
            overlay.style.transform = 'scale(1.2)';
            
            setTimeout(() => {
                overlay.style.background = 'rgba(0, 123, 255, 0.1)';
                overlay.style.transform = 'scale(1)';
            }, 200);
        }
    }
    
    setupResizeHandling() {
        let resizeTimeout;
        
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                console.log('🔄 Updating overlay positions after resize');
                this.updateOverlayPositions();
            }, 100);
        };
        
        window.addEventListener('resize', handleResize);
        
        // Also update on any map container size changes
        if (window.ResizeObserver) {
            const resizeObserver = new ResizeObserver(handleResize);
            resizeObserver.observe(this.mapContainer);
        }
    }
    
    // Public method to manually update positions (useful for zoom changes)
    updatePositions() {
        this.updateOverlayPositions();
    }
    
    // Debug method to show all overlay positions
    showDebugInfo() {
        console.log('🔍 Map Link Manager Debug Info:');
        console.log('Initialized:', this.isInitialized);
        console.log('Locations:', this.locationData.size);
        console.log('Overlay container:', this.overlayContainer);
        
        this.locationData.forEach((data, locationId) => {
            const overlay = this.overlayContainer.querySelector(`[data-location="${locationId}"]`);
            console.log(`${locationId}:`, {
                svgCoords: data.svgCoords,
                overlayPosition: overlay ? {
                    left: overlay.style.left,
                    top: overlay.style.top
                } : 'not found'
            });
        });
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for other scripts to load
    setTimeout(() => {
        const mapContainer = document.querySelector('#map-display');
        const svgElement = document.querySelector('#map-display svg');
        
        if (mapContainer && svgElement) {
            console.log('🚀 Auto-initializing Map Link Manager');
            window.mapLinkManager = new MapLinkManager(mapContainer, svgElement);
            
            // Expose debug method globally
            window.debugMapLinks = () => window.mapLinkManager.showDebugInfo();
        } else {
            console.warn('⚠️ Map container or SVG not found for Link Manager');
        }
    }, 500);
});

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapLinkManager;
}