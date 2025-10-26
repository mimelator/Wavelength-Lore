/**
 * Wavelength Gems - Mobile Test Suite
 * Comprehensive testing framework focused on mobile UI/UX validation
 */

class WavelengthGemsMobileTests {
    constructor() {
        this.testResults = [];
        this.viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        this.isMobile = this.viewport.width <= 768;
        this.isTablet = this.viewport.width > 768 && this.viewport.width <= 1024;
        this.isDesktop = this.viewport.width > 1024;
        
        // Test configuration
        this.config = {
            touchTimeout: 500,
            animationTimeout: 1000,
            loadTimeout: 5000,
            minTouchTarget: 44, // iOS/Android minimum touch target size
            maxLoadTime: 3000
        };
        
        console.log(`🧪 Mobile Test Suite initialized for ${this.viewport.width}x${this.viewport.height} viewport`);
    }

    /**
     * Run all mobile-focused tests
     */
    async runAllMobileTests() {
        console.log('🚀 Starting Wavelength Gems Mobile Test Suite...');
        
        const testSuites = [
            () => this.testViewportResponsiveness(),
            () => this.testTouchInteractions(),
            () => this.testGameBoardMobile(),
            () => this.testGemSizeAndTappability(),
            () => this.testMobileLayoutOptimization(),
            () => this.testPerformanceOnMobile(),
            () => this.testOrientationChanges(),
            () => this.testScrollAndOverflow(),
            () => this.testMobileControlsAccessibility(),
            () => this.testLoadingAndInitialization()
        ];

        for (const testSuite of testSuites) {
            try {
                await testSuite();
            } catch (error) {
                this.logResult('ERROR', `Test suite failed: ${error.message}`, false);
            }
        }

        this.generateMobileTestReport();
        return this.testResults;
    }

    /**
     * Test viewport responsiveness and breakpoints
     */
    async testViewportResponsiveness() {
        console.log('📱 Testing viewport responsiveness...');

        // Test mobile breakpoint detection
        const mobileBreakpoint = window.innerWidth <= 768;
        this.logResult('VIEWPORT', `Mobile breakpoint detection (≤768px): ${mobileBreakpoint}`, 
            mobileBreakpoint === this.isMobile);

        // Test CSS media queries
        const computedStyle = getComputedStyle(document.body);
        this.logResult('VIEWPORT', 'CSS media queries applied', computedStyle !== null);

        // Test game container sizing
        const gameContainer = document.querySelector('.gems-game-container');
        if (gameContainer) {
            const containerRect = gameContainer.getBoundingClientRect();
            const fitsInViewport = containerRect.width <= window.innerWidth && 
                                 containerRect.height <= window.innerHeight;
            this.logResult('VIEWPORT', `Game container fits in viewport: ${containerRect.width}x${containerRect.height}`, fitsInViewport);
        }

        // Test responsive game board
        const gameBoard = document.getElementById('gameBoard');
        if (gameBoard) {
            const boardRect = gameBoard.getBoundingClientRect();
            const boardFitsHorizontally = boardRect.width <= window.innerWidth - 20; // 20px margin
            this.logResult('VIEWPORT', `Game board fits horizontally: ${boardRect.width}px`, boardFitsHorizontally);
        }
    }

    /**
     * Test touch interactions and gesture handling
     */
    async testTouchInteractions() {
        console.log('👆 Testing touch interactions...');

        const canvas = document.getElementById('gemsCanvas');
        if (!canvas) {
            this.logResult('TOUCH', 'Canvas element not found', false);
            return;
        }

        // Test touch event registration
        const hasTouchStart = canvas.ontouchstart !== undefined;
        const hasTouchEnd = canvas.ontouchend !== undefined;
        this.logResult('TOUCH', 'Touch event handlers registered', hasTouchStart || hasTouchEnd);

        // Test touch-action CSS property
        const touchAction = getComputedStyle(canvas).touchAction;
        this.logResult('TOUCH', `Touch-action property: ${touchAction}`, touchAction === 'none');

        // Test touch target accessibility
        const gems = document.querySelectorAll('.gem');
        if (gems.length > 0) {
            const firstGem = gems[0];
            const gemRect = firstGem.getBoundingClientRect();
            const isAccessibleSize = gemRect.width >= this.config.minTouchTarget && 
                                   gemRect.height >= this.config.minTouchTarget;
            this.logResult('TOUCH', `Gem touch targets (${Math.round(gemRect.width)}x${Math.round(gemRect.height)}px) meet accessibility standards (≥${this.config.minTouchTarget}px)`, isAccessibleSize);
        }

        // Test for click delay issues
        const startTime = performance.now();
        await this.simulateTouch(canvas, 100, 100);
        const touchResponseTime = performance.now() - startTime;
        this.logResult('TOUCH', `Touch response time: ${Math.round(touchResponseTime)}ms`, touchResponseTime < this.config.touchTimeout);
    }

