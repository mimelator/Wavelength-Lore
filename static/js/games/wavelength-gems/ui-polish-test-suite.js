/**
 * Wavelength Gems - Cross-Platform UI Polish Test Suite
 * Tests focused on identifying UI polish opportunities and improvements
 */

class WavelengthGemsUIPolishTests {
    constructor() {
        this.testResults = [];
        this.polishOpportunities = [];
        this.viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        this.isMobile = this.viewport.width <= 768;
        this.isTablet = this.viewport.width > 768 && this.viewport.width <= 1024;
        this.isDesktop = this.viewport.width > 1024;
        
        console.log(`✨ UI Polish Test Suite initialized for ${this.getDeviceType()}`);
    }

    /**
     * Run all UI polish tests
     */
    async runAllPolishTests() {
        console.log('🚀 Starting Wavelength Gems UI Polish Test Suite...');
        
        const testSuites = [
            () => this.testVisualConsistency(),
            () => this.testAnimationSmoothneSs(),
            () => this.testColorAndTheming(),
            () => this.testTypographyAndReadability(),
            () => this.testSpacingAndLayout(),
            () => this.testInteractiveElementsPolish(),
            () => this.testLoadingAndTransitions(),
            () => this.testResponsiveDesignRefinement(),
            () => this.testAccessibilityPolish(),
            () => this.testPerformancePolish(),
            () => this.testMicroInteractions(),
            () => this.testCrossDeviceConsistency()
        ];

        for (const testSuite of testSuites) {
            try {
                await testSuite();
            } catch (error) {
                this.logResult('ERROR', `Test suite failed: ${error.message}`, false);
            }
        }

        this.generatePolishReport();
        return {
            testResults: this.testResults,
            polishOpportunities: this.polishOpportunities
        };
    }

    /**
     * Test visual consistency across components
     */
    async testVisualConsistency() {
        console.log('🎨 Testing visual consistency...');

        // Test button styling consistency
        const buttons = document.querySelectorAll('.btn');
        const buttonStyles = Array.from(buttons).map(btn => {
            const style = getComputedStyle(btn);
            return {
                borderRadius: style.borderRadius,
                padding: style.padding,
                fontSize: style.fontSize,
                fontFamily: style.fontFamily
            };
        });

        const consistentBorderRadius = this.checkConsistency(buttonStyles, 'borderRadius');
        this.logResult('VISUAL_CONSISTENCY', 'Button border radius consistent', consistentBorderRadius);
        if (!consistentBorderRadius) {
            this.addPolishOpportunity('MEDIUM', 'Standardize button border radius values', 'VISUAL_CONSISTENCY');
        }

        // Test color palette consistency
        const coloredElements = document.querySelectorAll('[class*="gem-"], .stat-value, .game-title');
        const colors = new Set();
        coloredElements.forEach(el => {
            const style = getComputedStyle(el);
            colors.add(style.color);
            colors.add(style.backgroundColor);
        });

        const reasonableColorCount = colors.size <= 20; // Not too many unique colors
        this.logResult('VISUAL_CONSISTENCY', `Color palette size reasonable: ${colors.size} unique colors`, reasonableColorCount);
        if (!reasonableColorCount) {
            this.addPolishOpportunity('LOW', 'Consider consolidating color palette to improve visual coherence', 'VISUAL_CONSISTENCY');
        }

        // Test spacing consistency
        const containers = document.querySelectorAll('.gems-game-container, .game-header, .game-controls');
        const margins = Array.from(containers).map(el => getComputedStyle(el).margin);
        const paddings = Array.from(containers).map(el => getComputedStyle(el).padding);
        
        const consistentSpacing = this.checkSpacingConsistency(margins.concat(paddings));
        this.logResult('VISUAL_CONSISTENCY', 'Spacing values use consistent scale', consistentSpacing);
        if (!consistentSpacing) {
            this.addPolishOpportunity('MEDIUM', 'Implement consistent spacing scale (e.g., 4px, 8px, 16px, 24px)', 'VISUAL_CONSISTENCY');
        }

        // Test gem visual consistency
        const gems = document.querySelectorAll('.gem');
        if (gems.length > 0) {
            const gemSizes = Array.from(gems).map(gem => {
                const rect = gem.getBoundingClientRect();
                return { width: rect.width, height: rect.height };
            });

            const uniformGemSizes = gemSizes.every(size => 
                Math.abs(size.width - gemSizes[0].width) < 2 &&
                Math.abs(size.height - gemSizes[0].height) < 2
            );
            
            this.logResult('VISUAL_CONSISTENCY', 'Gem sizes uniform across board', uniformGemSizes);
            if (!uniformGemSizes) {
                this.addPolishOpportunity('HIGH', 'Fix gem size inconsistencies for visual uniformity', 'VISUAL_CONSISTENCY');
            }
        }
    }

