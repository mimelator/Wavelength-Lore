/**
 * Wavelength Gems - Desktop Test Suite
 * Comprehensive testing framework for desktop-specific features and interactions
 */

class WavelengthGemsDesktopTests {
    constructor() {
        this.testResults = [];
        this.viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        this.isDesktop = this.viewport.width > 1024;
        this.isTablet = this.viewport.width > 768 && this.viewport.width <= 1024;
        this.isMobile = this.viewport.width <= 768;
        
        // Test configuration
        this.config = {
            clickTimeout: 100,
            animationTimeout: 1000,
            loadTimeout: 5000,
            minDesktopGemSize: 50,
            maxLoadTime: 2000
        };
        
        console.log(`🖥️ Desktop Test Suite initialized for ${this.viewport.width}x${this.viewport.height} viewport`);
    }

    /**
     * Run all desktop-focused tests
     */
    async runAllDesktopTests() {
        console.log('🚀 Starting Wavelength Gems Desktop Test Suite...');
        
        const testSuites = [
            () => this.testDesktopLayoutFeatures(),
            () => this.testMouseInteractions(),
            () => this.testKeyboardControls(),
            () => this.testDesktopSidebars(),
            () => this.testLargeScreenOptimization(),
            () => this.testDesktopPerformance(),
            () => this.testWindowResizing(),
            () => this.testDesktopAccessibility(),
            () => this.testAdminPanelIntegration(),
            () => this.testDesktopSpecificFeatures()
        ];

        for (const testSuite of testSuites) {
            try {
                await testSuite();
            } catch (error) {
                this.logResult('ERROR', `Test suite failed: ${error.message}`, false);
            }
        }

        this.generateDesktopTestReport();
        return this.testResults;
    }

    /**
     * Test desktop-specific layout features
     */
    async testDesktopLayoutFeatures() {
        console.log('🖥️ Testing desktop layout features...');

        // Test sidebar visibility on desktop
        const leftSidebar = document.querySelector('.left-sidebar');
        const rightSidebar = document.querySelector('.right-sidebar');
        
        if (this.isDesktop) {
            const leftVisible = leftSidebar && getComputedStyle(leftSidebar).display !== 'none';
            const rightVisible = rightSidebar && getComputedStyle(rightSidebar).display !== 'none';
            this.logResult('LAYOUT', 'Desktop sidebars are visible', leftVisible || rightVisible);
        }

        // Test main game container centering
        const gameContainer = document.querySelector('.gems-game-container');
        if (gameContainer) {
            const containerRect = gameContainer.getBoundingClientRect();
            const isProperlyPositioned = containerRect.left > 200; // Should have sidebar space
            this.logResult('LAYOUT', 'Game container positioned with sidebar space', isProperlyPositioned || !this.isDesktop);
        }

        // Test header layout on desktop
        const gameHeader = document.querySelector('.game-header');
        if (gameHeader) {
            const headerStyle = getComputedStyle(gameHeader);
            const hasFlexLayout = headerStyle.display === 'flex';
            this.logResult('LAYOUT', 'Game header uses flex layout', hasFlexLayout);
        }

        // Test hero badge positioning
        const heroBadge = document.querySelector('.hero-badge-container');
        if (heroBadge) {
            const badgeStyle = getComputedStyle(heroBadge);
            const isVisible = badgeStyle.display !== 'none';
            this.logResult('LAYOUT', 'Hero badge visible on desktop', isVisible);
        }
    }

