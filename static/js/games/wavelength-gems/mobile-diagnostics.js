/**
 * Mobile Diagnostics for Wavelength Gems
 * Comprehensive debugging tool for mobile gameplay issues
 */

class MobileDiagnostics {
    constructor() {
        this.diagnosticData = {
            viewport: {},
            touch: {},
            canvas: {},
            gameBoard: {},
            layout: {},
            performance: {},
            orientation: {}
        };
        this.touchLog = [];
        this.maxTouchLogSize = 20;
    }

    /**
     * Run all mobile diagnostics
     */
    runFullDiagnostics() {
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #8b5cf6; font-weight: bold');
        console.log('%c📱 MOBILE DIAGNOSTICS - Wavelength Gems', 'color: #8b5cf6; font-weight: bold; font-size: 14px');
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #8b5cf6; font-weight: bold');

        this.checkViewport();
        this.checkTouchSupport();
        this.checkCanvas();
        this.checkGameBoard();
        this.checkLayout();
        this.checkOrientation();
        this.checkPerformance();
        this.checkResponsiveBreakpoints();
        this.generateMobileSummary();

        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #8b5cf6; font-weight: bold');
        
        return this.diagnosticData;
    }

    /**
     * Check viewport and device characteristics
     */
    checkViewport() {
        console.log('\n%c🔍 VIEWPORT & DEVICE', 'color: #a78bfa; font-weight: bold');
        
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            availWidth: window.screen.availWidth,
            availHeight: window.screen.availHeight,
            isMobile: window.innerWidth <= 768,
            isTablet: window.innerWidth > 768 && window.innerWidth <= 1024,
            isDesktop: window.innerWidth > 1024,
            orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
        };

        this.diagnosticData.viewport = viewport;

        console.log(`  Window: ${viewport.width}x${viewport.height}px`);
        console.log(`  Screen: ${viewport.screenWidth}x${viewport.screenHeight}px`);
        console.log(`  Available: ${viewport.availWidth}x${viewport.availHeight}px`);
        console.log(`  DPR: ${viewport.devicePixelRatio}x`);
        console.log(`  Device Type: ${viewport.isMobile ? '📱 Mobile' : viewport.isTablet ? '📱 Tablet' : '💻 Desktop'}`);
        console.log(`  Orientation: ${viewport.orientation}`);