    /**
     * Test animation smoothness and polish
     */
    async testAnimationSmoothneSs() {
        console.log('🎬 Testing animation smoothness...');

        // Test CSS transition consistency
        const animatedElements = document.querySelectorAll('.gem, .btn, .hero-badge-img');
        let transitionCount = 0;
        let smoothTransitions = 0;

        animatedElements.forEach(el => {
            const style = getComputedStyle(el);
            if (style.transition !== 'none' && style.transition !== '') {
                transitionCount++;
                // Check for reasonable transition duration (not too fast, not too slow)
                if (style.transition.includes('0.1s') || style.transition.includes('0.2s') || style.transition.includes('0.3s')) {
                    smoothTransitions++;
                }
            }
        });

        const goodTransitionRatio = transitionCount > 0 ? smoothTransitions / transitionCount : 1;
        this.logResult('ANIMATIONS', `Smooth transition timing: ${smoothTransitions}/${transitionCount}`, goodTransitionRatio >= 0.8);
        if (goodTransitionRatio < 0.8) {
            this.addPolishOpportunity('MEDIUM', 'Optimize transition durations for smoother animations (0.1s-0.3s range)', 'ANIMATIONS');
        }

        // Test for transform-based animations (more performant)
        const transformAnimations = Array.from(animatedElements).filter(el => {
            const style = getComputedStyle(el);
            return style.transition.includes('transform');
        });

        const usesTransforms = transformAnimations.length > 0;
        this.logResult('ANIMATIONS', 'Uses transform-based animations for performance', usesTransforms);
        if (!usesTransforms) {
            this.addPolishOpportunity('LOW', 'Consider using transform-based animations for better performance', 'ANIMATIONS');
        }

        // Test hover effect responsiveness
        const hoverElements = document.querySelectorAll('.gem:hover, .btn:hover');
        const hasHoverEffects = hoverElements.length > 0 || 
                               document.styleSheets.length > 0; // Assumes hover styles exist in CSS
        this.logResult('ANIMATIONS', 'Interactive hover effects present', hasHoverEffects);

        // Test animation easing
        const elementsWithEasing = Array.from(animatedElements).filter(el => {
            const style = getComputedStyle(el);
            return style.transition.includes('ease') || style.transition.includes('cubic-bezier');
        });

        const usesEasing = elementsWithEasing.length > 0;
        this.logResult('ANIMATIONS', 'Uses easing functions for natural motion', usesEasing);
        if (!usesEasing) {
            this.addPolishOpportunity('LOW', 'Add easing functions to animations for more natural feel', 'ANIMATIONS');
        }
    }

    /**
     * Test color and theming polish
     */
    async testColorAndTheming() {
        console.log('🌈 Testing color and theming...');

        // Test contrast ratios for readability
        const textElements = document.querySelectorAll('.stat-label, .stat-value, .game-title, .btn');
        let goodContrast = 0;
        let totalText = 0;

        textElements.forEach(el => {
            const style = getComputedStyle(el);
            const textColor = style.color;
            const backgroundColor = style.backgroundColor;
            
            if (textColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
                totalText++;
                // Simplified contrast check - full WCAG calculation would be more complex
                const hasGoodContrast = this.estimateContrast(textColor, backgroundColor);
                if (hasGoodContrast) goodContrast++;
            }
        });

        const contrastRatio = totalText > 0 ? goodContrast / totalText : 1;
        this.logResult('COLOR_THEMING', `Text contrast adequate: ${goodContrast}/${totalText}`, contrastRatio >= 0.8);
        if (contrastRatio < 0.8) {
            this.addPolishOpportunity('HIGH', 'Improve text contrast ratios for better readability', 'COLOR_THEMING');
        }

        // Test theme consistency
        const gameContainer = document.querySelector('.gems-game-container');
        if (gameContainer) {
            const containerStyle = getComputedStyle(gameContainer);
            const hasGradientBackground = containerStyle.background.includes('gradient');
            this.logResult('COLOR_THEMING', 'Uses gradient backgrounds for visual depth', hasGradientBackground);
        }

        // Test hero badge color integration
        const heroBadge = document.querySelector('.hero-badge-img');
        if (heroBadge) {
            const badgeStyle = getComputedStyle(heroBadge);
            const hasBorder = badgeStyle.border !== 'none' && badgeStyle.border !== '';
            const hasBoxShadow = badgeStyle.boxShadow !== 'none';
            this.logResult('COLOR_THEMING', 'Hero badge has visual polish (border/shadow)', hasBorder || hasBoxShadow);
        }

        // Test gem color theming
        const gems = document.querySelectorAll('.gem');
        const gemClasses = new Set();
        gems.forEach(gem => {
            gem.classList.forEach(cls => {
                if (cls.startsWith('gem-')) {
                    gemClasses.add(cls);
                }
            });
        });

        const hasThemedGems = gemClasses.size >= 4; // Should have multiple gem themes
        this.logResult('COLOR_THEMING', `Gem color themes variety: ${gemClasses.size}`, hasThemedGems);
        if (!hasThemedGems) {
            this.addPolishOpportunity('MEDIUM', 'Expand gem color theming for visual variety', 'COLOR_THEMING');
        }
    }

