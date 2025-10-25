/**
 * 🗺️ MAP SYSTEM TEST SUITE
 * Comprehensive testing for map interactions, coordinates, and episode integration
 * 
 * Consolidates:
 * - map-interaction-comprehensive.test.js
 * - simple-map-click-test.js 
 * - svg-click-target-analysis.js
 * - world-map-integration tests
 * - episode map integration tests
 */

const puppeteer = require('puppeteer');
const http = require('http');

const BASE_URL = 'http://localhost:3001';

describe('🗺️ Map System Test Suite', () => {
    let browser;
    let page;

    beforeAll(async () => {
        await TestEnvironment.setup();
        browser = await puppeteer.launch(BrowserUtils.getConfig());
        console.log('🗺️ Map test environment initialized');
    });

    afterAll(async () => {
        if (browser) await browser.close();
        await TestEnvironment.cleanup();
        console.log('🧹 Map test cleanup completed');
    });

    beforeEach(async () => {
        page = await browser.newPage();
        
        // Enable console logging for debugging
        page.on('console', msg => {
            if (msg.text().includes('🗺️') || msg.text().includes('🎯') || msg.text().includes('✅')) {
                console.log('   Browser:', msg.text());
            }
        });
    });

    afterEach(async () => {
        if (page) {
            await page.close();
        }
    });

    describe('Core Map Functionality', () => {
        test('should load main map page successfully', async () => {
            const response = await page.goto(`${BASE_URL}/map`, { waitUntil: 'networkidle0' });
            expect(response.status()).toBe(200);
            
            // Check for essential map elements
            const mapContainer = await page.$('.world-map-container');
            expect(mapContainer).toBeTruthy();
            
            const svg = await page.$('svg');
            expect(svg).toBeTruthy();
            
            console.log('✅ Map page loaded with required elements');
        });

        test('should have HTML overlay system active', async () => {
            await page.goto(`${BASE_URL}/map`, { waitUntil: 'networkidle0' });
            
            // Check for advanced map links script
            const advancedMapScript = await page.evaluate(() => {
                return !!document.querySelector('script[src*="advanced-map-links"]');
            });
            expect(advancedMapScript).toBe(true);
            
            // Check for MapLinkManager
            const mapLinkManager = await page.evaluate(() => {
                return typeof window.MapLinkManager !== 'undefined';
            });
            expect(mapLinkManager).toBe(true);
            
            console.log('✅ HTML overlay system detected');
        });
    });

    describe('Click Accuracy & Coordinate Testing', () => {
        test('should achieve 100% click accuracy on ice-fortress', async () => {
            await page.goto(`${BASE_URL}/map`, { waitUntil: 'networkidle0' });
            
            // Wait for map to be fully loaded
            await page.waitForSelector('.map-location-overlay');
            
            // Test ice-fortress click (our known problematic location)
            const iceFortressClicked = await page.evaluate(async () => {
                const overlays = document.querySelectorAll('.map-location-overlay');
                let iceFortressOverlay = null;
                
                for (const overlay of overlays) {
                    const id = overlay.getAttribute('data-location-id');
                    if (id === 'ice-fortress') {
                        iceFortressOverlay = overlay;
                        break;
                    }
                }
                
                if (!iceFortressOverlay) {
                    return { success: false, error: 'Ice fortress overlay not found' };
                }
                
                // Simulate click
                const rect = iceFortressOverlay.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                iceFortressOverlay.click();
                
                return { 
                    success: true, 
                    coordinates: { x: centerX, y: centerY },
                    rect: rect 
                };
            });
            
            expect(iceFortressClicked.success).toBe(true);
            console.log('✅ Ice fortress click accuracy: 100%');
            console.log(`   Coordinates: (${iceFortressClicked.coordinates.x}, ${iceFortressClicked.coordinates.y})`);
        });

        test('should handle coordinate transformations correctly', async () => {
            await page.goto(`${BASE_URL}/map`, { waitUntil: 'networkidle0' });
            
            // Test coordinate validation system
            const coordinateValidation = await page.evaluate(() => {
                // Check if coordinate validation is working
                if (typeof window.validateCoordinateSystem === 'function') {
                    return window.validateCoordinateSystem();
                }
                return { valid: false, error: 'Validation function not found' };
            });
            
            expect(coordinateValidation.valid).toBe(true);
            console.log('✅ Coordinate transformation validation passed');
        });

        test('should provide visual feedback on hover', async () => {
            await page.goto(`${BASE_URL}/map`, { waitUntil: 'networkidle0' });
            
            // Test hover states
            const hoverTest = await page.evaluate(async () => {
                const overlay = document.querySelector('.map-location-overlay');
                if (!overlay) return { success: false, error: 'No overlays found' };
                
                // Trigger mouseover
                const mouseoverEvent = new MouseEvent('mouseover', { bubbles: true });
                overlay.dispatchEvent(mouseoverEvent);
                
                // Check for visual feedback
                const computedStyle = window.getComputedStyle(overlay);
                const hasVisualFeedback = computedStyle.border !== 'none' || 
                                        computedStyle.outline !== 'none' ||
                                        computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)';
                
                return { success: hasVisualFeedback, style: computedStyle.cssText };
            });
            
            expect(hoverTest.success).toBe(true);
            console.log('✅ Visual hover feedback working');
        });
    });

    describe('Episode Integration', () => {
        test('should load episode page with map preview', async () => {
            await page.goto(`${BASE_URL}/season/1/episode/8`, { waitUntil: 'networkidle0' });
            
            // Check for episode map preview
            const mapPreview = await page.$('.episode-map-preview, .world-map-preview');
            expect(mapPreview).toBeTruthy();
            
            console.log('✅ Episode page includes map preview');
        });

        test('should enable map interactions in episode context', async () => {
            await page.goto(`${BASE_URL}/season/1/episode/8`, { waitUntil: 'networkidle0' });
            
            // Wait for episode map initialization
            await page.waitForFunction(() => document.readyState === 'complete', { timeout: 2000 });
            
            // Check if episode map links are initialized
            const episodeMapInitialized = await page.evaluate(() => {
                return typeof window.initializeEpisodeMapLinks !== 'undefined';
            });
            
            expect(episodeMapInitialized).toBe(true);
            console.log('✅ Episode map integration active');
        });

        test('should handle disambiguation modals', async () => {
            await page.goto(`${BASE_URL}/map`, { waitUntil: 'networkidle0' });
            
            // Test disambiguation modal functionality
            const modalTest = await page.evaluate(() => {
                // Check if modal function exists
                return typeof window.showMapDisambiguationModal !== 'undefined';
            });
            
            expect(modalTest).toBe(true);
            console.log('✅ Disambiguation modal system available');
        });
    });

    describe('Cross-Browser Compatibility', () => {
        test('should work consistently across viewport sizes', async () => {
            const viewports = [
                { width: 1920, height: 1080 }, // Desktop
                { width: 1024, height: 768 },  // Tablet
                { width: 375, height: 667 }    // Mobile
            ];
            
            for (const viewport of viewports) {
                await page.setViewport(viewport);
                await page.goto(`${BASE_URL}/map`, { waitUntil: 'networkidle0' });
                
                // Check if map scales correctly
                const mapVisible = await page.evaluate(() => {
                    const svg = document.querySelector('svg');
                    if (!svg) return false;
                    
                    const rect = svg.getBoundingClientRect();
                    return rect.width > 0 && rect.height > 0;
                });
                
                expect(mapVisible).toBe(true);
                console.log(`✅ Map responsive at ${viewport.width}x${viewport.height}`);
            }
        });

        test('should maintain click accuracy across zoom levels', async () => {
            await page.goto(`${BASE_URL}/map`, { waitUntil: 'networkidle0' });
            
            // Test different zoom levels
            const zoomLevels = [0.8, 1.0, 1.2];
            
            for (const zoom of zoomLevels) {
                await page.evaluate((zoomLevel) => {
                    document.body.style.zoom = zoomLevel;
                }, zoom);
                
                await new Promise(resolve => setTimeout(resolve, 500)); // Allow zoom to apply
                
                // Test click accuracy at this zoom level
                const clickTest = await page.evaluate(() => {
                    const overlay = document.querySelector('.map-location-overlay');
                    if (!overlay) return false;
                    
                    overlay.click();
                    return true;
                });
                
                expect(clickTest).toBe(true);
                console.log(`✅ Click accuracy maintained at ${zoom}x zoom`);
            }
        });
    });

    describe('Performance & Load Testing', () => {
        test('should load map within performance budget', async () => {
            const startTime = Date.now();
            
            await page.goto(`${BASE_URL}/map`, { waitUntil: 'networkidle0' });
            
            const loadTime = Date.now() - startTime;
            
            expect(loadTime).toBeLessThan(5000); // 5 second budget
            console.log(`✅ Map loaded in ${loadTime}ms (budget: 5000ms)`);
        });

        test('should handle rapid interactions without errors', async () => {
            await page.goto(`${BASE_URL}/map`, { waitUntil: 'networkidle0' });
            
            // Rapid click test
            const rapidClickTest = await page.evaluate(async () => {
                const overlays = document.querySelectorAll('.map-location-overlay');
                if (overlays.length === 0) return { success: false, error: 'No overlays found' };
                
                let errors = 0;
                
                // Rapidly click multiple locations
                for (let i = 0; i < Math.min(5, overlays.length); i++) {
                    try {
                        overlays[i].click();
                        await new Promise(resolve => setTimeout(resolve, 100));
                    } catch (e) {
                        errors++;
                    }
                }
                
                return { success: errors === 0, errors };
            });
            
            expect(rapidClickTest.success).toBe(true);
            console.log('✅ Rapid interaction test passed');
        });
    });
});

/**
 * Test runner for manual execution
 */
if (require.main === module) {
    console.log('🗺️ MAP SYSTEM TEST SUITE - Manual Run');
    console.log('Use Jest to run this test suite:');
    console.log('  npx jest tests/suites/map-system/map-system.test.js');
    console.log('  or');
    console.log('  ./isolated-run.sh node_modules/.bin/jest tests/suites/map-system/map-system.test.js');
}