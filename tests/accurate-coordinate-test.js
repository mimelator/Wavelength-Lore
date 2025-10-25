#!/usr/bin/env node

/**
 * Accurate Coordinate Click Test
 * Uses actual browser-calculated screen coordinates for precise testing
 */

const puppeteer = require('puppeteer');

async function testAccurateCoordinates() {
    console.log('📍 ACCURATE COORDINATE CLICK TEST');
    console.log('='.repeat(50));

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    try {
        const page = await browser.newPage();
        
        // Add console logging
        page.on('console', msg => {
            if (msg.text().includes('🎯') || msg.text().includes('✅') || msg.text().includes('❌')) {
                console.log(`   Browser: ${msg.text()}`);
            }
        });

        await page.goto('http://localhost:3001/map', { waitUntil: 'networkidle0' });
        console.log('✅ Map page loaded');

        // Get accurate coordinates from browser
        const locationData = await page.evaluate(() => {
            const svg = document.querySelector('svg');
            if (!svg) return { error: 'No SVG found' };

            const locations = ['ice-fortress', 'the-shire', 'goblin-king-lair'];
            const results = {};

            locations.forEach(locationId => {
                const elements = Array.from(svg.querySelectorAll(`[data-location="${locationId}"]`));
                if (elements.length > 0) {
                    const element = elements[elements.length - 1]; // Get the last one (highest z-index)
                    const rect = element.getBoundingClientRect();
                    
                    results[locationId] = {
                        found: true,
                        svgCoords: {
                            cx: parseFloat(element.getAttribute('cx')),
                            cy: parseFloat(element.getAttribute('cy')),
                            r: parseFloat(element.getAttribute('r'))
                        },
                        screenRect: {
                            x: rect.x,
                            y: rect.y,
                            width: rect.width,
                            height: rect.height,
                            centerX: rect.x + rect.width / 2,
                            centerY: rect.y + rect.height / 2
                        },
                        elementCount: elements.length
                    };
                } else {
                    results[locationId] = { found: false };
                }
            });

            return results;
        });

        console.log('\\n📊 Accurate Coordinate Data:');
        Object.entries(locationData).forEach(([locationId, data]) => {
            if (data.found) {
                console.log(`\\n   ${locationId.toUpperCase()}:`);
                console.log(`     SVG: (${data.svgCoords.cx}, ${data.svgCoords.cy}) r=${data.svgCoords.r}`);
                console.log(`     Screen: (${Math.round(data.screenRect.centerX)}, ${Math.round(data.screenRect.centerY)})`);
                console.log(`     Elements: ${data.elementCount}`);
            } else {
                console.log(`\\n   ${locationId.toUpperCase()}: ❌ Not found`);
            }
        });

        console.log('\\n🎯 Testing Accurate Clicks:');

        // Test each location with accurate coordinates
        for (const [locationId, data] of Object.entries(locationData)) {
            if (!data.found) {
                console.log(`\\n   ${locationId}: ❌ Skipping - not found`);
                continue;
            }

            console.log(`\\n   Testing: ${locationId}`);
            
            try {
                // Click at the exact center coordinates
                await page.mouse.click(data.screenRect.centerX, data.screenRect.centerY);
                
                // Wait a moment for any click handlers
                await page.waitForTimeout(100);
                
                // Check if the click was detected
                const clickDetected = await page.evaluate((locationId) => {
                    // Look for any signs that the click was processed
                    const recentConsoleEntries = window.lastClickLocation || null;
                    return recentConsoleEntries === locationId;
                }, locationId);
                
                console.log(`      Coordinates: (${Math.round(data.screenRect.centerX)}, ${Math.round(data.screenRect.centerY)})`);
                console.log(`      Result: ${clickDetected ? '✅ Click detected' : '❓ Checking browser console...'}`);
                
            } catch (error) {
                console.log(`      Result: ❌ Click failed - ${error.message}`);
            }
        }

        console.log('\\n📝 Manual Verification:');
        console.log('   1. Browser window is open - try clicking the locations manually');
        console.log('   2. Check browser console for click event logs');
        console.log('   3. Verify disambiguation modal appears');
        console.log('   4. Press Ctrl+C when done');

        // Keep browser open for manual verification
        await new Promise(resolve => {
            process.on('SIGINT', () => {
                console.log('\\n🛑 Closing test browser...');
                resolve();
            });
        });

    } catch (error) {
        console.error('❌ Test error:', error);
    } finally {
        await browser.close();
    }
}

if (require.main === module) {
    testAccurateCoordinates().catch(console.error);
}

module.exports = { testAccurateCoordinates };