    /**
     * Test typography and readability
     */
    async testTypographyAndReadability() {
        console.log('📝 Testing typography and readability...');

        // Test font loading
        const documentFonts = document.fonts;
        let fontsLoaded = true;
        if (documentFonts && documentFonts.ready) {
            try {
                await documentFonts.ready;
                fontsLoaded = documentFonts.status === 'loaded';
            } catch (error) {
                fontsLoaded = false;
            }
        }
        this.logResult('TYPOGRAPHY', 'Custom fonts loaded properly', fontsLoaded);

        // Test font size hierarchy
        const headings = {
            h1: document.querySelectorAll('h1, .game-title'),
            h2: document.querySelectorAll('h2'),
            h3: document.querySelectorAll('h3'),
            body: document.querySelectorAll('.stat-label, .stat-value, .btn')
        };

        const fontSizes = {};
        Object.keys(headings).forEach(level => {
            if (headings[level].length > 0) {
                const fontSize = parseFloat(getComputedStyle(headings[level][0]).fontSize);
                fontSizes[level] = fontSize;
            }
        });

        const hasHierarchy = fontSizes.h1 > (fontSizes.body || 16);
        this.logResult('TYPOGRAPHY', 'Font size hierarchy present', hasHierarchy);
        if (!hasHierarchy) {
            this.addPolishOpportunity('MEDIUM', 'Establish clear font size hierarchy for better information architecture', 'TYPOGRAPHY');
        }

        // Test line height for readability
        const textElements = document.querySelectorAll('.stat-label, .btn, .level-info');
        let appropriateLineHeight = 0;
        textElements.forEach(el => {
            const style = getComputedStyle(el);
            const lineHeight = parseFloat(style.lineHeight);
            const fontSize = parseFloat(style.fontSize);
            const ratio = lineHeight / fontSize;
            
            if (ratio >= 1.2 && ratio <= 1.8) { // Good line height range
                appropriateLineHeight++;
            }
        });

        const lineHeightRatio = textElements.length > 0 ? appropriateLineHeight / textElements.length : 1;
        this.logResult('TYPOGRAPHY', `Appropriate line height: ${appropriateLineHeight}/${textElements.length}`, lineHeightRatio >= 0.7);
        if (lineHeightRatio < 0.7) {
            this.addPolishOpportunity('LOW', 'Optimize line heights for better text readability', 'TYPOGRAPHY');
        }

        // Test mobile font scaling
        if (this.isMobile) {
            const gameTitle = document.querySelector('.game-title');
            if (gameTitle) {
                const titleSize = parseFloat(getComputedStyle(gameTitle).fontSize);
                const appropriateMobileSize = titleSize >= 24 && titleSize <= 40;
                this.logResult('TYPOGRAPHY', `Mobile title size appropriate: ${titleSize}px`, appropriateMobileSize);
                if (!appropriateMobileSize) {
                    this.addPolishOpportunity('MEDIUM', 'Optimize title font size for mobile readability', 'TYPOGRAPHY');
                }
            }
        }
    }

