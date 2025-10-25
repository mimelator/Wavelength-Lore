#!/usr/bin/env node

/**
 * Simple Map Click Validation Test
 * Tests the fixed SVG coordinate system and click accuracy
 */

const puppeteer = require('puppeteer');

async function testMapClicks() {
    console.log('🗺️ SIMPLE MAP CLICK VALIDATION TEST');
    console.log('='.repeat(50));
    
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1200, height: 800 }
    });
    
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
        if (msg.text().includes('🗺️') || msg.text().includes('🎯') || msg.text().includes('✅')) {
            console.log('   Browser:', msg.text());
        }
    });
    
    try {
        // Navigate to map
        await page.goto('http://localhost:3001/map', { waitUntil: 'networkidle0' });
        console.log('✅ Map page loaded');
        
        // Wait for handlers to attach
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get map metrics
        const metrics = await page.evaluate(() => {
            const svg = document.querySelector('#map-display svg');
            if (!svg) return null;
            
            const rect = svg.getBoundingClientRect();
            const viewBox = svg.getAttribute('viewBox');
            
            return {
                viewBox,
                boundingBox: {
                    width: rect.width,
                    height: rect.height,
                    left: rect.left,
                    top: rect.top
                },
                aspectRatio: rect.width / rect.height,
                scaleFactor: rect.width / 1024
            };
        });
        
        if (metrics) {
            console.log('\\n📊 SVG Metrics:');
            console.log(`   ViewBox: ${metrics.viewBox}`);
            console.log(`   Rendered: ${metrics.boundingBox.width.toFixed(1)}x${metrics.boundingBox.height.toFixed(1)}`);
            console.log(`   Aspect Ratio: ${metrics.aspectRatio.toFixed(3)}`);
            console.log(`   Scale Factor: ${metrics.scaleFactor.toFixed(3)}`);
        }
        
        // Test a few key locations
        const testLocations = [
            { name: 'ice-fortress', expectedSvgCoords: { cx: 235, cy: 180 } },
            { name: 'the-shire', expectedSvgCoords: { cx: 336, cy: 372 } },
            { name: 'goblin-king-lair', expectedSvgCoords: { cx: 720, cy: 600 } }
        ];
        
        console.log('\\n🎯 Testing Click Accuracy:');
        
        for (const location of testLocations) {
            console.log(`\\n   Testing: ${location.name}`);
            
            // Get element info
            const elementInfo = await page.evaluate((locationName) => {
                const element = document.querySelector(`[data-location="${locationName}"]`);
                if (!element) return null;
                
                const rect = element.getBoundingClientRect();
                const cx = element.getAttribute('cx');
                const cy = element.getAttribute('cy');
                const r = element.getAttribute('r');
                
                return {
                    found: true,
                    svgCoords: { cx: parseFloat(cx), cy: parseFloat(cy), r: parseFloat(r) },
                    boundingBox: {
                        left: rect.left,
                        top: rect.top,
                        right: rect.right,
                        bottom: rect.bottom,
                        width: rect.width,
                        height: rect.height,
                        centerX: rect.left + rect.width / 2,
                        centerY: rect.top + rect.height / 2
                    }
                };
            }, location.name);
            
            if (!elementInfo || !elementInfo.found) {
                console.log(`      ❌ Element not found`);
                continue;
            }
            
            console.log(`      SVG coords: (${elementInfo.svgCoords.cx}, ${elementInfo.svgCoords.cy})`);
            console.log(`      Screen center: (${elementInfo.boundingBox.centerX.toFixed(1)}, ${elementInfo.boundingBox.centerY.toFixed(1)})`);
            
            // Test click at center
            try {
                const clickX = elementInfo.boundingBox.centerX;
                const clickY = elementInfo.boundingBox.centerY;
                
                // Move to location
                await page.mouse.move(clickX, clickY);
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Check what's under cursor
                const elementUnderCursor = await page.evaluate((x, y) => {
                    const element = document.elementFromPoint(x, y);
                    return element ? {
                        tagName: element.tagName.toLowerCase(),
                        dataLocation: element.getAttribute('data-location'),
                        className: element.className
                    } : null;
                }, clickX, clickY);
                
                const success = elementUnderCursor && elementUnderCursor.dataLocation === location.name;
                console.log(`      Click test: ${success ? '✅' : '❌'} ${elementUnderCursor?.dataLocation || 'no target'}`);
                
                if (success) {
                    // Try actual click
                    await page.mouse.click(clickX, clickY);
                    await new Promise(resolve => setTimeout(resolve, 500));
                    console.log(`      Click executed successfully`);
                }
                
            } catch (error) {
                console.log(`      ❌ Click test failed: ${error.message}`);
            }
        }
        
        console.log('\\n📋 Manual Testing:');
        console.log('   - Browser left open for manual inspection');
        console.log('   - Try clicking on different map locations');
        console.log('   - Check browser console for coordinate validation');
        console.log('   - Press Ctrl+C to close when done');
        
        // Keep browser open for manual testing
        await new Promise(() => {}); // Wait indefinitely
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\\n🛑 Closing test browser...');
    process.exit(0);
});

// Run test
testMapClicks().catch(console.error);