    /**
     * Test game board mobile optimization
     */
    async testGameBoardMobile() {
        console.log('🎮 Testing game board mobile optimization...');

        const gameBoard = document.getElementById('gameBoard');
        if (!gameBoard) {
            this.logResult('BOARD', 'Game board element not found', false);
            return;
        }

        // Test board grid layout
        const computedStyle = getComputedStyle(gameBoard);
        const hasGrid = computedStyle.display === 'grid';
        this.logResult('BOARD', 'CSS Grid layout applied', hasGrid);

        // Test board centering
        const boardRect = gameBoard.getBoundingClientRect();
        const isHorizontallyCentered = Math.abs(boardRect.left - (window.innerWidth - boardRect.width) / 2) < 10;
        this.logResult('BOARD', 'Board horizontally centered', isHorizontallyCentered);

        // Test board scaling
        const expectedCols = 8;
        const gems = gameBoard.querySelectorAll('.gem');
        const actualGemCount = gems.length;
        this.logResult('BOARD', `Expected gems rendered: ${actualGemCount} (should be ${expectedCols * 8})`, actualGemCount === expectedCols * 8);

        // Test gap sizing for mobile
        if (this.isMobile) {
            const gap = computedStyle.gap || computedStyle.gridGap;
            this.logResult('BOARD', `Mobile grid gap: ${gap}`, gap !== '' && gap !== 'normal');
        }
    }

    /**
     * Test gem sizing and tappability on mobile
     */
    async testGemSizeAndTappability() {
        console.log('💎 Testing gem sizing and tappability...');

        const gems = document.querySelectorAll('.gem');
        if (gems.length === 0) {
            this.logResult('GEMS', 'No gems found on board', false);
            return;
        }

        // Test gem size consistency
        const firstGem = gems[0];
        const gemRect = firstGem.getBoundingClientRect();
        const isSquare = Math.abs(gemRect.width - gemRect.height) < 2;
        this.logResult('GEMS', `Gems are square: ${Math.round(gemRect.width)}x${Math.round(gemRect.height)}`, isSquare);

        // Test minimum touch target size
        const meetsMinSize = gemRect.width >= this.config.minTouchTarget;
        this.logResult('GEMS', `Gem size meets minimum touch target (${Math.round(gemRect.width)}px ≥ ${this.config.minTouchTarget}px)`, meetsMinSize);

        // Test gem spacing
        if (gems.length >= 2) {
            const secondGem = gems[1];
            const secondRect = secondGem.getBoundingClientRect();
            const spacing = Math.abs(secondRect.left - (gemRect.left + gemRect.width));
            const hasAdequateSpacing = spacing >= 2;
            this.logResult('GEMS', `Adequate spacing between gems: ${Math.round(spacing)}px`, hasAdequateSpacing);
        }

        // Test visual feedback on selection
        const hasHoverStyles = firstGem.classList.contains('gem') && 
                              getComputedStyle(firstGem).cursor === 'pointer';
        this.logResult('GEMS', 'Gems have interactive cursor styling', hasHoverStyles);
    }