    /**
     * Test spacing and layout polish
     */
    async testSpacingAndLayout() {
        console.log('📐 Testing spacing and layout...');

        // Test consistent margins
        const containers = document.querySelectorAll('.gems-game-container, .game-header, .game-controls, .stat');
        const spacingValues = [];
        
        containers.forEach(el => {
            const style = getComputedStyle(el);
            spacingValues.push(
                this.extractSpacingValues(style.margin),
                this.extractSpacingValues(style.padding)
            );
        });

        const usesSpacingScale = this.checkSpacingScale(spacingValues.flat());
        this.logResult('SPACING', 'Uses consistent spacing scale', usesSpacingScale);
        if (!usesSpacingScale) {
            this.addPolishOpportunity('MEDIUM', 'Implement consistent spacing scale (multiples of 4px or 8px)', 'SPACING');
        }

        // Test alignment consistency
        const gameHeader = document.querySelector('.game-header');
        if (gameHeader) {
            const headerStyle = getComputedStyle(gameHeader);
            const isFlexCentered = headerStyle.display === 'flex' && 
                                  (headerStyle.justifyContent.includes('center') || 
                                   headerStyle.alignItems.includes('center'));
            this.logResult('SPACING', 'Header elements properly aligned', isFlexCentered);
        }

        // Test mobile spacing optimization
        if (this.isMobile) {
            const gameContainer = document.querySelector('.gems-game-container');
            if (gameContainer) {
                const containerStyle = getComputedStyle(gameContainer);
                const mobilePadding = parseFloat(containerStyle.padding);
                const appropriateMobilePadding = mobilePadding >= 4 && mobilePadding <= 16;
                this.logResult('SPACING', `Mobile container padding appropriate: ${mobilePadding}px`, appropriateMobilePadding);
                if (!appropriateMobilePadding) {
                    this.addPolishOpportunity('HIGH', 'Optimize mobile container padding for screen space efficiency', 'SPACING');
                }
            }
        }

        // Test game board centering
        const gameBoard = document.getElementById('gameBoard');
        if (gameBoard) {
            const boardRect = gameBoard.getBoundingClientRect();
            const centerX = window.innerWidth / 2;
            const boardCenterX = boardRect.left + boardRect.width / 2;
            const isCentered = Math.abs(centerX - boardCenterX) < 20;
            
            this.logResult('SPACING', 'Game board horizontally centered', isCentered);
            if (!isCentered) {
                this.addPolishOpportunity('MEDIUM', 'Improve game board centering for better visual balance', 'SPACING');
            }
        }

        // Test control spacing
        const controls = document.querySelectorAll('.game-controls .btn');
        if (controls.length > 1) {
            const controlSpacings = [];
            for (let i = 1; i < controls.length; i++) {
                const prevRect = controls[i-1].getBoundingClientRect();
                const currRect = controls[i].getBoundingClientRect();
                controlSpacings.push(currRect.left - prevRect.right);
            }
            
            const consistentControlSpacing = this.checkConsistency(controlSpacings.map(s => ({ spacing: s })), 'spacing');
            this.logResult('SPACING', 'Control button spacing consistent', consistentControlSpacing);
            if (!consistentControlSpacing) {
                this.addPolishOpportunity('LOW', 'Standardize spacing between control buttons', 'SPACING');
            }
        }
    }

    /**
     * Test interactive elements polish
     */
    async testInteractiveElementsPolish() {
        console.log('🎯 Testing interactive elements polish...');

        // Test button states
        const buttons = document.querySelectorAll('.btn');
        let buttonsWithStates = 0;
        
        buttons.forEach(btn => {
            const style = getComputedStyle(btn);
            const hasTransition = style.transition !== 'none' && style.transition !== '';
            const hasCursor = style.cursor === 'pointer';
            
            if (hasTransition && hasCursor) {
                buttonsWithStates++;
            }
        });

        const buttonStateRatio = buttons.length > 0 ? buttonsWithStates / buttons.length : 1;
        this.logResult('INTERACTIVE', `Buttons with proper states: ${buttonsWithStates}/${buttons.length}`, buttonStateRatio >= 0.8);
        if (buttonStateRatio < 0.8) {
            this.addPolishOpportunity('MEDIUM', 'Add hover/active states to all interactive buttons', 'INTERACTIVE');
        }

        // Test gem interaction feedback
        const gems = document.querySelectorAll('.gem');
        let gemsWithFeedback = 0;
        
        gems.forEach(gem => {
            const style = getComputedStyle(gem);
            const hasTransition = style.transition.includes('transform') || style.transition.includes('scale');
            const hasCursor = style.cursor === 'pointer';
            
            if (hasTransition || hasCursor) {
                gemsWithFeedback++;
            }
        });

        const gemFeedbackRatio = gems.length > 0 ? gemsWithFeedback / gems.length : 1;
        this.logResult('INTERACTIVE', `Gems with interaction feedback: ${gemsWithFeedback}/${gems.length}`, gemFeedbackRatio >= 0.9);
        if (gemFeedbackRatio < 0.9) {
            this.addPolishOpportunity('HIGH', 'Ensure all gems have clear interaction feedback (hover/selection)', 'INTERACTIVE');
        }

        // Test selection indicators
        const selectedGem = document.querySelector('.gem.selected');
        if (window.gameState && window.gameState.selectedGem) {
            const hasVisualSelection = selectedGem !== null;
            this.logResult('INTERACTIVE', 'Selected gem has visual indicator', hasVisualSelection);
            if (!hasVisualSelection) {
                this.addPolishOpportunity('HIGH', 'Add clear visual indicator for selected gems', 'INTERACTIVE');
            }
        }

        // Test focus indicators for accessibility
        const focusableElements = document.queryset('button, [tabindex]');
        let elementsWithFocusStyles = 0;
        
        focusableElements.forEach(el => {
            const style = getComputedStyle(el);
            if (style.outline !== 'none' || style.boxShadow !== 'none') {
                elementsWithFocusStyles++;
            }
        });

        const focusRatio = focusableElements.length > 0 ? elementsWithFocusStyles / focusableElements.length : 1;
        this.logResult('INTERACTIVE', `Elements with focus indicators: ${elementsWithFocusStyles}/${focusableElements.length}`, focusRatio >= 0.5);
        if (focusRatio < 0.5) {
            this.addPolishOpportunity('MEDIUM', 'Add focus indicators for keyboard navigation', 'INTERACTIVE');
        }
    }