        // Check if viewport meta tag is present
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
            console.log(`  ✅ Viewport meta: ${viewportMeta.content}`);
        } else {
            console.log(`  ❌ WARNING: No viewport meta tag found!`);
        }
    }

    /**
     * Check touch support and capabilities
     */
    checkTouchSupport() {
        console.log('\n%c👆 TOUCH SUPPORT', 'color: #a78bfa; font-weight: bold');

        const touch = {
            touchEvents: 'ontouchstart' in window,
            pointerEvents: 'onpointerdown' in window,
            maxTouchPoints: navigator.maxTouchPoints || 0,
            touchActionSupported: CSS.supports('touch-action', 'none'),
            gestureSupported: 'ongesturestart' in window
        };

        this.diagnosticData.touch = touch;

        console.log(`  Touch Events: ${touch.touchEvents ? '✅ Supported' : '❌ Not supported'}`);
        console.log(`  Pointer Events: ${touch.pointerEvents ? '✅ Supported' : '❌ Not supported'}`);
        console.log(`  Max Touch Points: ${touch.maxTouchPoints}`);
        console.log(`  Touch Action CSS: ${touch.touchActionSupported ? '✅ Supported' : '❌ Not supported'}`);
        console.log(`  Gesture Events: ${touch.gestureSupported ? '✅ Supported' : '❌ Not supported'}`);
    }

    /**
     * Check canvas element and rendering
     */
    checkCanvas() {
        console.log('\n%c🎨 CANVAS STATUS', 'color: #a78bfa; font-weight: bold');

        const canvas = document.querySelector('#gameBoard canvas');
        
        if (!canvas) {
            console.log('  ❌ Canvas not found in DOM!');
            this.diagnosticData.canvas = { found: false };
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');

        const canvasData = {
            found: true,
            width: canvas.width,
            height: canvas.height,
            styleWidth: canvas.style.width,
            styleHeight: canvas.style.height,
            displayWidth: rect.width,
            displayHeight: rect.height,
            top: rect.top,
            left: rect.left,
            context: ctx ? '✅' : '❌',
            visible: canvas.offsetParent !== null,
            touchAction: window.getComputedStyle(canvas).touchAction
        };

        this.diagnosticData.canvas = canvasData;

        console.log(`  Canvas Element: ✅ Found`);
        console.log(`  Canvas Size: ${canvasData.width}x${canvasData.height}px`);
        console.log(`  Display Size: ${canvasData.displayWidth.toFixed(0)}x${canvasData.displayHeight.toFixed(0)}px`);
        console.log(`  Position: top=${canvasData.top.toFixed(0)}px, left=${canvasData.left.toFixed(0)}px`);
        console.log(`  Context: ${canvasData.context}`);
        console.log(`  Visible: ${canvasData.visible ? '✅' : '❌'}`);
        console.log(`  Touch Action: ${canvasData.touchAction}`);

        // Check if canvas is too large for mobile
        if (this.diagnosticData.viewport.isMobile && canvasData.displayWidth > this.diagnosticData.viewport.width) {
            console.log(`  ⚠️  WARNING: Canvas (${canvasData.displayWidth.toFixed(0)}px) wider than viewport (${this.diagnosticData.viewport.width}px)!`);
        }
    }

    /**
     * Check game board dimensions and layout
     */
    checkGameBoard() {
        console.log('\n%c🎮 GAME BOARD', 'color: #a78bfa; font-weight: bold');

        const gameBoard = document.getElementById('gameBoard');
        
        if (!gameBoard) {
            console.log('  ❌ Game board container not found!');
            this.diagnosticData.gameBoard = { found: false };
            return;
        }

        const rect = gameBoard.getBoundingClientRect();
        const styles = window.getComputedStyle(gameBoard);

        const boardData = {
            found: true,
            width: rect.width,
            height: rect.height,
            position: styles.position,
            display: styles.display,
            overflow: styles.overflow,
            top: rect.top,
            left: rect.left,
            padding: styles.padding,
            margin: styles.margin
        };

        this.diagnosticData.gameBoard = boardData;

        console.log(`  Container: ✅ Found`);
        console.log(`  Size: ${boardData.width.toFixed(0)}x${boardData.height.toFixed(0)}px`);
        console.log(`  Position: ${boardData.position}`);
        console.log(`  Display: ${boardData.display}`);
        console.log(`  Location: top=${boardData.top.toFixed(0)}px, left=${boardData.left.toFixed(0)}px`);
        console.log(`  Padding: ${boardData.padding}`);
        console.log(`  Margin: ${boardData.margin}`);
    }

    /**
     * Check responsive layout elements
     */
    checkLayout() {
        console.log('\n%c📐 LAYOUT ELEMENTS', 'color: #a78bfa; font-weight: bold');

        const elements = {
            container: document.querySelector('.gems-game-container'),
            wrapper: document.querySelector('.gems-game-wrapper'),
            header: document.querySelector('.game-header'),
            controls: document.querySelector('.game-controls'),
            heroBadge: document.querySelector('.hero-badge-container'),
            leftSidebar: document.getElementById('loreEntries'),
            rightSidebar: document.getElementById('gemList')
        };

        const layoutData = {};

        Object.entries(elements).forEach(([key, element]) => {
            if (element) {
                const rect = element.getBoundingClientRect();
                const styles = window.getComputedStyle(element);
                layoutData[key] = {
                    found: true,
                    width: rect.width,
                    height: rect.height,
                    display: styles.display,
                    visible: styles.display !== 'none' && styles.visibility !== 'hidden'
                };
                console.log(`  ${key}: ${rect.width.toFixed(0)}x${rect.height.toFixed(0)}px - ${layoutData[key].visible ? '✅ Visible' : '❌ Hidden'}`);
            } else {
                layoutData[key] = { found: false };
                console.log(`  ${key}: ❌ Not found`);
            }
        });

        this.diagnosticData.layout = layoutData;

        // Check for horizontal overflow
        const bodyWidth = document.body.scrollWidth;
        const viewportWidth = window.innerWidth;
        if (bodyWidth > viewportWidth) {
            console.log(`  ⚠️  WARNING: Horizontal overflow detected! Body: ${bodyWidth}px, Viewport: ${viewportWidth}px`);
        }
    }

    /**
     * Check orientation and provide recommendations
     */
    checkOrientation() {
        console.log('\n%c🔄 ORIENTATION', 'color: #a78bfa; font-weight: bold');

        const orientation = {
            type: screen.orientation ? screen.orientation.type : 'unknown',
            angle: screen.orientation ? screen.orientation.angle : 0,
            isPortrait: window.innerHeight > window.innerWidth,
            isLandscape: window.innerWidth > window.innerHeight,
            aspectRatio: (window.innerWidth / window.innerHeight).toFixed(2)
        };

        this.diagnosticData.orientation = orientation;

        console.log(`  Type: ${orientation.type}`);
        console.log(`  Angle: ${orientation.angle}°`);
        console.log(`  Aspect Ratio: ${orientation.aspectRatio}`);
        
        if (this.diagnosticData.viewport.isMobile) {
            if (orientation.isLandscape) {
                console.log(`  💡 Landscape mode on mobile - May need special handling`);
            } else {
                console.log(`  ✅ Portrait mode - Optimal for mobile`);
            }
        }
    }

    /**
     * Check performance metrics
     */
    checkPerformance() {
        console.log('\n%c⚡ PERFORMANCE', 'color: #a78bfa; font-weight: bold');

        const perf = {
            memory: performance.memory ? {
                used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2),
                total: (performance.memory.totalJSHeapSize / 1048576).toFixed(2),
                limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2)
            } : null,
            timing: performance.timing ? {
                loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
                domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
            } : null,
            fps: null // Will be updated by animation loop if available
        };

        this.diagnosticData.performance = perf;

        if (perf.memory) {
            console.log(`  Memory: ${perf.memory.used}MB / ${perf.memory.total}MB (Limit: ${perf.memory.limit}MB)`);
        }
        if (perf.timing) {
            console.log(`  Load Time: ${perf.timing.loadTime}ms`);
            console.log(`  DOM Ready: ${perf.timing.domReady}ms`);
        }
    }

    /**
     * Check responsive breakpoints
     */
    checkResponsiveBreakpoints() {
        console.log('\n%c📏 RESPONSIVE BREAKPOINTS', 'color: #a78bfa; font-weight: bold');

        const width = window.innerWidth;
        const breakpoints = [
            { name: 'Mobile', max: 768, active: width <= 768 },
            { name: 'Tablet', min: 769, max: 1024, active: width > 768 && width <= 1024 },
            { name: 'Desktop Small', min: 1025, max: 1300, active: width > 1024 && width <= 1300 },
            { name: 'Desktop Medium', min: 1301, max: 1600, active: width > 1300 && width <= 1600 },
            { name: 'Desktop Large', min: 1601, active: width > 1600 }
        ];

        breakpoints.forEach(bp => {
            const status = bp.active ? '✅ ACTIVE' : '  ';
            console.log(`  ${status} ${bp.name}${bp.min && bp.max ? ` (${bp.min}px - ${bp.max}px)` : bp.max ? ` (<= ${bp.max}px)` : ` (>= ${bp.min}px)`}`);
        });
    }

    /**
     * Generate mobile-specific summary and recommendations
     */
    generateMobileSummary() {
        console.log('\n%c📊 MOBILE SUMMARY', 'color: #d8b4fe; font-weight: bold; font-size: 13px');

        const issues = [];
        const recommendations = [];

        // Check for common mobile issues
        if (!this.diagnosticData.viewport.isMobile) {
            console.log('  ℹ️  Not in mobile viewport (current width: ' + window.innerWidth + 'px)');
            console.log('  💡 To test mobile: Resize window to <= 768px or use browser DevTools device emulation');
            return;
        }

        // Canvas issues
        if (this.diagnosticData.canvas.found) {
            if (this.diagnosticData.canvas.displayWidth > window.innerWidth) {
                issues.push('Canvas wider than viewport');
                recommendations.push('Reduce canvas size or adjust scaling');
            }
            if (this.diagnosticData.canvas.touchAction !== 'none') {
                issues.push('Touch-action not set to "none"');
                recommendations.push('Set touch-action: none to prevent default gestures');
            }
        } else {
            issues.push('Canvas not found');
            recommendations.push('Check canvas creation and DOM insertion');
        }

        // Touch support
        if (!this.diagnosticData.touch.touchEvents) {
            issues.push('Touch events not supported');
            recommendations.push('Ensure device/browser supports touch events');
        }

        // Layout issues
        if (document.body.scrollWidth > window.innerWidth) {
            issues.push('Horizontal overflow detected');
            recommendations.push('Check for fixed-width elements causing overflow');
        }

        // Display results
        if (issues.length === 0) {
            console.log('  ✅ No critical mobile issues detected!');
        } else {
            console.log('  ⚠️  Issues Found:');
            issues.forEach((issue, i) => {
                console.log(`     ${i + 1}. ${issue}`);
            });
            
            console.log('\n  💡 Recommendations:');
            recommendations.forEach((rec, i) => {
                console.log(`     ${i + 1}. ${rec}`);
            });
        }
    }

    /**
     * Log touch event for debugging
     */
    logTouchEvent(event, type) {
        const touch = event.touches?.[0] || event.changedTouches?.[0];
        if (!touch) return;

        const logEntry = {
            type,
            timestamp: Date.now(),
            x: touch.clientX,
            y: touch.clientY,
            target: event.target.tagName
        };

        this.touchLog.push(logEntry);
        if (this.touchLog.length > this.maxTouchLogSize) {
            this.touchLog.shift();
        }

        console.log(`👆 ${type}: (${touch.clientX}, ${touch.clientY}) on ${event.target.tagName}`);
    }

    /**
     * Enable touch event logging
     */
    enableTouchLogging() {
        console.log('📝 Touch event logging enabled');
        
        document.addEventListener('touchstart', (e) => this.logTouchEvent(e, 'touchstart'), { passive: true });
        document.addEventListener('touchmove', (e) => this.logTouchEvent(e, 'touchmove'), { passive: true });
        document.addEventListener('touchend', (e) => this.logTouchEvent(e, 'touchend'), { passive: true });
    }

    /**
     * Get recent touch log
     */
    getTouchLog() {
        return this.touchLog;
    }

    /**
     * Export diagnostic data as JSON
     */
    exportDiagnostics() {
        return JSON.stringify(this.diagnosticData, null, 2);
    }
}

// Auto-initialize and expose globally
const mobileDiagnostics = new MobileDiagnostics();
window.mobileDiagnostics = mobileDiagnostics;

// Auto-run diagnostics on load for mobile devices
if (window.innerWidth <= 768) {
    console.log('%c🚀 Auto-running mobile diagnostics...', 'color: #8b5cf6; font-weight: bold');
    setTimeout(() => mobileDiagnostics.runFullDiagnostics(), 1000);
}

console.log('%c📱 Mobile Diagnostics Loaded', 'color: #10b981; font-weight: bold');
console.log('Run window.mobileDiagnostics.runFullDiagnostics() to run diagnostics');
console.log('Run window.mobileDiagnostics.enableTouchLogging() to log touch events');