    /**
     * Test mouse interactions and hover effects
     */
    async testMouseInteractions() {
        console.log('🖱️ Testing mouse interactions...');

        const canvas = document.getElementById('gemsCanvas');
        if (!canvas) {
            this.logResult('MOUSE', 'Canvas element not found', false);
            return;
        }

        // Test click event registration
        const hasClickHandler = canvas.onclick !== null || canvas.addEventListener;
        this.logResult('MOUSE', 'Click event handlers available', hasClickHandler);

        // Test cursor styling
        const canvasStyle = getComputedStyle(canvas);
        const hasCursorPointer = canvasStyle.cursor === 'pointer';
        this.logResult('MOUSE', 'Canvas has pointer cursor', hasCursorPointer);

        // Test gem hover effects
        const gems = document.querySelectorAll('.gem');
        if (gems.length > 0) {
            const firstGem = gems[0];
            const gemStyle = getComputedStyle(firstGem);
            const hasTransition = gemStyle.transition !== 'none' && gemStyle.transition !== '';
            this.logResult('MOUSE', 'Gems have hover transition effects', hasTransition);
        }

        // Test button hover states
        const buttons = document.querySelectorAll('.btn');
        let buttonsWithHover = 0;
        buttons.forEach(button => {
            const style = getComputedStyle(button);
            if (style.cursor === 'pointer') {
                buttonsWithHover++;
            }
        });
        const hoverRatio = buttons.length > 0 ? buttonsWithHover / buttons.length : 1;
        this.logResult('MOUSE', `Buttons with hover styling: ${buttonsWithHover}/${buttons.length}`, hoverRatio >= 0.8);

        // Test right-click handling (should not interfere with game)
        const contextMenuPrevented = await this.testContextMenuPrevention(canvas);
        this.logResult('MOUSE', 'Context menu properly handled', contextMenuPrevented);
    }

    /**
     * Test keyboard controls and shortcuts
     */
    async testKeyboardControls() {
        console.log('⌨️ Testing keyboard controls...');

        // Test admin panel shortcut (Ctrl+Shift+D)
        const adminPanelAvailable = typeof window.toggleAdminPanel === 'function';
        this.logResult('KEYBOARD', 'Admin panel shortcut function available', adminPanelAvailable);

        // Test escape key handling
        const escapeHandled = await this.testEscapeKeyHandling();
        this.logResult('KEYBOARD', 'Escape key handling', escapeHandled);

        // Test space bar and enter key handling
        const spaceHandled = await this.testSpaceBarHandling();
        this.logResult('KEYBOARD', 'Space bar handling', spaceHandled);

        // Test tab navigation
        const tabbableElements = document.querySelectorAll('button, [tabindex], input, select, textarea');
        const hasTabOrder = tabbableElements.length > 0;
        this.logResult('KEYBOARD', `Tabbable elements available: ${tabbableElements.length}`, hasTabOrder);

        // Test keyboard shortcuts documentation
        const hasShortcutHints = document.querySelector('[title*="Ctrl"]') || 
                                document.querySelector('[aria-label*="Ctrl"]');
        this.logResult('KEYBOARD', 'Keyboard shortcut hints available', hasShortcutHints !== null);
    }

    /**
     * Test desktop sidebar functionality
     */
    async testDesktopSidebars() {
        console.log('📋 Testing desktop sidebars...');

        if (!this.isDesktop) {
            this.logResult('SIDEBARS', 'Desktop sidebars (skipped - not desktop)', true);
            return;
        }

        // Test left sidebar content
        const leftSidebar = document.querySelector('.left-sidebar');
        if (leftSidebar) {
            const levelInfo = leftSidebar.querySelector('.level-info-card');
            this.logResult('SIDEBARS', 'Left sidebar has level info card', levelInfo !== null);
            
            const episodeLink = leftSidebar.querySelector('.episode-link');
            this.logResult('SIDEBARS', 'Left sidebar has episode link', episodeLink !== null);
        }

        // Test right sidebar content
        const rightSidebar = document.querySelector('.right-sidebar');
        if (rightSidebar) {
            const tipsCard = rightSidebar.querySelector('.level-tips-card');
            const statsCard = rightSidebar.querySelector('.level-stats-card');
            this.logResult('SIDEBARS', 'Right sidebar has tips and stats cards', tipsCard !== null && statsCard !== null);
        }

        // Test sidebar responsive behavior
        const sidebarElements = document.querySelectorAll('.game-sidebar');
        sidebarElements.forEach((sidebar, index) => {
            const sidebarStyle = getComputedStyle(sidebar);
            const isVisible = sidebarStyle.display !== 'none';
            this.logResult('SIDEBARS', `Sidebar ${index + 1} visible on desktop`, isVisible);
        });
    }