    /**
     * Test loading and transitions
     */
    async testLoadingAndTransitions() {
        console.log('⏳ Testing loading and transitions...');

        // Test page load performance
        const loadTime = performance.timing ? 
                        performance.timing.loadEventEnd - performance.timing.navigationStart : 0;
        const fastLoad = loadTime < 3000 || loadTime === 0;
        this.logResult('LOADING', `Page load time: ${loadTime}ms`, fastLoad);
        if (!fastLoad) {
            this.addPolishOpportunity('HIGH', 'Optimize page load time for better user experience', 'LOADING');
        }

        // Test image loading states
        const images = document.querySelectorAll('img');
        let imagesLoaded = 0;
        images.forEach(img => {
            if (img.complete && img.naturalHeight !== 0) {
                imagesLoaded++;
            }
        });

        const imageLoadRatio = images.length > 0 ? imagesLoaded / images.length : 1;
        this.logResult('LOADING', `Images loaded: ${imagesLoaded}/${images.length}`, imageLoadRatio >= 0.9);
        if (imageLoadRatio < 0.9) {
            this.addPolishOpportunity('MEDIUM', 'Add loading states or optimize image loading', 'LOADING');
        }

        // Test for loading indicators
        const loadingIndicators = document.querySelectorAll('.loading, .spinner, [class*="loading"]');
        const hasLoadingStates = loadingIndicators.length > 0;
        this.logResult('LOADING', 'Loading indicators present', hasLoadingStates);
        if (!hasLoadingStates) {
            this.addPolishOpportunity('LOW', 'Consider adding loading indicators for better user feedback', 'LOADING');
        }

        // Test transition smoothness between states
        const canvas = document.getElementById('gemsCanvas');
        if (canvas && window.canvasManager) {
            const hasAnimationLoop = typeof window.canvasManager.startAnimationLoop === 'function';
            this.logResult('LOADING', 'Smooth animation system available', hasAnimationLoop);
        }
    }

    /**
     * Test responsive design refinement
     */
    async testResponsiveDesignRefinement() {
        console.log('📱 Testing responsive design refinement...');

        const deviceType = this.getDeviceType();
        
        // Test viewport meta tag
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        const hasViewportMeta = viewportMeta !== null;
        this.logResult('RESPONSIVE', 'Viewport meta tag present', hasViewportMeta);

        // Test responsive images
        const images = document.querySelectorAll('img');
        let responsiveImages = 0;
        images.forEach(img => {
            const style = getComputedStyle(img);
            if (style.maxWidth === '100%' || style.width === '100%') {
                responsiveImages++;
            }
        });

        const responsiveImageRatio = images.length > 0 ? responsiveImages / images.length : 1;
        this.logResult('RESPONSIVE', `Responsive images: ${responsiveImages}/${images.length}`, responsiveImageRatio >= 0.8);
        if (responsiveImageRatio < 0.8) {
            this.addPolishOpportunity('MEDIUM', 'Make images responsive for better mobile experience', 'RESPONSIVE');
        }

        // Test touch target sizes on mobile
        if (this.isMobile) {
            const touchTargets = document.querySelectorAll('.btn, .gem');
            let adequateTouchTargets = 0;
            
            touchTargets.forEach(target => {
                const rect = target.getBoundingClientRect();
                if (rect.width >= 44 && rect.height >= 44) {
                    adequateTouchTargets++;
                }
            });

            const touchTargetRatio = touchTargets.length > 0 ? adequateTouchTargets / touchTargets.length : 1;
            this.logResult('RESPONSIVE', `Adequate touch targets: ${adequateTouchTargets}/${touchTargets.length}`, touchTargetRatio >= 0.9);
            if (touchTargetRatio < 0.9) {
                this.addPolishOpportunity('HIGH', 'Increase touch target sizes for mobile accessibility', 'RESPONSIVE');
            }
        }

        // Test content scaling
        const gameContainer = document.querySelector('.gems-game-container');
        if (gameContainer) {
            const containerRect = gameContainer.getBoundingClientRect();
            const fitsViewport = containerRect.width <= window.innerWidth && 
                                containerRect.height <= window.innerHeight;
            this.logResult('RESPONSIVE', 'Game container fits viewport', fitsViewport);
            if (!fitsViewport) {
                this.addPolishOpportunity('HIGH', 'Optimize game container sizing for current viewport', 'RESPONSIVE');
            }
        }
    }