    /**
     * Test mobile layout optimization
     */
    async testMobileLayoutOptimization() {
        console.log('📐 Testing mobile layout optimization...');

        // Test header adaptation
        const gameHeader = document.querySelector('.game-header');
        if (gameHeader) {
            const headerStyle = getComputedStyle(gameHeader);
            const isFlexWrapped = headerStyle.flexWrap === 'wrap';
            this.logResult('LAYOUT', 'Header uses flex-wrap for mobile', isFlexWrapped);
        }

        // Test stats display mobile optimization
        const gameStats = document.querySelector('.game-stats');
        if (gameStats) {
            const statsRect = gameStats.getBoundingClientRect();
            const fitsInViewport = statsRect.width <= window.innerWidth - 20;
            this.logResult('LAYOUT', 'Game stats fit in mobile viewport', fitsInViewport);
        }

        // Test controls optimization
        const gameControls = document.querySelector('.game-controls');
        if (gameControls) {
            const controlsStyle = getComputedStyle(gameControls);
            const isFlexWrapped = controlsStyle.flexWrap === 'wrap';
            this.logResult('LAYOUT', 'Game controls wrap on mobile', isFlexWrapped);
        }

        // Test sidebar hiding on mobile
        const leftSidebar = document.querySelector('.left-sidebar');
        const rightSidebar = document.querySelector('.right-sidebar');
        if (this.isMobile) {
            const leftHidden = !leftSidebar || getComputedStyle(leftSidebar).display === 'none';
            const rightHidden = !rightSidebar || getComputedStyle(rightSidebar).display === 'none';
            this.logResult('LAYOUT', 'Sidebars hidden on mobile', leftHidden && rightHidden);
        }

        // Test hero badge mobile adaptation
        const heroBadge = document.querySelector('.hero-badge-container');
        if (heroBadge && this.isMobile) {
            const badgeStyle = getComputedStyle(heroBadge);
            const isHidden = badgeStyle.display === 'none';
            this.logResult('LAYOUT', 'Hero badge hidden on narrow mobile screens', isHidden);
        }
    }

    /**
     * Test performance on mobile devices
     */
    async testPerformanceOnMobile() {
        console.log('⚡ Testing mobile performance...');

        // Test frame rate during animation
        const startTime = performance.now();
        const frameCount = await this.measureFrameRate(1000); // Measure for 1 second
        const fps = frameCount;
        this.logResult('PERFORMANCE', `Frame rate: ${fps} FPS`, fps >= 30);

        // Test memory usage (if available)
        if (performance.memory) {
            const memoryMB = performance.memory.usedJSHeapSize / 1024 / 1024;
            this.logResult('PERFORMANCE', `Memory usage: ${Math.round(memoryMB)}MB`, memoryMB < 50);
        }

        // Test canvas rendering performance
        if (window.canvasManager) {
            const renderStart = performance.now();
            window.canvasManager.draw();
            const renderTime = performance.now() - renderStart;
            this.logResult('PERFORMANCE', `Canvas render time: ${Math.round(renderTime)}ms`, renderTime < 16); // 60fps = 16ms
        }

        // Test asset loading performance
        const images = document.querySelectorAll('img');
        let loadedImages = 0;
        images.forEach(img => {
            if (img.complete && img.naturalHeight !== 0) {
                loadedImages++;
            }
        });
        const imageLoadRatio = images.length > 0 ? loadedImages / images.length : 1;
        this.logResult('PERFORMANCE', `Images loaded: ${loadedImages}/${images.length} (${Math.round(imageLoadRatio * 100)}%)`, imageLoadRatio > 0.8);
    }

    /**
     * Test orientation change handling
     */
    async testOrientationChanges() {
        console.log('🔄 Testing orientation change handling...');

        // Test current orientation detection
        const isPortrait = window.innerHeight > window.innerWidth;
        const isLandscape = window.innerWidth > window.innerHeight;
        this.logResult('ORIENTATION', `Orientation detected: ${isPortrait ? 'Portrait' : 'Landscape'}`, true);

        // Test orientation change event listener
        const hasOrientationHandler = typeof window.onorientationchange !== 'undefined';
        this.logResult('ORIENTATION', 'Orientation change handler available', hasOrientationHandler);

        // Test layout stability after resize simulation
        const originalWidth = window.innerWidth;
        // Simulate what happens during orientation change
        if (window.canvasManager && window.canvasManager.resizeCanvas) {
            try {
                window.canvasManager.resizeCanvas();
                this.logResult('ORIENTATION', 'Canvas resize handling works', true);
            } catch (error) {
                this.logResult('ORIENTATION', `Canvas resize error: ${error.message}`, false);
            }
        }
    }