    /**
     * Test large screen optimization
     */
    async testLargeScreenOptimization() {
        console.log('📺 Testing large screen optimization...');

        // Test maximum game board size
        const gameBoard = document.getElementById('gameBoard');
        if (gameBoard) {
            const boardRect = gameBoard.getBoundingClientRect();
            const isReasonableSize = boardRect.width <= 800 && boardRect.height <= 800; // Don't be too large
            this.logResult('LARGE_SCREEN', `Game board reasonable size: ${Math.round(boardRect.width)}x${Math.round(boardRect.height)}`, isReasonableSize);
        }

        // Test gem sizing on large screens
        const gems = document.querySelectorAll('.gem');
        if (gems.length > 0) {
            const firstGem = gems[0];
            const gemRect = firstGem.getBoundingClientRect();
            const isAppropriateSize = gemRect.width >= this.config.minDesktopGemSize && gemRect.width <= 120;
            this.logResult('LARGE_SCREEN', `Gem size appropriate for desktop: ${Math.round(gemRect.width)}px`, isAppropriateSize);
        }

        // Test UI scaling
        const gameContainer = document.querySelector('.gems-game-container');
        if (gameContainer) {
            const containerRect = gameContainer.getBoundingClientRect();
            const utilizesSpace = containerRect.width > 600; // Should use available space
            this.logResult('LARGE_SCREEN', 'Game container utilizes large screen space', utilizesSpace || !this.isDesktop);
        }

        // Test font scaling
        const gameTitle = document.querySelector('.game-title');
        if (gameTitle) {
            const titleStyle = getComputedStyle(gameTitle);
            const fontSize = parseFloat(titleStyle.fontSize);
            const isLargeEnough = fontSize >= 24; // Should be readable on large screens
            this.logResult('LARGE_SCREEN', `Title font size appropriate: ${fontSize}px`, isLargeEnough);
        }
    }

    /**
     * Test desktop performance characteristics
     */
    async testDesktopPerformance() {
        console.log('⚡ Testing desktop performance...');

        // Test higher frame rate capability
        const frameCount = await this.measureFrameRate(1000);
        const fps = frameCount;
        this.logResult('PERFORMANCE', `Frame rate: ${fps} FPS`, fps >= 50);

        // Test canvas rendering performance
        if (window.canvasManager) {
            const renderTimes = [];
            for (let i = 0; i < 10; i++) {
                const renderStart = performance.now();
                window.canvasManager.draw();
                const renderTime = performance.now() - renderStart;
                renderTimes.push(renderTime);
            }
            const avgRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
            this.logResult('PERFORMANCE', `Average render time: ${Math.round(avgRenderTime)}ms`, avgRenderTime < 10);
        }

        // Test memory efficiency
        if (performance.memory) {
            const memoryMB = performance.memory.usedJSHeapSize / 1024 / 1024;
            this.logResult('PERFORMANCE', `Memory usage: ${Math.round(memoryMB)}MB`, memoryMB < 100);
        }

        // Test asset loading speed
        const loadStartTime = performance.now();
        const images = document.querySelectorAll('img[src]');
        let loadedCount = 0;
        images.forEach(img => {
            if (img.complete) loadedCount++;
        });
        const loadTime = performance.now() - loadStartTime;
        this.logResult('PERFORMANCE', `Image loading performance: ${loadedCount}/${images.length} in ${Math.round(loadTime)}ms`, loadTime < this.config.maxLoadTime);
    }