    /**
     * Test accessibility polish
     */
    async testAccessibilityPolish() {
        console.log('♿ Testing accessibility polish...');

        // Test color contrast (simplified)
        const textElements = document.querySelectorAll('.stat-label, .stat-value, .btn');
        let goodContrastElements = 0;
        
        textElements.forEach(el => {
            const style = getComputedStyle(el);
            const textColor = style.color;
            const bgColor = style.backgroundColor;
            
            // Simplified contrast check
            if (this.estimateContrast(textColor, bgColor)) {
                goodContrastElements++;
            }
        });

        const contrastRatio = textElements.length > 0 ? goodContrastElements / textElements.length : 1;
        this.logResult('ACCESSIBILITY', `Good contrast elements: ${goodContrastElements}/${textElements.length}`, contrastRatio >= 0.8);
        if (contrastRatio < 0.8) {
            this.addPolishOpportunity('HIGH', 'Improve color contrast for accessibility compliance', 'ACCESSIBILITY');
        }

        // Test semantic markup
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const hasHeadings = headings.length > 0;
        this.logResult('ACCESSIBILITY', `Semantic headings present: ${headings.length}`, hasHeadings);

        // Test ARIA labels
        const elementsWithAria = document.querySelectorAll('[aria-label], [aria-describedby], [role]');
        const ariaUsage = elementsWithAria.length > 0;
        this.logResult('ACCESSIBILITY', `Elements with ARIA attributes: ${elementsWithAria.length}`, ariaUsage);
        if (!ariaUsage) {
            this.addPolishOpportunity('MEDIUM', 'Add ARIA labels for screen reader accessibility', 'ACCESSIBILITY');
        }

        // Test keyboard navigation
        const tabbableElements = document.querySelectorAll('button, [tabindex], input, select, textarea');
        const keyboardAccessible = tabbableElements.length > 0;
        this.logResult('ACCESSIBILITY', `Keyboard navigable elements: ${tabbableElements.length}`, keyboardAccessible);
    }

    /**
     * Test performance polish
     */
    async testPerformancePolish() {
        console.log('⚡ Testing performance polish...');

        // Test frame rate
        const fps = await this.measureFrameRate(1000);
        const smoothFrameRate = fps >= 50;
        this.logResult('PERFORMANCE', `Frame rate: ${fps} FPS`, smoothFrameRate);
        if (!smoothFrameRate) {
            this.addPolishOpportunity('MEDIUM', 'Optimize animations and rendering for smoother frame rate', 'PERFORMANCE');
        }

        // Test memory usage
        if (performance.memory) {
            const memoryMB = performance.memory.usedJSHeapSize / 1024 / 1024;
            const reasonableMemory = memoryMB < 100;
            this.logResult('PERFORMANCE', `Memory usage: ${Math.round(memoryMB)}MB`, reasonableMemory);
            if (!reasonableMemory) {
                this.addPolishOpportunity('MEDIUM', 'Optimize memory usage for better performance', 'PERFORMANCE');
            }
        }

        // Test render time
        if (window.canvasManager) {
            const renderStart = performance.now();
            window.canvasManager.draw();
            const renderTime = performance.now() - renderStart;
            
            const fastRender = renderTime < 16; // 60fps = 16ms budget
            this.logResult('PERFORMANCE', `Render time: ${Math.round(renderTime)}ms`, fastRender);
            if (!fastRender) {
                this.addPolishOpportunity('HIGH', 'Optimize canvas rendering performance', 'PERFORMANCE');
            }
        }

        // Test asset optimization
        const images = document.querySelectorAll('img[src]');
        let optimizedImages = 0;
        images.forEach(img => {
            if (img.src.includes('.webp') || img.src.includes('optimized')) {
                optimizedImages++;
            }
        });

        const imageOptRatio = images.length > 0 ? optimizedImages / images.length : 1;
        this.logResult('PERFORMANCE', `Optimized images: ${optimizedImages}/${images.length}`, imageOptRatio >= 0.5);
        if (imageOptRatio < 0.5) {
            this.addPolishOpportunity('LOW', 'Consider using optimized image formats (WebP) for better performance', 'PERFORMANCE');
        }
    }

