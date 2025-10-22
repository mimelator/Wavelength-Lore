/**
 * Auto-Diagnostics System for Wavelength Gems - DISABLED FOR ADMOB TESTING
 * Automatically checks for common issues on page load and provides detailed reports
 * 
 * This file has been fully disabled to reduce console noise during AdMob integration testing.
 */

class AutoDiagnostics {
    constructor() {
        // Initialize arrays even though diagnostics are disabled
        this.issues = [];
        this.warnings = [];
        this.info = [];
    }

    /**
     * Run all diagnostic checks - DISABLED FOR ADMOB TESTING
     */
    async runAll() {
        // Completely disabled - no console output
        return;
        
        // Original code - commented out
        /* 
        console.log('%c🔍 AUTO-DIAGNOSTICS STARTING...', 'color: #3B82F6; font-size: 16px; font-weight: bold;');
        console.log('═'.repeat(80));

        // Wait for DOM to be fully loaded
        await this.waitForDOM();
        */

        // Run checks
        this.checkViewport();
        this.checkGameBoard();
        this.checkHeroBadge();
        this.checkSidebars();
        this.checkCanvas();
        this.checkLevelConfig();

        // Report results
        this.generateReport();
    }

    /**
     * Wait for DOM elements to be ready
     */
    waitForDOM() {
        return new Promise(resolve => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                window.addEventListener('load', resolve);
            }
        });
    }

    /**
     * Check viewport and screen size
     */
    checkViewport() {
        console.log('%c📏 Checking Viewport...', 'color: #10B981; font-weight: bold;');
        
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        console.log(`  Viewport: ${width}x${height}`);
        
        // Updated breakpoint from 1400px to 1100px
        if (width < 1100) {
            this.warnings.push({
                category: 'Viewport',
                message: `Viewport width (${width}px) is below 1100px - hero badge will be hidden`,
                suggestion: 'Increase browser window width to at least 1100px to see hero badge'
            });
        }
        
        if (width < 1000) {
            this.warnings.push({
                category: 'Viewport',
                message: `Viewport width (${width}px) is below 1000px - sidebars will be hidden`,
                suggestion: 'Increase browser window width to see sidebars'
            });
        }

        this.info.push({
            category: 'Viewport',
            message: `Screen: ${width}x${height}`,
            details: `Device pixel ratio: ${window.devicePixelRatio}, Hero badge: ${width >= 1100 ? 'VISIBLE' : 'HIDDEN'}`
        });
    }

    /**
     * Check game board structure and positioning
     */
    checkGameBoard() {
        console.log('%c🎮 Checking Game Board...', 'color: #10B981; font-weight: bold;');
        
        const gameBoard = document.getElementById('gameBoard');
        const wrapper = document.querySelector('.game-board-wrapper');
        
        if (!gameBoard) {
            this.issues.push({
                category: 'Game Board',
                message: 'gameBoard element not found!',
                suggestion: 'Check if element ID is correct in HTML'
            });
            return;
        }

        if (!wrapper) {
            this.issues.push({
                category: 'Game Board',
                message: 'game-board-wrapper element not found!',
                suggestion: 'Check if wrapper class exists in HTML'
            });
            return;
        }

        // Check positioning
        const boardStyles = window.getComputedStyle(gameBoard);
        const wrapperStyles = window.getComputedStyle(wrapper);
        
        console.log(`  Game Board:`);
        console.log(`    Position: ${boardStyles.position}`);
        console.log(`    Width: ${boardStyles.width}`);
        console.log(`    Height: ${boardStyles.height}`);
        
        console.log(`  Wrapper:`);
        console.log(`    Display: ${wrapperStyles.display}`);
        console.log(`    Justify: ${wrapperStyles.justifyContent}`);
        console.log(`    Overflow: ${wrapperStyles.overflow}`);

        if (boardStyles.position !== 'relative') {
            this.warnings.push({
                category: 'Game Board',
                message: `gameBoard position is "${boardStyles.position}" instead of "relative"`,
                suggestion: 'Hero badge may not position correctly - should be relative'
            });
        }

        this.info.push({
            category: 'Game Board',
            message: `Board size: ${boardStyles.width} x ${boardStyles.height}`,
            details: `Position: ${boardStyles.position}`
        });
    }

    /**
     * Check hero badge positioning and visibility
     */
    checkHeroBadge() {
        console.log('%c👤 Checking Hero Badge...', 'color: #10B981; font-weight: bold;');
        
        const heroBadge = document.getElementById('heroBadge');
        const heroBadgeImage = document.getElementById('heroBadgeImage');
        
        if (!heroBadge) {
            this.issues.push({
                category: 'Hero Badge',
                message: 'Hero badge element not found!',
                suggestion: 'Check if heroBadge element exists in HTML'
            });
            return;
        }

        if (!heroBadgeImage) {
            this.issues.push({
                category: 'Hero Badge',
                message: 'Hero badge image element not found!',
                suggestion: 'Check if heroBadgeImage element exists in HTML'
            });
            return;
        }

        // Check parent element
        const parent = heroBadge.parentElement;
        console.log(`  Parent element: ${parent?.id || parent?.className || 'unknown'}`);
        
        if (parent?.id !== 'gameBoard') {
            this.warnings.push({
                category: 'Hero Badge',
                message: `Hero badge parent is "${parent?.id || parent?.className}" instead of "gameBoard"`,
                suggestion: 'Badge should be child of gameBoard for correct positioning'
            });
        }

        // Check computed styles
        const styles = window.getComputedStyle(heroBadge);
        const imgStyles = window.getComputedStyle(heroBadgeImage);
        
        console.log(`  Badge Styles:`);
        console.log(`    Display: ${styles.display}`);
        console.log(`    Position: ${styles.position}`);
        console.log(`    Left: ${styles.left}`);
        console.log(`    Top: ${styles.top}`);
        console.log(`    Width: ${styles.width}`);
        console.log(`    Z-index: ${styles.zIndex}`);
        console.log(`    Visibility: ${styles.visibility}`);
        console.log(`    Opacity: ${styles.opacity}`);

        // Check image
        console.log(`  Image:`);
        console.log(`    Source: ${heroBadgeImage.src || 'not set'}`);
        console.log(`    Complete: ${heroBadgeImage.complete}`);
        console.log(`    Natural size: ${heroBadgeImage.naturalWidth}x${heroBadgeImage.naturalHeight}`);
        console.log(`    Border: ${imgStyles.border}`);

        // Check visibility
        if (styles.display === 'none') {
            this.warnings.push({
                category: 'Hero Badge',
                message: 'Hero badge is hidden (display: none)',
                suggestion: 'Likely due to viewport width < 1400px - increase window size'
            });
        }

        if (parseFloat(styles.opacity) < 0.1) {
            this.warnings.push({
                category: 'Hero Badge',
                message: `Hero badge opacity is very low (${styles.opacity})`,
                suggestion: 'Badge may be invisible'
            });
        }

        // Check image loading
        if (!heroBadgeImage.src || heroBadgeImage.src.includes('undefined')) {
            this.warnings.push({
                category: 'Hero Badge',
                message: 'Hero badge image source not set or invalid',
                suggestion: 'Wait for level to load, or check if level config has heroImage field'
            });
        } else if (!heroBadgeImage.complete) {
            this.warnings.push({
                category: 'Hero Badge',
                message: 'Hero badge image is still loading',
                suggestion: 'Wait a moment for image to load'
            });
        } else if (heroBadgeImage.naturalWidth === 0) {
            this.issues.push({
                category: 'Hero Badge',
                message: 'Hero badge image failed to load',
                suggestion: `Check if image exists at: ${heroBadgeImage.src}`
            });
        }

        // Check positioning values
        const leftValue = parseFloat(styles.left);
        if (leftValue > 0) {
            this.warnings.push({
                category: 'Hero Badge',
                message: `Hero badge left position is positive (${styles.left}) - it should be negative to appear on left`,
                suggestion: 'Badge may be overlapping the game board instead of being to the left'
            });
        }

        this.info.push({
            category: 'Hero Badge',
            message: `Badge positioned at left: ${styles.left}, width: ${styles.width}`,
            details: `Parent: ${parent?.id || parent?.className}, Image: ${heroBadgeImage.complete ? 'loaded' : 'loading'}`
        });
    }

    /**
     * Check sidebar visibility
     */
    checkSidebars() {
        console.log('%c📱 Checking Sidebars...', 'color: #10B981; font-weight: bold;');
        
        const leftSidebar = document.querySelector('.left-sidebar');
        const rightSidebar = document.querySelector('.right-sidebar');
        
        if (leftSidebar) {
            const styles = window.getComputedStyle(leftSidebar);
            console.log(`  Left Sidebar: display=${styles.display}`);
            
            if (styles.display === 'none' && window.innerWidth >= 1000) {
                this.warnings.push({
                    category: 'Sidebar',
                    message: 'Left sidebar hidden despite viewport > 1000px',
                    suggestion: 'Check CSS media queries'
                });
            }
        }

        if (rightSidebar) {
            const styles = window.getComputedStyle(rightSidebar);
            console.log(`  Right Sidebar: display=${styles.display}`);
        }
    }

    /**
     * Check canvas and rendering
     */
    checkCanvas() {
        console.log('%c🎨 Checking Canvas...', 'color: #10B981; font-weight: bold;');
        
        const canvas = document.getElementById('gameCanvas');
        
        if (!canvas) {
            // This is expected on initial load - canvas is created by game engine
            console.log('  ℹ️  Canvas not yet created (will be created by game engine)');
            this.info.push({
                category: 'Canvas',
                message: 'Canvas not yet created',
                details: 'This is normal - canvas is created dynamically by the game engine after initialization'
            });
            return;
        }

        const ctx = canvas.getContext('2d');
        console.log(`  Canvas: ${canvas.width}x${canvas.height}`);
        console.log(`  Context: ${ctx ? 'available' : 'not available'}`);

        this.info.push({
            category: 'Canvas',
            message: `Canvas created: ${canvas.width}x${canvas.height}`,
            details: `Context available: ${!!ctx}`
        });
    }

    /**
     * Check level configuration
     */
    checkLevelConfig() {
        console.log('%c⚙️ Checking Level Config...', 'color: #10B981; font-weight: bold;');
        
        if (typeof window.currentLevel !== 'undefined') {
            console.log(`  Current Level: ${window.currentLevel}`);
            this.info.push({
                category: 'Level',
                message: `Current level: ${window.currentLevel}`,
                details: 'Level config loaded'
            });
        } else {
            this.warnings.push({
                category: 'Level',
                message: 'Current level not set',
                suggestion: 'Game may not be initialized yet'
            });
        }

        if (typeof window.levelConfig !== 'undefined' && window.levelConfig) {
            const config = window.levelConfig;
            console.log(`  Level Title: ${config.title}`);
            console.log(`  Hero Image: ${config.theme?.heroImage || 'not set'}`);
            
            if (!config.theme?.heroImage) {
                this.warnings.push({
                    category: 'Level Config',
                    message: 'Level config does not have heroImage field',
                    suggestion: 'Add heroImage to level configuration in YAML'
                });
            }

            this.info.push({
                category: 'Level Config',
                message: `Level: ${config.title}`,
                details: `Hero Image: ${config.theme?.heroImage || 'not set'}`
            });
        }
    }

    /**
     * Generate and display diagnostic report
     */
    generateReport() {
        console.log('═'.repeat(80));
        console.log('%c📊 DIAGNOSTIC REPORT', 'color: #3B82F6; font-size: 16px; font-weight: bold;');
        console.log('═'.repeat(80));

        // Show issues (critical problems)
        if (this.issues.length > 0) {
            console.log('%c🔴 ISSUES FOUND:', 'color: #DC2626; font-weight: bold;');
            this.issues.forEach((issue, i) => {
                console.log(`\n  ${i + 1}. [${issue.category}] ${issue.message}`);
                console.log(`     💡 ${issue.suggestion}`);
            });
        }

        // Show warnings (potential problems)
        if (this.warnings.length > 0) {
            console.log('\n%c⚠️ WARNINGS:', 'color: #F59E0B; font-weight: bold;');
            this.warnings.forEach((warning, i) => {
                console.log(`\n  ${i + 1}. [${warning.category}] ${warning.message}`);
                console.log(`     💡 ${warning.suggestion}`);
            });
        }

        // Show info
        if (this.info.length > 0) {
            console.log('\n%cℹ️ INFORMATION:', 'color: #3B82F6; font-weight: bold;');
            this.info.forEach((info, i) => {
                console.log(`\n  ${i + 1}. [${info.category}] ${info.message}`);
                if (info.details) {
                    console.log(`     📝 ${info.details}`);
                }
            });
        }

        // Summary
        console.log('\n' + '═'.repeat(80));
        console.log(`%c✓ Diagnostics Complete`, 'color: #10B981; font-weight: bold;');
        console.log(`  Issues: ${this.issues.length} | Warnings: ${this.warnings.length} | Info: ${this.info.length}`);
        console.log('═'.repeat(80));

        // Recommendations
        if (this.issues.length > 0 || this.warnings.length > 0) {
            console.log('\n%c🔧 QUICK FIXES:', 'color: #8B5CF6; font-weight: bold;');
            if (window.innerWidth < 1100) {
                console.log('  • Increase browser window width to at least 1100px to see hero badge');
            }
            if (this.warnings.some(w => w.category === 'Hero Badge' && w.message.includes('parent'))) {
                console.log('  • Move hero badge element inside #gameBoard container');
            }
            if (this.warnings.some(w => w.category === 'Level Config')) {
                console.log('  • Wait for level to load, or check level configuration');
            }
        }
    }

    /**
     * Run diagnostics when hero badge should appear
     */
    checkHeroBadgeAfterLoad() {
        setTimeout(() => {
            console.log('\n%c🔄 RE-CHECKING HERO BADGE AFTER LOAD...', 'color: #8B5CF6; font-weight: bold;');
            this.checkHeroBadge();
            
            if (this.warnings.length > 0 || this.issues.length > 0) {
                console.log('\n%c⚠️ New issues detected:', 'color: #F59E0B; font-weight: bold;');
                [...this.warnings, ...this.issues].forEach(item => {
                    console.log(`  [${item.category}] ${item.message}`);
                });
            } else {
                console.log('%c✓ Hero badge appears to be configured correctly!', 'color: #10B981; font-weight: bold;');
            }
        }, 1500);
    }
}

// Auto-run diagnostics on page load - DISABLED FOR ADMOB TESTING
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const diagnostics = new AutoDiagnostics();
        // Only run the initialization method, not the additional checks
        diagnostics.runAll();
        // Don't run checkHeroBadgeAfterLoad() - disabled for AdMob testing
    });
} else {
    const diagnostics = new AutoDiagnostics();
    // Only run the initialization method, not the additional checks
    diagnostics.runAll();
    // Don't run checkHeroBadgeAfterLoad() - disabled for AdMob testing
}

// Export for manual use (but disabled)
window.AutoDiagnostics = AutoDiagnostics;
window.runDiagnostics = () => {
    console.log('Auto-diagnostics are disabled for AdMob testing.');
    return { disabled: true };
};