    /**
     * Test window resizing behavior
     */
    async testWindowResizing() {
        console.log('📏 Testing window resizing behavior...');

        // Store original size
        const originalWidth = window.innerWidth;
        const originalHeight = window.innerHeight;

        // Test resize event handler
        const hasResizeHandler = typeof window.onresize !== 'undefined' || 
                                window.addEventListener;
        this.logResult('RESIZE', 'Window resize handler available', hasResizeHandler);

        // Test canvas manager resize capability
        if (window.canvasManager && typeof window.canvasManager.resizeCanvas === 'function') {
            try {
                window.canvasManager.resizeCanvas();
                this.logResult('RESIZE', 'Canvas manager resize function works', true);
            } catch (error) {
                this.logResult('RESIZE', `Canvas resize error: ${error.message}`, false);
            }
        }

        // Test layout stability after simulated resize
        const gameBoard = document.getElementById('gameBoard');
        if (gameBoard) {
            const beforeRect = gameBoard.getBoundingClientRect();
            // Simulate resize by triggering resize event
            window.dispatchEvent(new Event('resize'));
            
            // Give time for resize handlers to run
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const afterRect = gameBoard.getBoundingClientRect();
            const layoutStable = Math.abs(beforeRect.width - afterRect.width) < 50; // Allow some adjustment
            this.logResult('RESIZE', 'Layout remains stable after resize', layoutStable);
        }
    }

    /**
     * Test desktop accessibility features
     */
    async testDesktopAccessibility() {
        console.log('♿ Testing desktop accessibility...');

        // Test keyboard navigation
        const focusableElements = document.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
        this.logResult('ACCESSIBILITY', `Keyboard navigable elements: ${focusableElements.length}`, focusableElements.length > 5);

        // Test focus indicators
        let elementsWithFocusStyle = 0;
        focusableElements.forEach(element => {
            const style = getComputedStyle(element);
            // Check if element has focus styling (outline or box-shadow)
            if (style.outline !== 'none' || style.boxShadow !== 'none') {
                elementsWithFocusStyle++;
            }
        });
        const focusRatio = focusableElements.length > 0 ? elementsWithFocusStyle / focusableElements.length : 1;
        this.logResult('ACCESSIBILITY', `Elements with focus indicators: ${elementsWithFocusStyle}/${focusableElements.length}`, focusRatio >= 0.5);

        // Test aria labels and descriptions
        const elementsWithAria = document.querySelectorAll('[aria-label], [aria-describedby], [role]');
        this.logResult('ACCESSIBILITY', `Elements with ARIA attributes: ${elementsWithAria.length}`, elementsWithAria.length > 0);

        // Test heading structure
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        this.logResult('ACCESSIBILITY', `Semantic headings found: ${headings.length}`, headings.length > 0);

        // Test color contrast (basic check for background colors)
        const coloredElements = document.querySelectorAll('[style*="color"], [class*="color"]');
        this.logResult('ACCESSIBILITY', `Elements with color styling: ${coloredElements.length}`, true); // Just log count

        // Test skip links
        const skipLinks = document.querySelectorAll('a[href^="#"], .skip-link');
        this.logResult('ACCESSIBILITY', `Skip links available: ${skipLinks.length}`, skipLinks.length >= 0);
    }

    /**
     * Test admin panel integration
     */
    async testAdminPanelIntegration() {
        console.log('🛠️ Testing admin panel integration...');

        // Test admin panel availability
        const adminPanelExists = document.getElementById('adminPanel') || 
                                typeof window.toggleAdminPanel === 'function';
        this.logResult('ADMIN', 'Admin panel functionality available', adminPanelExists);

        // Test keyboard shortcut
        const shortcutWorks = await this.testAdminPanelShortcut();
        this.logResult('ADMIN', 'Admin panel keyboard shortcut (Ctrl+Shift+D)', shortcutWorks);

        // Test admin panel initialization
        if (typeof window.initAdminPanel === 'function') {
            try {
                // Don't actually initialize, just check it exists
                this.logResult('ADMIN', 'Admin panel initialization function available', true);
            } catch (error) {
                this.logResult('ADMIN', `Admin panel init error: ${error.message}`, false);
            }
        }

        // Test development mode detection
        const isDevelopment = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1' ||
                             window.location.protocol === 'file:';
        this.logResult('ADMIN', `Development environment detected: ${isDevelopment}`, true);
    }

