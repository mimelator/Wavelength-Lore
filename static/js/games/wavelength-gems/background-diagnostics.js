/**
 * Wavelength Gems - Background Diagnostics
 * Automated diagnostics for background visibility issues
 */

class BackgroundDiagnostics {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            elements: {},
            styles: {},
            zIndexLayers: {},
            visibility: {},
            issues: [],
            recommendations: []
        };
    }

    /**
     * Run full diagnostic suite
     */
    diagnose() {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🔍 BACKGROUND DIAGNOSTICS - AUTOMATED REPORT');
        console.log('═══════════════════════════════════════════════════════════\n');

        this.checkElements();
        this.checkStyles();
        this.checkZIndexLayers();
        this.checkVisibility();
        this.checkImageLoading();
        this.checkAnimations();
        this.checkHeroImage();
        this.analyzeIssues();
        this.printReport();
        
        return this.results;
    }

    /**
     * Check if all required elements exist
     */
    checkElements() {
        console.log('📋 1. ELEMENT EXISTENCE CHECK');
        
        const requiredElements = {
            'Background Container': '.game-background-container',
            'Background Gallery': '.game-background-gallery',
            'Weather Canvas': '.game-weather-canvas',
            'Lightning Flash': '.game-lightning-flash',
            'Game Wrapper': '.gems-game-wrapper',
            'Game Layout': '.gems-game-layout',
            'Game Container': '.gems-game-container',
            'Game Board': '#gameBoard',
            'Gems Canvas': '#gemsCanvas'
        };

        for (const [name, selector] of Object.entries(requiredElements)) {
            const element = document.querySelector(selector);
            const exists = !!element;
            this.results.elements[name] = {
                selector,
                exists,
                element: exists ? element : null
            };
            
            console.log(`   ${exists ? '✅' : '❌'} ${name} (${selector})`);
            
            if (!exists) {
                this.results.issues.push(`Missing element: ${name} (${selector})`);
            }
        }
        console.log('');
    }

    /**
     * Check computed styles of key elements
     */
    checkStyles() {
        console.log('🎨 2. COMPUTED STYLES CHECK');

        const elementsToCheck = [
            { name: 'Background Container', selector: '.game-background-container' },
            { name: 'Background Gallery', selector: '.game-background-gallery' },
            { name: 'Game Wrapper', selector: '.gems-game-wrapper' },
            { name: 'Game Container', selector: '.gems-game-container' },
            { name: 'Game Board', selector: '#gameBoard' }
        ];

        elementsToCheck.forEach(({ name, selector }) => {
            const element = document.querySelector(selector);
            if (!element) {
                console.log(`   ⚠️  ${name}: NOT FOUND`);
                return;
            }

            const styles = window.getComputedStyle(element);
            const styleData = {
                position: styles.position,
                zIndex: styles.zIndex,
                opacity: styles.opacity,
                background: styles.background,
                backgroundColor: styles.backgroundColor,
                display: styles.display,
                visibility: styles.visibility,
                width: styles.width,
                height: styles.height,
                top: styles.top,
                left: styles.left
            };

            this.results.styles[name] = styleData;

            console.log(`   📐 ${name}:`);
            console.log(`      Position: ${styleData.position} | Z-Index: ${styleData.zIndex}`);
            console.log(`      Opacity: ${styleData.opacity} | Visibility: ${styleData.visibility}`);
            console.log(`      Background: ${styleData.backgroundColor}`);
            
            // Check for issues
            if (name === 'Background Container' && styleData.position !== 'fixed') {
                this.results.issues.push(`Background Container should be 'fixed' but is '${styleData.position}'`);
            }
            if (name === 'Background Gallery' && parseFloat(styleData.opacity) < 0.1) {
                this.results.issues.push(`Background Gallery opacity is very low: ${styleData.opacity}`);
            }
            if (name === 'Game Container' && styleData.backgroundColor.includes('0.9') || styleData.backgroundColor.includes('0.8')) {
                this.results.issues.push(`Game Container background is too opaque: ${styleData.backgroundColor}`);
            }
        });
        console.log('');
    }

    /**
     * Check z-index layering
     */
    checkZIndexLayers() {
        console.log('📊 3. Z-INDEX LAYER ANALYSIS');

        const layers = [
            { name: 'Background Container', selector: '.game-background-container' },
            { name: 'Background Gallery', selector: '.game-background-gallery' },
            { name: 'Weather Canvas', selector: '.game-weather-canvas' },
            { name: 'Game Wrapper', selector: '.gems-game-wrapper' },
            { name: 'Game Layout', selector: '.gems-game-layout' },
            { name: 'Game Container', selector: '.gems-game-container' },
            { name: 'Game Board', selector: '#gameBoard' },
            { name: 'Gems Canvas', selector: '#gemsCanvas' }
        ];

        const zIndexMap = [];

        layers.forEach(({ name, selector }) => {
            const element = document.querySelector(selector);
            if (element) {
                const styles = window.getComputedStyle(element);
                const zIndex = styles.zIndex === 'auto' ? 'auto' : parseInt(styles.zIndex);
                zIndexMap.push({ name, selector, zIndex, element });
                this.results.zIndexLayers[name] = zIndex;
            }
        });

        // Sort by z-index
        zIndexMap.sort((a, b) => {
            if (a.zIndex === 'auto') return -1;
            if (b.zIndex === 'auto') return 1;
            return a.zIndex - b.zIndex;
        });

        console.log('   Layer order (bottom to top):');
        zIndexMap.forEach(({ name, zIndex }) => {
            console.log(`   ${zIndex === 'auto' ? '  auto' : String(zIndex).padStart(5, ' ')} - ${name}`);
        });

        // Check if background is on bottom
        const bgContainer = zIndexMap.find(l => l.name === 'Background Container');
        const gameElements = zIndexMap.filter(l => l.name.includes('Game'));
        
        if (bgContainer && gameElements.length > 0) {
            const bgZIndex = bgContainer.zIndex === 'auto' ? -1 : bgContainer.zIndex;
            const anyGameBelow = gameElements.some(g => {
                const gZIndex = g.zIndex === 'auto' ? -1 : g.zIndex;
                return gZIndex < bgZIndex;
            });
            
            if (anyGameBelow) {
                this.results.issues.push('Some game elements have lower z-index than background container');
            }
        }
        console.log('');
    }

    /**
     * Check actual visibility of background images
     */
    checkVisibility() {
        console.log('👁️  4. VISIBILITY ANALYSIS');

        const gallery = document.querySelector('.game-background-gallery');
        const images = document.querySelectorAll('.game-background-gallery img');

        if (!gallery) {
            console.log('   ❌ Gallery not found');
            return;
        }

        const galleryRect = gallery.getBoundingClientRect();
        const isVisible = galleryRect.width > 0 && galleryRect.height > 0;

        console.log(`   Gallery: ${isVisible ? '✅ Visible' : '❌ Hidden'}`);
        console.log(`   Dimensions: ${Math.round(galleryRect.width)}x${Math.round(galleryRect.height)}px`);
        console.log(`   Position: (${Math.round(galleryRect.left)}, ${Math.round(galleryRect.top)})`);
        console.log(`   Images in gallery: ${images.length}`);

        this.results.visibility.gallery = {
            visible: isVisible,
            width: galleryRect.width,
            height: galleryRect.height,
            imageCount: images.length
        };

        if (images.length === 0) {
            this.results.issues.push('No images found in gallery');
            this.results.recommendations.push('Check if GameBackgroundManager.loadLevelImages() was called');
        }

        images.forEach((img, i) => {
            const imgRect = img.getBoundingClientRect();
            const styles = window.getComputedStyle(img);
            const isActive = img.classList.contains('active');
            const isLoaded = img.complete && img.naturalWidth > 0;

            console.log(`   Image ${i + 1}:`);
            console.log(`      Active: ${isActive ? '✅' : '❌'} | Loaded: ${isLoaded ? '✅' : '❌'}`);
            console.log(`      Opacity: ${styles.opacity} | Animation: ${styles.animation}`);
            console.log(`      Src: ${img.src}`);

            if (!isLoaded) {
                this.results.issues.push(`Image ${i + 1} failed to load: ${img.src}`);
            }
            if (isActive && parseFloat(styles.opacity) < 0.1) {
                this.results.issues.push(`Active image ${i + 1} has very low opacity: ${styles.opacity}`);
            }
        });
        console.log('');
    }

    /**
     * Check image loading status
     */
    checkImageLoading() {
        console.log('🖼️  5. IMAGE LOADING STATUS');

        const images = document.querySelectorAll('.game-background-gallery img');
        let loaded = 0;
        let failed = 0;
        let pending = 0;

        images.forEach((img, i) => {
            if (img.complete) {
                if (img.naturalWidth > 0) {
                    loaded++;
                    console.log(`   ✅ Image ${i + 1}: Loaded (${img.naturalWidth}x${img.naturalHeight})`);
                } else {
                    failed++;
                    console.log(`   ❌ Image ${i + 1}: Failed to load`);
                }
            } else {
                pending++;
                console.log(`   ⏳ Image ${i + 1}: Still loading...`);
            }
        });

        console.log(`\n   Summary: ${loaded} loaded, ${failed} failed, ${pending} pending`);

        if (failed > 0) {
            this.results.recommendations.push('Check image paths and ensure files exist on server');
        }
        console.log('');
    }

    /**
     * Check if animations are running
     */
    checkAnimations() {
        console.log('🎬 6. ANIMATION STATUS');

        const gallery = document.querySelector('.game-background-gallery');
        const images = document.querySelectorAll('.game-background-gallery img');

        if (gallery) {
            const styles = window.getComputedStyle(gallery);
            console.log(`   Gallery animation: ${styles.animation || 'none'}`);
        }

        images.forEach((img, i) => {
            const styles = window.getComputedStyle(img);
            const hasKenBurns = styles.animation.includes('kenBurns');
            const animationState = styles.animationPlayState;
            
            console.log(`   Image ${i + 1}:`);
            console.log(`      Ken Burns: ${hasKenBurns ? '✅ Active' : '❌ Not running'}`);
            console.log(`      Animation: ${styles.animation}`);
            console.log(`      State: ${animationState}`);

            if (!hasKenBurns) {
                this.results.issues.push(`Image ${i + 1} missing Ken Burns animation`);
            }
        });

        // Check rotation interval
        if (window.gameBackgroundManager) {
            const hasRotation = !!window.gameBackgroundManager.rotationInterval;
            console.log(`\n   Image rotation: ${hasRotation ? '✅ Active' : '❌ Not running'}`);
            
            if (!hasRotation && images.length > 1) {
                this.results.issues.push('Image rotation not active despite multiple images');
            }
        }
        console.log('');
    }

    /**
     * Check hero image elements and visibility
     */
    checkHeroImage() {
        console.log('🖼️  7. HERO IMAGE DIAGNOSTIC');

        const heroCard = document.getElementById('heroImageCard');
        const heroImg = document.getElementById('heroImage');
        const rightSidebar = document.querySelector('.game-sidebar.right-sidebar');
        const leftSidebar = document.querySelector('.game-sidebar.left-sidebar');
        
        // Check viewport width
        const viewportWidth = window.innerWidth;
        const breakpoint = 1000;
        const sidebarsVisible = viewportWidth >= breakpoint;
        
        console.log(`   📐 Viewport Width: ${viewportWidth}px`);
        console.log(`   📏 Sidebar Breakpoint: ${breakpoint}px`);
        console.log(`   👁️  Sidebars Should Be Visible: ${sidebarsVisible ? 'YES' : 'NO (viewport too narrow)'}`);
        console.log('');
        
        // Check element existence
        this.results.heroImage = {
            viewportWidth,
            sidebarsVisible,
            elements: {
                heroCard: !!heroCard,
                heroImg: !!heroImg,
                rightSidebar: !!rightSidebar,
                leftSidebar: !!leftSidebar
            }
        };
        
        console.log('   📋 Element Check:');
        console.log(`      Hero Image Card: ${heroCard ? '✅ EXISTS' : '❌ MISSING'}`);
        console.log(`      Hero Image Element: ${heroImg ? '✅ EXISTS' : '❌ MISSING'}`);
        console.log(`      Right Sidebar: ${rightSidebar ? '✅ EXISTS' : '❌ MISSING'}`);
        console.log(`      Left Sidebar: ${leftSidebar ? '✅ EXISTS' : '❌ MISSING'}`);
        console.log('');
        
        if (!heroCard || !heroImg) {
            this.results.issues.push('Hero image elements missing from DOM');
            console.log('   ❌ CRITICAL: Hero image elements not found in DOM');
            console.log('');
            return;
        }
        
        // Check computed styles
        const heroCardStyles = window.getComputedStyle(heroCard);
        const heroImgStyles = window.getComputedStyle(heroImg);
        const rightSidebarStyles = rightSidebar ? window.getComputedStyle(rightSidebar) : null;
        
        console.log('   🎨 Computed Styles:');
        console.log(`      Hero Card Display: ${heroCardStyles.display}`);
        console.log(`      Hero Card Visibility: ${heroCardStyles.visibility}`);
        console.log(`      Hero Card Opacity: ${heroCardStyles.opacity}`);
        console.log(`      Hero Img Src: ${heroImg.src || '(empty)'}`);
        console.log(`      Hero Img Display: ${heroImgStyles.display}`);
        console.log(`      Hero Img Width x Height: ${heroImgStyles.width} x ${heroImgStyles.height}`);
        
        if (rightSidebarStyles) {
            console.log(`      Right Sidebar Display: ${rightSidebarStyles.display}`);
            console.log(`      Right Sidebar Visibility: ${rightSidebarStyles.visibility}`);
        }
        console.log('');
        
        // Check if hero image is loaded
        const imgLoaded = heroImg.complete && heroImg.naturalHeight !== 0;
        console.log('   📷 Image Status:');
        console.log(`      Image Loaded: ${imgLoaded ? '✅ YES' : '❌ NO'}`);
        console.log(`      Image Complete: ${heroImg.complete}`);
        console.log(`      Natural Dimensions: ${heroImg.naturalWidth}x${heroImg.naturalHeight}`);
        console.log('');
        
        // Check level config
        if (typeof gameState !== 'undefined' && gameState.levelConfig) {
            const hasHeroImage = !!gameState.levelConfig.theme?.heroImage;
            console.log('   📦 Level Configuration:');
            console.log(`      Current Level: ${gameState.level}`);
            console.log(`      Hero Image Defined: ${hasHeroImage ? 'YES' : 'NO'}`);
            if (hasHeroImage) {
                console.log(`      Hero Image Path: ${gameState.levelConfig.theme.heroImage}`);
            }
            console.log('');
        }
        
        // Analyze issues
        console.log('   🔍 Analysis:');
        
        if (!sidebarsVisible) {
            this.results.issues.push(`Viewport too narrow (${viewportWidth}px < ${breakpoint}px) - sidebars hidden by CSS media query`);
            console.log(`      ⚠️  ISSUE: Viewport is ${viewportWidth}px, but sidebars require ${breakpoint}px minimum`);
            console.log('      💡 FIX: Widen browser window OR adjust CSS breakpoint');
        } else if (rightSidebarStyles && rightSidebarStyles.display === 'none') {
            this.results.issues.push('Right sidebar is hidden despite viewport being wide enough');
            console.log('      ⚠️  ISSUE: Right sidebar hidden even though viewport is wide enough');
        } else if (heroCardStyles.display === 'none') {
            this.results.issues.push('Hero card is explicitly hidden');
            console.log('      ⚠️  ISSUE: Hero card display is set to none');
        } else if (!heroImg.src || heroImg.src === window.location.href) {
            this.results.issues.push('Hero image src is empty or invalid');
            console.log('      ⚠️  ISSUE: Hero image has no valid src attribute');
        } else if (!imgLoaded) {
            this.results.issues.push('Hero image failed to load');
            console.log('      ⚠️  ISSUE: Hero image not loading properly');
        } else {
            console.log('      ✅ Hero image should be visible!');
        }
        
        console.log('');
    }

    /**
     * Analyze issues and provide recommendations
     */
    analyzeIssues() {
        console.log('🔧 8. ISSUE ANALYSIS');

        if (this.results.issues.length === 0) {
            console.log('   ✅ No issues detected!');
        } else {
            console.log(`   ⚠️  Found ${this.results.issues.length} issue(s):`);
            this.results.issues.forEach((issue, i) => {
                console.log(`      ${i + 1}. ${issue}`);
            });
        }

        // Auto-generate recommendations
        if (this.results.issues.some(i => i.includes('opacity'))) {
            this.results.recommendations.push('Increase .game-background-gallery opacity in CSS');
        }
        if (this.results.issues.some(i => i.includes('z-index'))) {
            this.results.recommendations.push('Adjust z-index values to ensure proper layering');
        }
        if (this.results.issues.some(i => i.includes('opaque'))) {
            this.results.recommendations.push('Reduce opacity of blocking elements (game container)');
        }

        if (this.results.recommendations.length > 0) {
            console.log(`\n   💡 Recommendations:`);
            this.results.recommendations.forEach((rec, i) => {
                console.log(`      ${i + 1}. ${rec}`);
            });
        }
        console.log('');
    }

    /**
     * Print final summary report
     */
    printReport() {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📊 DIAGNOSTIC SUMMARY');
        console.log('═══════════════════════════════════════════════════════════');
        
        const elementsPassed = Object.values(this.results.elements).filter(e => e.exists).length;
        const elementsTotal = Object.keys(this.results.elements).length;
        
        console.log(`   Elements: ${elementsPassed}/${elementsTotal} present`);
        console.log(`   Issues: ${this.results.issues.length}`);
        console.log(`   Status: ${this.results.issues.length === 0 ? '✅ HEALTHY' : '⚠️  NEEDS ATTENTION'}`);
        console.log('═══════════════════════════════════════════════════════════\n');

        // Store results globally for access
        window.backgroundDiagnosticResults = this.results;
        console.log('💾 Full results stored in: window.backgroundDiagnosticResults');
    }
}

// Auto-run diagnostics after page load
window.addEventListener('load', () => {
    setTimeout(() => {
        window.backgroundDiagnostics = new BackgroundDiagnostics();
        window.backgroundDiagnostics.diagnose();
    }, 1000); // Wait 1 second for everything to initialize
});

// Expose function for manual diagnostics
window.diagnoseBackground = () => {
    const diag = new BackgroundDiagnostics();
    return diag.diagnose();
};

console.log('🔍 Background diagnostics loaded. Run diagnoseBackground() for manual check.');