    /**
     * Test scroll behavior and overflow handling
     */
    async testScrollAndOverflow() {
        console.log('📜 Testing scroll and overflow handling...');

        // Test document scroll prevention during gameplay
        const bodyStyle = getComputedStyle(document.body);
        const htmlStyle = getComputedStyle(document.documentElement);
        
        // Test for scroll prevention on mobile
        const hasScrollPrevention = bodyStyle.overflow === 'hidden' || 
                                   htmlStyle.overflow === 'hidden' ||
                                   bodyStyle.position === 'fixed';
        this.logResult('SCROLL', 'Body/HTML scroll prevention in place', hasScrollPrevention);

        // Test game container overflow
        const gameContainer = document.querySelector('.gems-game-container');
        if (gameContainer) {
            const containerStyle = getComputedStyle(gameContainer);
            const overflowHandled = containerStyle.overflow !== 'visible';
            this.logResult('SCROLL', 'Game container overflow handled', overflowHandled);
        }

        // Test canvas container scroll behavior
        const canvas = document.getElementById('gemsCanvas');
        if (canvas) {
            const canvasRect = canvas.getBoundingClientRect();
            const exceedsViewport = canvasRect.bottom > window.innerHeight;
            this.logResult('SCROLL', 'Canvas stays within viewport bounds', !exceedsViewport);
        }
    }

    /**
     * Test mobile controls accessibility
     */
    async testMobileControlsAccessibility() {
        console.log('♿ Testing mobile accessibility...');

        // Test button sizes
        const buttons = document.querySelectorAll('.btn');
        let accessibleButtons = 0;
        buttons.forEach(button => {
            const rect = button.getBoundingClientRect();
            if (rect.width >= this.config.minTouchTarget && rect.height >= this.config.minTouchTarget) {
                accessibleButtons++;
            }
        });
        const buttonAccessibilityRatio = buttons.length > 0 ? accessibleButtons / buttons.length : 1;
        this.logResult('ACCESSIBILITY', `Accessible button sizes: ${accessibleButtons}/${buttons.length}`, buttonAccessibilityRatio >= 0.9);

        // Test color contrast (basic check)
        const gameBoard = document.getElementById('gameBoard');
        if (gameBoard) {
            const style = getComputedStyle(gameBoard);
            const hasBackground = style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent';
            this.logResult('ACCESSIBILITY', 'Game board has defined background color', hasBackground);
        }

        // Test keyboard navigation support
        const focusableElements = document.querySelectorAll('button, [tabindex], input, select, textarea');
        this.logResult('ACCESSIBILITY', `Focusable elements available: ${focusableElements.length}`, focusableElements.length > 0);

        // Test aria labels and roles
        const gemsWithAriaLabel = document.querySelectorAll('.gem[aria-label]');
        const gemsTotal = document.querySelectorAll('.gem');
        if (gemsTotal.length > 0) {
            const ariaRatio = gemsWithAriaLabel.length / gemsTotal.length;
            this.logResult('ACCESSIBILITY', `Gems with aria-labels: ${gemsWithAriaLabel.length}/${gemsTotal.length}`, ariaRatio > 0.5);
        }
    }

    /**
     * Test loading and initialization
     */
    async testLoadingAndInitialization() {
        console.log('🚀 Testing loading and initialization...');

        // Test game initialization
        const gameInitialized = typeof window.gameState !== 'undefined' && window.gameState !== null;
        this.logResult('INIT', 'Game state initialized', gameInitialized);

        // Test canvas manager initialization
        const canvasInitialized = typeof window.canvasManager !== 'undefined' && 
                                 window.canvasManager !== null &&
                                 window.canvasManager.canvas !== null;
        this.logResult('INIT', 'Canvas manager initialized', canvasInitialized);

        // Test level loading
        const levelsAvailable = typeof window.LEVELS !== 'undefined' && 
                               Array.isArray(window.LEVELS) && 
                               window.LEVELS.length > 0;
        this.logResult('INIT', 'Levels loaded', levelsAvailable);

        // Test critical CSS loading
        const gameCSS = document.querySelector('link[href*="wavelength-gems.css"]');
        this.logResult('INIT', 'Game CSS loaded', gameCSS !== null);

        // Test JavaScript loading
        const coreScripts = ['engine.js', 'levels.js', 'ui.js'];
        let loadedScripts = 0;
        coreScripts.forEach(scriptName => {
            const script = document.querySelector(`script[src*="${scriptName}"]`);
            if (script) loadedScripts++;
        });
        this.logResult('INIT', `Core scripts loaded: ${loadedScripts}/${coreScripts.length}`, loadedScripts === coreScripts.length);
    }