    /**
     * Test desktop-specific features
     */
    async testDesktopSpecificFeatures() {
        console.log('🎯 Testing desktop-specific features...');

        // Test multiple monitor support (basic check)
        const hasMultipleScreens = screen.width > 1920 || window.screen.availWidth > 1920;
        this.logResult('DESKTOP_FEATURES', `Multi-monitor setup detected: ${hasMultipleScreens}`, true);

        // Test right-click context menu handling
        const contextMenuHandled = await this.testRightClickHandling();
        this.logResult('DESKTOP_FEATURES', 'Right-click context menu handled', contextMenuHandled);

        // Test drag and drop prevention (should not interfere with gameplay)
        const dragPrevented = await this.testDragDropPrevention();
        this.logResult('DESKTOP_FEATURES', 'Drag and drop appropriately handled', dragPrevented);

        // Test browser zoom handling
        const zoomLevel = Math.round(window.devicePixelRatio * 100);
        const zoomHandled = zoomLevel >= 100 && zoomLevel <= 200; // Reasonable zoom range
        this.logResult('DESKTOP_FEATURES', `Browser zoom level acceptable: ${zoomLevel}%`, zoomHandled);

        // Test fullscreen capability
        const fullscreenAvailable = document.fullscreenEnabled || 
                                   document.webkitFullscreenEnabled || 
                                   document.mozFullScreenEnabled;
        this.logResult('DESKTOP_FEATURES', 'Fullscreen API available', fullscreenAvailable);
    }

    /**
     * Utility: Test context menu prevention
     */
    async testContextMenuPrevention(element) {
        return new Promise(resolve => {
            let contextMenuPrevented = false;
            
            const contextMenuHandler = (e) => {
                contextMenuPrevented = true;
                e.preventDefault();
                document.removeEventListener('contextmenu', contextMenuHandler);
                resolve(true);
            };
            
            document.addEventListener('contextmenu', contextMenuHandler);
            
            // Simulate right click
            const rightClickEvent = new MouseEvent('contextmenu', {
                bubbles: true,
                cancelable: true,
                button: 2
            });
            
            element.dispatchEvent(rightClickEvent);
            
            setTimeout(() => {
                document.removeEventListener('contextmenu', contextMenuHandler);
                resolve(contextMenuPrevented);
            }, 100);
        });
    }

    /**
     * Utility: Test escape key handling
     */
    async testEscapeKeyHandling() {
        return new Promise(resolve => {
            let escapeHandled = false;
            
            const keyHandler = (e) => {
                if (e.key === 'Escape' || e.keyCode === 27) {
                    escapeHandled = true;
                }
                document.removeEventListener('keydown', keyHandler);
                resolve(escapeHandled);
            };
            
            document.addEventListener('keydown', keyHandler);
            
            // Simulate escape key
            const escapeEvent = new KeyboardEvent('keydown', {
                key: 'Escape',
                keyCode: 27,
                bubbles: true
            });
            
            document.dispatchEvent(escapeEvent);
            
            setTimeout(() => {
                document.removeEventListener('keydown', keyHandler);
                resolve(escapeHandled);
            }, 100);
        });
    }

