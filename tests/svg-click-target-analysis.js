#!/usr/bin/env node

/**
 * SVG Element Z-Index and Click Target Analysis
 * Analyzes why some click targets work while others don't
 */

const puppeteer = require('puppeteer');

async function analyzeSVGClickTargets() {
    console.log('🔍 SVG CLICK TARGET ANALYSIS');
    console.log('='.repeat(50));

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    try {
        const page = await browser.newPage();
        await page.goto('http://localhost:3001/map', { waitUntil: 'networkidle0' });

        console.log('📊 Analyzing SVG structure and click targets...');

        // Analyze SVG structure and click detection
        const analysis = await page.evaluate(() => {
            const svg = document.querySelector('svg');
            if (!svg) return { error: 'No SVG found' };

            const locations = ['ice-fortress', 'the-shire', 'goblin-king-lair'];
            const results = {};

            locations.forEach(locationId => {
                // Find all elements for this location
                const elements = Array.from(svg.querySelectorAll(`[data-location="${locationId}"]`));
                
                if (elements.length === 0) {
                    results[locationId] = { status: 'not-found', elements: [] };
                    return;
                }

                const elementInfo = elements.map(el => {
                    const rect = el.getBoundingClientRect();
                    const computedStyle = window.getComputedStyle(el);
                    
                    return {
                        tagName: el.tagName,
                        className: el.className.baseVal || el.className,
                        cx: el.getAttribute('cx'),
                        cy: el.getAttribute('cy'),
                        r: el.getAttribute('r'),
                        pointerEvents: computedStyle.pointerEvents,
                        zIndex: computedStyle.zIndex,
                        position: computedStyle.position,
                        rect: {
                            x: rect.x,
                            y: rect.y,
                            width: rect.width,
                            height: rect.height
                        }
                    };
                });

                // Test what element is actually at the center coordinates
                const firstElement = elements[0];
                if (firstElement) {
                    const rect = firstElement.getBoundingClientRect();
                    const centerX = rect.x + rect.width / 2;
                    const centerY = rect.y + rect.height / 2;
                    
                    const elementAtPoint = document.elementFromPoint(centerX, centerY);
                    const svgElementAtPoint = svg.ownerDocument.elementFromPoint ? 
                        svg.ownerDocument.elementFromPoint(centerX, centerY) : null;

                    results[locationId] = {
                        status: 'found',
                        elements: elementInfo,
                        centerCoords: { x: centerX, y: centerY },
                        elementAtPoint: elementAtPoint ? {
                            tagName: elementAtPoint.tagName,
                            className: elementAtPoint.className,
                            id: elementAtPoint.id,
                            dataLocation: elementAtPoint.getAttribute('data-location')
                        } : null
                    };
                }
            });

            return results;
        });

        console.log('\\n🎯 Click Target Analysis Results:');
        console.log('='.repeat(50));

        Object.entries(analysis).forEach(([locationId, data]) => {
            console.log(`\\n📍 ${locationId.toUpperCase()}:`);
            
            if (data.status === 'not-found') {
                console.log('   ❌ No elements found with this data-location');
                return;
            }

            console.log(`   ✅ Found ${data.elements.length} element(s)`);
            
            data.elements.forEach((el, i) => {
                console.log(`   Element ${i + 1}:`);
                console.log(`     Tag: ${el.tagName}`);
                console.log(`     Class: ${el.className}`);
                console.log(`     Coords: (${el.cx}, ${el.cy}) r=${el.r}`);
                console.log(`     Pointer Events: ${el.pointerEvents}`);
                console.log(`     Screen Rect: ${Math.round(el.rect.x)},${Math.round(el.rect.y)} ${Math.round(el.rect.width)}x${Math.round(el.rect.height)}`);
            });

            if (data.centerCoords && data.elementAtPoint) {
                console.log(`   Center Point: (${Math.round(data.centerCoords.x)}, ${Math.round(data.centerCoords.y)})`);
                console.log(`   Element At Point: ${data.elementAtPoint.tagName} (${data.elementAtPoint.className})`);
                console.log(`   Data Location: ${data.elementAtPoint.dataLocation || 'none'}`);
                
                const isCorrectTarget = data.elementAtPoint.dataLocation === locationId;
                console.log(`   Click Target Match: ${isCorrectTarget ? '✅' : '❌'}`);
                
                if (!isCorrectTarget) {
                    console.log(`   🚨 ISSUE: Expected ${locationId}, but found ${data.elementAtPoint.dataLocation || 'no data-location'}`);
                }
            }
        });

        console.log('\\n🔧 Recommendations:');
        
        // Check for common issues
        const hasPointerEventsIssues = Object.values(analysis).some(data => 
            data.elements && data.elements.some(el => el.pointerEvents === 'none')
        );
        
        const hasOverlapIssues = Object.values(analysis).some(data => 
            data.elementAtPoint && data.elementAtPoint.dataLocation !== data.elements[0]?.cx
        );

        if (hasPointerEventsIssues) {
            console.log('   🎯 Add pointer-events: all to click targets');
        }
        
        if (hasOverlapIssues) {
            console.log('   📋 Move click targets to end of SVG for highest z-index');
        }

        console.log('\\n🧪 Manual Testing Available:');
        console.log('   - Browser window remains open');
        console.log('   - Try clicking on the analyzed locations');
        console.log('   - Check browser console for click events');
        console.log('   - Press Ctrl+C when done');

        // Keep browser open for manual testing
        await new Promise(resolve => {
            process.on('SIGINT', () => {
                console.log('\\n🛑 Closing analysis browser...');
                resolve();
            });
        });

    } catch (error) {
        console.error('❌ Analysis error:', error);
    } finally {
        await browser.close();
    }
}

if (require.main === module) {
    analyzeSVGClickTargets().catch(console.error);
}

module.exports = { analyzeSVGClickTargets };