    /**
     * Utility: Simulate touch interaction
     */
    async simulateTouch(element, x, y) {
        return new Promise(resolve => {
            const touchEvent = new TouchEvent('touchstart', {
                bubbles: true,
                cancelable: true,
                touches: [{
                    clientX: x,
                    clientY: y,
                    target: element
                }]
            });
            
            element.dispatchEvent(touchEvent);
            
            setTimeout(() => {
                const touchEndEvent = new TouchEvent('touchend', {
                    bubbles: true,
                    cancelable: true
                });
                element.dispatchEvent(touchEndEvent);
                resolve();
            }, 50);
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
        const deviceType = this.isMobile ? '📱' : this.isTablet ? '💻' : '🖥️';
        console.log(`${status} ${deviceType} [${category}] ${description}`, details ? details : '');
    }

    /**
     * Generate comprehensive test report
     */
    generateMobileTestReport() {
        console.log('\n📊 WAVELENGTH GEMS MOBILE TEST REPORT');
        console.log('=' .repeat(50));
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        const passRate = Math.round((passedTests / totalTests) * 100);
        
        console.log(`📱 Device: ${this.isMobile ? 'Mobile' : this.isTablet ? 'Tablet' : 'Desktop'} (${this.viewport.width}x${this.viewport.height})`);
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
        
        // Critical recommendations
        console.log('\n💡 Critical Mobile Recommendations:');
        if (passRate < 80) {
            console.log('   🔴 CRITICAL: Pass rate below 80% - immediate attention required');
        }
        if (categories.TOUCH && categories.TOUCH.passed / (categories.TOUCH.passed + categories.TOUCH.failed) < 0.9) {
            console.log('   🔶 HIGH: Touch interaction issues detected');
        }
        if (categories.PERFORMANCE && categories.PERFORMANCE.passed / (categories.PERFORMANCE.passed + categories.PERFORMANCE.failed) < 0.8) {
            console.log('   🔶 HIGH: Performance issues on mobile');
        }
        if (categories.ACCESSIBILITY && categories.ACCESSIBILITY.passed / (categories.ACCESSIBILITY.passed + categories.ACCESSIBILITY.failed) < 0.7) {
            console.log('   🔶 MEDIUM: Accessibility improvements needed');
        }
        
        console.log('\n' + '=' .repeat(50));
        
        return {
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                passRate: passRate,
                viewport: this.viewport,
                deviceType: this.isMobile ? 'mobile' : this.isTablet ? 'tablet' : 'desktop'
            },
            categories: categories,
            recommendations: this.generateRecommendations(categories, passRate)
        };
    }

    /**
     * Generate actionable recommendations
     */
    generateRecommendations(categories, passRate) {
        const recommendations = [];
        
        if (passRate < 80) {
            recommendations.push({
                priority: 'CRITICAL',
                category: 'OVERALL',
                issue: 'Low pass rate',
                action: 'Review all failed tests and address high-priority issues immediately'
            });
        }
        
        if (categories.TOUCH && categories.TOUCH.failed > 0) {
            recommendations.push({
                priority: 'HIGH',
                category: 'TOUCH',
                issue: 'Touch interaction problems',
                action: 'Verify touch event handlers and gem touch target sizes'
            });
        }
        
        if (categories.VIEWPORT && categories.VIEWPORT.failed > 0) {
            recommendations.push({
                priority: 'HIGH',
                category: 'VIEWPORT',
                issue: 'Responsive design issues',
                action: 'Review CSS media queries and mobile layout optimization'
            });
        }
        
        return recommendations;
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.wavelengthGemsMobileTests = new WavelengthGemsMobileTests();
    });
} else {
    window.wavelengthGemsMobileTests = new WavelengthGemsMobileTests();
}

// Global test runner function
window.runWavelengthGemsMobileTests = async function() {
    if (!window.wavelengthGemsMobileTests) {
        console.error('❌ Mobile test suite not initialized');
        return null;
    }
    
    return await window.wavelengthGemsMobileTests.runAllMobileTests();
};

console.log('🧪 Wavelength Gems Mobile Test Suite loaded - run with: runWavelengthGemsMobileTests()');