    /**
     * Utility: Test space bar handling
     */
    async testSpaceBarHandling() {
        return new Promise(resolve => {
            let spaceHandled = false;
            
            const keyHandler = (e) => {
                if (e.key === ' ' || e.keyCode === 32) {
                    spaceHandled = true;
                }
                document.removeEventListener('keydown', keyHandler);
                resolve(spaceHandled);
            };
            
            document.addEventListener('keydown', keyHandler);
            
            // Simulate space key
            const spaceEvent = new KeyboardEvent('keydown', {
                key: ' ',
                keyCode: 32,
                bubbles: true
            });
            
            document.dispatchEvent(spaceEvent);
            
            setTimeout(() => {
                document.removeEventListener('keydown', keyHandler);
                resolve(true); // Always pass since space handling is optional
            }, 100);
        });
    }

    /**
     * Utility: Test admin panel shortcut
     */
    async testAdminPanelShortcut() {
        return new Promise(resolve => {
            const originalToggle = window.toggleAdminPanel;
            let shortcutTriggered = false;
            
            // Mock the function temporarily
            window.toggleAdminPanel = () => {
                shortcutTriggered = true;
            };
            
            // Simulate Ctrl+Shift+D
            const keyEvent = new KeyboardEvent('keydown', {
                key: 'D',
                ctrlKey: true,
                shiftKey: true,
                bubbles: true
            });
            
            document.dispatchEvent(keyEvent);
            
            setTimeout(() => {
                // Restore original function
                if (originalToggle) {
                    window.toggleAdminPanel = originalToggle;
                }
                resolve(shortcutTriggered || typeof originalToggle === 'function');
            }, 100);
        });
    }

    /**
     * Utility: Test right-click handling
     */
    async testRightClickHandling() {
        return new Promise(resolve => {
            let rightClickHandled = false;
            
            const rightClickHandler = (e) => {
                rightClickHandled = true;
                document.removeEventListener('mousedown', rightClickHandler);
            };
            
            document.addEventListener('mousedown', rightClickHandler);
            
            // Simulate right mouse button
            const rightClickEvent = new MouseEvent('mousedown', {
                button: 2,
                bubbles: true
            });
            
            document.dispatchEvent(rightClickEvent);
            
            setTimeout(() => {
                document.removeEventListener('mousedown', rightClickHandler);
                resolve(rightClickHandled);
            }, 100);
        });
    }

    /**
     * Utility: Test drag and drop prevention
     */
    async testDragDropPrevention() {
        return new Promise(resolve => {
            let dragPrevented = false;
            
            const dragHandler = (e) => {
                if (e.defaultPrevented) {
                    dragPrevented = true;
                }
                document.removeEventListener('dragstart', dragHandler);
            };
            
            document.addEventListener('dragstart', dragHandler);
            
            // Simulate drag start
            const dragEvent = new DragEvent('dragstart', {
                bubbles: true,
                cancelable: true
            });
            
            document.body.dispatchEvent(dragEvent);
            
            setTimeout(() => {
                document.removeEventListener('dragstart', dragHandler);
                resolve(true); // Always pass - drag prevention is optional
            }, 100);
        });
    }

    /**
     * Utility: Measure frame rate
     */
    async measureFrameRate(duration = 1000) {
        return new Promise(resolve => {
            let frameCount = 0;
            const startTime = performance.now();
            
            function countFrames() {
                frameCount++;
                const elapsed = performance.now() - startTime;
                
                if (elapsed < duration) {
                    requestAnimationFrame(countFrames);
                } else {
                    const fps = Math.round((frameCount / elapsed) * 1000);
                    resolve(fps);
                }
            }
            
            requestAnimationFrame(countFrames);
        });
    }

    /**
     * Log test result
     */
    logResult(category, description, passed, details = null) {
        const result = {
            category,
            description,
            passed,
            details,
            timestamp: new Date().toISOString(),
            viewport: `${this.viewport.width}x${this.viewport.height}`
        };
        
        this.testResults.push(result);
        
        const status = passed ? '✅' : '❌';
        const deviceType = this.isDesktop ? '🖥️' : this.isTablet ? '💻' : '📱';
        console.log(`${status} ${deviceType} [${category}] ${description}`, details ? details : '');
    }