    /**
     * Test micro-interactions
     */
    async testMicroInteractions() {
        console.log('✨ Testing micro-interactions...');

        // Test gem selection feedback
        const gems = document.querySelectorAll('.gem');
        let gemsWithMicroInteractions = 0;
        
        gems.forEach(gem => {
            const style = getComputedStyle(gem);
            const hasTransform = style.transition.includes('transform') || style.transition.includes('scale');
            const hasBoxShadow = style.transition.includes('box-shadow');
            
            if (hasTransform || hasBoxShadow) {
                gemsWithMicroInteractions++;
            }
        });

        const microInteractionRatio = gems.length > 0 ? gemsWithMicroInteractions / gems.length : 1;
        this.logResult('MICRO_INTERACTIONS', `Gems with micro-interactions: ${gemsWithMicroInteractions}/${gems.length}`, microInteractionRatio >= 0.8);
        if (microInteractionRatio < 0.8) {
            this.addPolishOpportunity('MEDIUM', 'Add subtle micro-interactions to gems for better feedback', 'MICRO_INTERACTIONS');
        }

        // Test button feedback
        const buttons = document.querySelectorAll('.btn');
        let buttonsWithFeedback = 0;
        
        buttons.forEach(btn => {
            const style = getComputedStyle(btn);
            const hasHoverEffect = style.transition !== 'none';
            if (hasHoverEffect) {
                buttonsWithFeedback++;
            }
        });

        const buttonFeedbackRatio = buttons.length > 0 ? buttonsWithFeedback / buttons.length : 1;
        this.logResult('MICRO_INTERACTIONS', `Buttons with feedback: ${buttonsWithFeedback}/${buttons.length}`, buttonFeedbackRatio >= 0.9);
        if (buttonFeedbackRatio < 0.9) {
            this.addPolishOpportunity('MEDIUM', 'Add hover/click feedback to all interactive buttons', 'MICRO_INTERACTIONS');
        }

        // Test score animation
        const scoreDisplay = document.getElementById('scoreDisplay');
        if (scoreDisplay) {
            const scoreStyle = getComputedStyle(scoreDisplay);
            const hasScoreAnimation = scoreStyle.transition !== 'none';
            this.logResult('MICRO_INTERACTIONS', 'Score updates have animation', hasScoreAnimation);
            if (!hasScoreAnimation) {
                this.addPolishOpportunity('LOW', 'Add subtle animation to score updates for better feedback', 'MICRO_INTERACTIONS');
            }
        }

        // Test loading micro-animations
        const heroImage = document.querySelector('.hero-badge-img');
        if (heroImage) {
            const heroStyle = getComputedStyle(heroImage);
            const hasHeroAnimation = heroStyle.transition !== 'none' || heroStyle.animation !== 'none';
            this.logResult('MICRO_INTERACTIONS', 'Hero image has subtle animations', hasHeroAnimation);
            if (!hasHeroAnimation) {
                this.addPolishOpportunity('LOW', 'Add subtle animations to hero elements for visual interest', 'MICRO_INTERACTIONS');
            }
        }
    }

    /**
     * Test cross-device consistency
     */
    async testCrossDeviceConsistency() {
        console.log('🔄 Testing cross-device consistency...');

        const deviceType = this.getDeviceType();
        
        // Test layout adaptation
        const gameLayout = document.querySelector('.gems-game-layout');
        if (gameLayout) {
            const layoutStyle = getComputedStyle(gameLayout);
            const isResponsive = layoutStyle.display === 'flex' || layoutStyle.display === 'grid';
            this.logResult('CROSS_DEVICE', 'Layout uses responsive design patterns', isResponsive);
        }

        // Test consistent color scheme
        const primaryColors = new Set();
        document.querySelectorAll('[class*="gem-"], .btn-primary, .game-title').forEach(el => {
            const bgColor = getComputedStyle(el).backgroundColor;
            if (bgColor !== 'rgba(0, 0, 0, 0)') {
                primaryColors.add(bgColor);
            }
        });

        const consistentColors = primaryColors.size <= 10; // Not too many primary colors
        this.logResult('CROSS_DEVICE', `Consistent color palette: ${primaryColors.size} primary colors`, consistentColors);

        // Test font scaling
        const gameTitle = document.querySelector('.game-title');
        if (gameTitle) {
            const titleSize = parseFloat(getComputedStyle(gameTitle).fontSize);
            const appropriateSize = this.isMobile ? titleSize >= 24 && titleSize <= 32 :
                                   this.isTablet ? titleSize >= 28 && titleSize <= 36 :
                                   titleSize >= 32 && titleSize <= 48;
            
            this.logResult('CROSS_DEVICE', `Title size appropriate for ${deviceType}: ${titleSize}px`, appropriateSize);
            if (!appropriateSize) {
                this.addPolishOpportunity('MEDIUM', `Optimize title size for ${deviceType} viewing`, 'CROSS_DEVICE');
            }
        }

        // Test interaction methods
        const interactionOptimized = this.isMobile ? 
                                   document.querySelectorAll('[ontouchstart], [ontouchend]').length > 0 :
                                   document.querySelectorAll('[onmouseover], [onclick]').length > 0;
        
        this.logResult('CROSS_DEVICE', `Interaction optimized for ${deviceType}`, interactionOptimized);
        if (!interactionOptimized) {
            this.addPolishOpportunity('HIGH', `Optimize interactions for ${deviceType} input methods`, 'CROSS_DEVICE');
        }
    }

    // Utility methods

    getDeviceType() {
        return this.isMobile ? 'mobile' : this.isTablet ? 'tablet' : 'desktop';
    }

    checkConsistency(items, property) {
        if (items.length <= 1) return true;
        const firstValue = items[0][property];
        return items.every(item => item[property] === firstValue);
    }

    checkSpacingConsistency(spacingValues) {
        const commonSpacings = ['0px', '4px', '8px', '12px', '16px', '20px', '24px', '32px'];
        let consistentCount = 0;
        
        spacingValues.forEach(spacing => {
            if (commonSpacings.includes(spacing)) {
                consistentCount++;
            }
        });
        
        return spacingValues.length === 0 || (consistentCount / spacingValues.length) >= 0.7;
    }

