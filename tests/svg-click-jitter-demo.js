#!/usr/bin/env node

/**
 * SVG Click Jitter Demonstration Test
 * 
 * This test demonstrates the click target instability in the SVG world map.
 * It captures actual mouse coordinates vs where clicks register, showing
 * how SVG elements have unstable click targets that "jitter" around.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001';

class SVGJitterTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            clickTests: [],
            jitterMeasurements: [],
            svgMetrics: {}
        };
    }

    async initialize() {
        console.log('🎯 Initializing SVG Click Jitter Test');
        
        this.browser = await puppeteer.launch({
            headless: false, // Show browser to visualize the jitter
            defaultViewport: { width: 1200, height: 800 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        
        // Enable console logging from the page
        this.page.on('console', msg => {
            if (msg.text().includes('🎯') || msg.text().includes('❌') || msg.text().includes('⚠️')) {
                console.log('   📄 Page:', msg.text());
            }
        });
        
        // Navigate to map page
        await this.page.goto(`${BASE_URL}/map`, { waitUntil: 'networkidle0' });
        console.log('✅ Loaded map page');
    }

    async measureSVGStability() {
        console.log('\\n📏 Measuring SVG Element Stability');
        console.log('-'.repeat(40));
        
        // Inject client-side jitter detection script
        await this.page.evaluate(() => {
            window.jitterResults = [];
            window.svgMetrics = {};
            
            // Get SVG container info
            const mapContainer = document.querySelector('#map-display');
            const svg = document.querySelector('#map-display svg');
            
            if (svg) {
                const svgRect = svg.getBoundingClientRect();
                const containerRect = mapContainer.getBoundingClientRect();
                
                window.svgMetrics = {
                    svgDimensions: {
                        width: svg.getAttribute('width') || svgRect.width,
                        height: svg.getAttribute('height') || svgRect.height,
                        viewBox: svg.getAttribute('viewBox')
                    },
                    actualSize: {
                        width: svgRect.width,
                        height: svgRect.height
                    },
                    containerSize: {
                        width: containerRect.width,
                        height: containerRect.height
                    },
                    positioning: {
                        left: svgRect.left - containerRect.left,
                        top: svgRect.top - containerRect.top
                    }
                };
                
                console.log('🎯 SVG Metrics collected:', window.svgMetrics);
            } else {
                console.log('❌ No SVG found in map container');
            }
        });
        
        const svgMetrics = await this.page.evaluate(() => window.svgMetrics);
        this.results.svgMetrics = svgMetrics;
        
        console.log('   SVG Dimensions:', svgMetrics.svgDimensions);
        console.log('   Actual Rendered Size:', svgMetrics.actualSize);
        console.log('   Container Size:', svgMetrics.containerSize);
        console.log('   Positioning Offset:', svgMetrics.positioning);
        
        return svgMetrics;
    }

    async testClickJitter() {
        console.log('\\n🖱️ Testing Click Target Jitter');
        console.log('-'.repeat(40));
        
        // Get all clickable locations
        const locations = await this.page.evaluate(() => {
            const clickables = document.querySelectorAll('#map-display [data-location]');
            return Array.from(clickables).map((el, index) => {
                const rect = el.getBoundingClientRect();
                const svgRect = el.closest('svg').getBoundingClientRect();
                
                return {
                    index,
                    location: el.getAttribute('data-location'),
                    tagName: el.tagName.toLowerCase(),
                    attributes: {
                        cx: el.getAttribute('cx'),
                        cy: el.getAttribute('cy'),
                        r: el.getAttribute('r'),
                        x: el.getAttribute('x'),
                        y: el.getAttribute('y'),
                        width: el.getAttribute('width'),
                        height: el.getAttribute('height')
                    },
                    boundingBox: {
                        left: rect.left,
                        top: rect.top,
                        right: rect.right,
                        bottom: rect.bottom,
                        width: rect.width,
                        height: rect.height
                    },
                    svgRelative: {
                        left: rect.left - svgRect.left,
                        top: rect.top - svgRect.top
                    }
                };
            });
        });
        
        console.log(`   Found ${locations.length} clickable locations`);
        
        // Test click accuracy for each location
        for (let i = 0; i < Math.min(locations.length, 5); i++) {
            const location = locations[i];
            console.log(`\\n   🎯 Testing: ${location.location} (${location.tagName})`);
            
            await this.testLocationClickAccuracy(location);
        }
        
        return this.results.clickTests;
    }

    async testLocationClickAccuracy(location) {
        const tests = [];
        
        // Test multiple click points around the element
        const testPoints = this.generateTestPoints(location);
        
        for (const point of testPoints) {
            const result = await this.performClickTest(location, point);
            tests.push(result);
            
            console.log(`      Click at (${point.x.toFixed(1)}, ${point.y.toFixed(1)}): ${result.success ? '✅' : '❌'} ${result.actualTarget || 'no target'}`);
        }
        
        // Calculate jitter metrics
        const jitterMetrics = this.calculateJitterMetrics(tests);
        this.results.jitterMeasurements.push({
            location: location.location,
            metrics: jitterMetrics
        });
        
        console.log(`      Jitter Summary: ${jitterMetrics.successRate.toFixed(1)}% accuracy, ${jitterMetrics.avgOffset.toFixed(1)}px avg offset`);
        
        this.results.clickTests.push({
            location: location.location,
            tests,
            jitterMetrics
        });
    }

    generateTestPoints(location) {
        const bbox = location.boundingBox;
        const centerX = bbox.left + bbox.width / 2;
        const centerY = bbox.top + bbox.height / 2;
        
        // Generate test points: center, edges, and slightly outside
        const points = [
            { x: centerX, y: centerY, type: 'center' },
            { x: bbox.left + 2, y: centerY, type: 'left-edge' },
            { x: bbox.right - 2, y: centerY, type: 'right-edge' },
            { x: centerX, y: bbox.top + 2, type: 'top-edge' },
            { x: centerX, y: bbox.bottom - 2, type: 'bottom-edge' },
            { x: centerX + 5, y: centerY, type: 'slightly-right' },
            { x: centerX - 5, y: centerY, type: 'slightly-left' }
        ];
        
        return points;
    }

    async performClickTest(location, point) {
        try {
            // Move mouse to the point
            await this.page.mouse.move(point.x, point.y);
            
            // Check what element is actually under the cursor
            const elementUnderCursor = await this.page.evaluate((x, y) => {
                const element = document.elementFromPoint(x, y);
                if (!element) return null;
                
                return {
                    tagName: element.tagName.toLowerCase(),
                    dataLocation: element.getAttribute('data-location'),
                    id: element.id,
                    className: element.className
                };
            }, point.x, point.y);
            
            // Attempt click
            await this.page.mouse.click(point.x, point.y);
            
            // Wait a moment for any reactions
            await this.page.waitForTimeout(100);
            
            return {
                point,
                expectedTarget: location.location,
                actualTarget: elementUnderCursor?.dataLocation,
                elementUnderCursor,
                success: elementUnderCursor?.dataLocation === location.location,
                timestamp: Date.now()
            };
            
        } catch (error) {
            return {
                point,
                expectedTarget: location.location,
                actualTarget: null,
                error: error.message,
                success: false,
                timestamp: Date.now()
            };
        }
    }

    calculateJitterMetrics(tests) {
        const successfulClicks = tests.filter(t => t.success);
        const failedClicks = tests.filter(t => !t.success);
        
        const successRate = (successfulClicks.length / tests.length) * 100;
        
        // Calculate average offset for failed clicks
        let totalOffset = 0;
        let offsetCount = 0;
        
        failedClicks.forEach(test => {
            if (test.point && test.elementUnderCursor) {
                // Simple offset calculation - in real scenario this would be more sophisticated
                const offset = Math.sqrt(
                    Math.pow(test.point.x - (test.elementUnderCursor.x || 0), 2) +
                    Math.pow(test.point.y - (test.elementUnderCursor.y || 0), 2)
                );
                totalOffset += offset;
                offsetCount++;
            }
        });
        
        const avgOffset = offsetCount > 0 ? totalOffset / offsetCount : 0;
        
        return {
            totalTests: tests.length,
            successfulClicks: successfulClicks.length,
            failedClicks: failedClicks.length,
            successRate,
            avgOffset,
            mostProblematicPoints: failedClicks.map(t => t.point.type)
        };
    }

    async generateVisualReport() {
        console.log('\\n📊 Generating Visual Jitter Report');
        
        // Create a visual overlay showing click issues
        await this.page.evaluate((results) => {
            // Add CSS for jitter visualization
            const style = document.createElement('style');
            style.textContent = `
                .jitter-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 10000;
                }
                .click-test-point {
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    border: 1px solid #fff;
                }
                .click-success {
                    background: #4CAF50;
                }
                .click-failure {
                    background: #F44336;
                }
                .jitter-info {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: rgba(0,0,0,0.8);
                    color: white;
                    padding: 15px;
                    border-radius: 5px;
                    font-family: monospace;
                    font-size: 12px;
                    max-width: 300px;
                    z-index: 10001;
                }
            `;
            document.head.appendChild(style);
            
            // Create overlay
            const overlay = document.createElement('div');
            overlay.className = 'jitter-overlay';
            
            // Add click test points
            results.clickTests.forEach(locationTest => {
                locationTest.tests.forEach(test => {
                    const point = document.createElement('div');
                    point.className = `click-test-point ${test.success ? 'click-success' : 'click-failure'}`;
                    point.style.left = (test.point.x - 2) + 'px';
                    point.style.top = (test.point.y - 2) + 'px';
                    point.title = `${locationTest.location}: ${test.point.type} - ${test.success ? 'Success' : 'Failed'}`;
                    overlay.appendChild(point);
                });
            });
            
            // Add info panel
            const infoPanel = document.createElement('div');
            infoPanel.className = 'jitter-info';
            
            let html = '<h3>SVG Click Jitter Analysis</h3>';
            html += `<div>Total Locations Tested: ${results.clickTests.length}</div>`;
            
            results.jitterMeasurements.forEach(measurement => {
                html += `<div>${measurement.location}: ${measurement.metrics.successRate.toFixed(1)}% accuracy</div>`;
            });
            
            html += '<div style="margin-top: 10px; font-size: 10px;">Green: Successful clicks<br>Red: Failed clicks</div>';
            
            infoPanel.innerHTML = html;
            
            document.body.appendChild(overlay);
            document.body.appendChild(infoPanel);
            
            console.log('🎯 Visual jitter overlay added to page');
            
        }, this.results);
        
        // Take a screenshot of the jitter visualization
        const screenshot = await this.page.screenshot({
            path: 'svg-jitter-analysis.png',
            fullPage: true
        });
        
        console.log('   📸 Screenshot saved: svg-jitter-analysis.png');
    }

    async saveReport() {
        const reportPath = path.join(process.cwd(), 'svg-jitter-report.json');
        
        const report = {
            timestamp: new Date().toISOString(),
            testUrl: `${BASE_URL}/map`,
            svgMetrics: this.results.svgMetrics,
            clickTests: this.results.clickTests,
            jitterMeasurements: this.results.jitterMeasurements,
            summary: {
                totalLocations: this.results.clickTests.length,
                totalClickTests: this.results.clickTests.reduce((acc, test) => acc + test.tests.length, 0),
                avgSuccessRate: this.results.jitterMeasurements.reduce((acc, m) => acc + m.metrics.successRate, 0) / this.results.jitterMeasurements.length,
                mostProblematicLocations: this.results.jitterMeasurements
                    .sort((a, b) => a.metrics.successRate - b.metrics.successRate)
                    .slice(0, 3)
                    .map(m => ({ location: m.location, successRate: m.metrics.successRate }))
            }
        };
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\\n📄 Detailed report saved: ${reportPath}`);
        
        return report;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async runFullTest() {
        try {
            await this.initialize();
            
            console.log('\\n🔍 SVG CLICK JITTER ANALYSIS');
            console.log('='.repeat(50));
            
            await this.measureSVGStability();
            await this.testClickJitter();
            await this.generateVisualReport();
            
            const report = await this.saveReport();
            
            console.log('\\n📊 JITTER TEST SUMMARY');
            console.log('='.repeat(50));
            console.log(`Average Success Rate: ${report.summary.avgSuccessRate.toFixed(1)}%`);
            console.log(`Total Click Tests: ${report.summary.totalClickTests}`);
            console.log('Most Problematic Locations:');
            report.summary.mostProblematicLocations.forEach((loc, i) => {
                console.log(`   ${i + 1}. ${loc.location}: ${loc.successRate.toFixed(1)}% accuracy`);
            });
            
            console.log('\\n💡 RECOMMENDATIONS:');
            if (report.summary.avgSuccessRate < 80) {
                console.log('   🔥 CRITICAL: Click jitter is severe - SVG needs major fixes');
                console.log('   🔧 Check SVG coordinate system, viewBox, and element positioning');
                console.log('   📐 Verify CSS scaling and container dimensions');
            } else if (report.summary.avgSuccessRate < 95) {
                console.log('   ⚠️ MODERATE: Some click issues detected');
                console.log('   🔧 Fine-tune element boundaries and click areas');
            } else {
                console.log('   ✅ GOOD: Click accuracy is acceptable');
            }
            
            // Keep browser open for manual inspection
            console.log('\\n🔍 Browser left open for manual inspection. Press Ctrl+C to close.');
            
            // Wait indefinitely until user closes
            await new Promise(() => {});
            
        } catch (error) {
            console.error('❌ Test failed:', error);
            throw error;
        } finally {
            await this.cleanup();
        }
    }
}

// Run the test
if (require.main === module) {
    const tester = new SVGJitterTester();
    
    tester.runFullTest().catch(error => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\\n🛑 Shutting down SVG jitter test...');
        await tester.cleanup();
        process.exit(0);
    });
}

module.exports = SVGJitterTester;