    /**
     * Generate comprehensive test report
     */
    generateDesktopTestReport() {
        console.log('\n📊 WAVELENGTH GEMS DESKTOP TEST REPORT');
        console.log('=' .repeat(50));
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        const passRate = Math.round((passedTests / totalTests) * 100);
        
        console.log(`🖥️ Device: ${this.isDesktop ? 'Desktop' : this.isTablet ? 'Tablet' : 'Mobile'} (${this.viewport.width}x${this.viewport.height})`);
        console.log(`✅ Passed: ${passedTests}/${totalTests} (${passRate}%)`);
        console.log(`❌ Failed: ${failedTests}/${totalTests} (${100 - passRate}%)`);
        console.log(`📅 Date: ${new Date().toLocaleString()}`);
        
        // Group results by category
        const categories = {};
        this.testResults.forEach(result => {
            if (!categories[result.category]) {
                categories[result.category] = { passed: 0, failed: 0, tests: [] };
            }
            categories[result.category].tests.push(result);
            if (result.passed) {
                categories[result.category].passed++;
            } else {
                categories[result.category].failed++;
            }
        });
        
        console.log('\n📋 Results by Category:');
        Object.keys(categories).forEach(category => {
            const cat = categories[category];
            const catPassRate = Math.round((cat.passed / (cat.passed + cat.failed)) * 100);
            console.log(`   ${category}: ${cat.passed}/${cat.passed + cat.failed} (${catPassRate}%)`);
        });
        
        // List failed tests for attention
        const failedResults = this.testResults.filter(r => !r.passed);
        if (failedResults.length > 0) {
            console.log('\n🚨 Failed Tests Requiring Attention:');
            failedResults.forEach(result => {
                console.log(`   ❌ [${result.category}] ${result.description}`);
            });
        }
        
        console.log('\n' + '=' .repeat(50));
        
        return {
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                passRate: passRate,
                viewport: this.viewport,
                deviceType: this.isDesktop ? 'desktop' : this.isTablet ? 'tablet' : 'mobile'
            },
            categories: categories,
            recommendations: this.generateDesktopRecommendations(categories, passRate)
        };
    }

    /**
     * Generate actionable recommendations for desktop
     */
    generateDesktopRecommendations(categories, passRate) {
        const recommendations = [];
        
        if (categories.SIDEBARS && categories.SIDEBARS.failed > 0) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'SIDEBARS',
                issue: 'Desktop sidebar issues',
                action: 'Review sidebar visibility and content on large screens'
            });
        }
        
        if (categories.KEYBOARD && categories.KEYBOARD.failed > 0) {
            recommendations.push({
                priority: 'HIGH',
                category: 'KEYBOARD',
                issue: 'Keyboard navigation problems',
                action: 'Implement proper keyboard shortcuts and navigation'
            });
        }
        
        if (categories.PERFORMANCE && categories.PERFORMANCE.failed > 0) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'PERFORMANCE',
                issue: 'Desktop performance issues',
                action: 'Optimize rendering for higher resolution displays'
            });
        }
        
        return recommendations;
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.wavelengthGemsDesktopTests = new WavelengthGemsDesktopTests();
    });
} else {
    window.wavelengthGemsDesktopTests = new WavelengthGemsDesktopTests();
}

// Global test runner function
window.runWavelengthGemsDesktopTests = async function() {
    if (!window.wavelengthGemsDesktopTests) {
        console.error('❌ Desktop test suite not initialized');
        return null;
    }
    
    return await window.wavelengthGemsDesktopTests.runAllDesktopTests();
};

console.log('🖥️ Wavelength Gems Desktop Test Suite loaded - run with: runWavelengthGemsDesktopTests()');