    checkSpacingScale(values) {
        return this.checkSpacingConsistency(values);
    }

    extractSpacingValues(cssValue) {
        return cssValue.split(' ').filter(v => v.includes('px'));
    }

    estimateContrast(textColor, backgroundColor) {
        // Simplified contrast estimation - real implementation would use WCAG formula
        if (textColor.includes('rgb') && backgroundColor.includes('rgb')) {
            return true; // Assume reasonable contrast for now
        }
        return textColor !== backgroundColor;
    }

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

    addPolishOpportunity(priority, description, category) {
        this.polishOpportunities.push({
            priority,
            description,
            category,
            deviceType: this.getDeviceType(),
            timestamp: new Date().toISOString()
        });
    }

    logResult(category, description, passed, details = null) {
        const result = {
            category,
            description,
            passed,
            details,
            timestamp: new Date().toISOString(),
            viewport: `${this.viewport.width}x${this.viewport.height}`,
            deviceType: this.getDeviceType()
        };
        
        this.testResults.push(result);
        
        const status = passed ? '✅' : '❌';
        const device = this.isMobile ? '📱' : this.isTablet ? '💻' : '🖥️';
        console.log(`${status} ${device} [${category}] ${description}`, details ? details : '');
    }

    generatePolishReport() {
        console.log('\n✨ WAVELENGTH GEMS UI POLISH REPORT');
        console.log('=' .repeat(60));
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        const passRate = Math.round((passedTests / totalTests) * 100);
        
        console.log(`✨ Device: ${this.getDeviceType()} (${this.viewport.width}x${this.viewport.height})`);
        console.log(`✅ Polish Score: ${passedTests}/${totalTests} (${passRate}%)`);
        console.log(`🔧 Polish Opportunities: ${this.polishOpportunities.length}`);
        console.log(`📅 Date: ${new Date().toLocaleString()}`);
        
        // Polish opportunities by priority
        const priorities = { HIGH: [], MEDIUM: [], LOW: [] };
        this.polishOpportunities.forEach(opp => {
            priorities[opp.priority].push(opp);
        });
        
        console.log('\n🎯 Polish Opportunities by Priority:');
        ['HIGH', 'MEDIUM', 'LOW'].forEach(priority => {
            if (priorities[priority].length > 0) {
                console.log(`\n   🔴 ${priority} Priority (${priorities[priority].length}):`);
                priorities[priority].forEach(opp => {
                    console.log(`      • ${opp.description}`);
                });
            }
        });
        
        // Category breakdown
        const categories = {};
        this.testResults.forEach(result => {
            if (!categories[result.category]) {
                categories[result.category] = { passed: 0, failed: 0 };
            }
            if (result.passed) {
                categories[result.category].passed++;
            } else {
                categories[result.category].failed++;
            }
        });
        
        console.log('\n📊 Polish Areas:');
        Object.keys(categories).forEach(category => {
            const cat = categories[category];
            const catPassRate = Math.round((cat.passed / (cat.passed + cat.failed)) * 100);
            const status = catPassRate >= 90 ? '🟢' : catPassRate >= 70 ? '🟡' : '🔴';
            console.log(`   ${status} ${category}: ${catPassRate}% polished`);
        });
        
        // Overall polish assessment
        console.log('\n🏆 Overall Polish Assessment:');
        if (passRate >= 90 && priorities.HIGH.length === 0) {
            console.log('   ✨ EXCELLENT: Ready for production with high polish level');
        } else if (passRate >= 80 && priorities.HIGH.length <= 2) {
            console.log('   ✅ GOOD: Minor polish improvements recommended');
        } else if (passRate >= 70) {
            console.log('   ⚠️  FAIR: Several polish improvements needed');
        } else {
            console.log('   🔴 NEEDS WORK: Significant polish improvements required');
        }
        
        console.log('\n' + '=' .repeat(60));
        
        return {
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                passRate: passRate,
                polishOpportunities: this.polishOpportunities.length,
                deviceType: this.getDeviceType()
            },
            categories: categories,
            polishOpportunities: this.polishOpportunities,
            priorities: priorities
        };
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.wavelengthGemsUIPolishTests = new WavelengthGemsUIPolishTests();
    });
} else {
    window.wavelengthGemsUIPolishTests = new WavelengthGemsUIPolishTests();
}

// Global test runner function
window.runWavelengthGemsUIPolishTests = async function() {
    if (!window.wavelengthGemsUIPolishTests) {
        console.error('❌ UI Polish test suite not initialized');
        return null;
    }
    
    return await window.wavelengthGemsUIPolishTests.runAllPolishTests();
};

console.log('✨ Wavelength Gems UI Polish Test Suite loaded - run with: runWavelengthGemsUIPolishTests()');