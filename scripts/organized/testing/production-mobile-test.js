#!/usr/bin/env node

/**
 * Wavelength Gems - Production Mobile Test
 * Tests the actual production site on iPhone XR to match user experience
 */

const puppeteer = require('puppeteer');

async function testProductionMobile() {
    console.log('📱 Production iPhone XR Game Board Test');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: false, // Show browser for visual comparison
            defaultViewport: null,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // iPhone XR exact specifications
        const iPhoneXR = {
            width: 414,   // CSS pixels
            height: 896,  // CSS pixels but Safari reduces this due to UI
            deviceScaleFactor: 2,
            isMobile: true,
            hasTouch: true,
            isLandscape: false
        };
        
        console.log(`📱 Setting iPhone XR viewport: ${iPhoneXR.width}x${iPhoneXR.height}`);
        await page.setViewport(iPhoneXR);
        
        // Set realistic iPhone XR user agent
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1');
        
        // Test both development and production URLs
        const testUrls = [
            { name: 'Development', url: 'http://localhost:3001/games/wavelength-gems' },
            { name: 'Production', url: 'https://wavelengthlore.com/games/wavelength-gems' }
        ];
        
        for (const testSite of testUrls) {
            console.log(`\n🔗 Testing ${testSite.name}: ${testSite.url}`);
            
            try {
                await page.goto(testSite.url, { 
                    waitUntil: 'networkidle0',
                    timeout: 30000 
                });
                
                console.log('⏳ Waiting for game to load...');
                await page.waitForFunction(() => document.readyState === 'complete', { timeout: 15000 });
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                // Comprehensive mobile analysis
                const analysis = await page.evaluate((siteName) => {
                    const results = {
                        site: siteName,
                        timestamp: new Date().toISOString(),
                        gameBoard: null,
                        layout: {},
                        performance: {},
                        issues: [],
                        recommendations: []
                    };
                    
                    // Find game board - try multiple selectors
                    const selectors = ['#game-board', 'canvas', '.game-container', '.game-board', '#wavelength-gems-canvas'];
                    let gameBoard = null;
                    
                    for (const selector of selectors) {
                        gameBoard = document.querySelector(selector);
                        if (gameBoard) break;
                    }
                    
                    if (!gameBoard) {
                        results.issues.push(`❌ No game board found using selectors: ${selectors.join(', ')}`);
                        return results;
                    }
                    
                    const rect = gameBoard.getBoundingClientRect();
                    const style = window.getComputedStyle(gameBoard);
                    
                    results.gameBoard = {
                        selector: gameBoard.tagName.toLowerCase() + (gameBoard.id ? '#' + gameBoard.id : '') + (gameBoard.className ? '.' + gameBoard.className.split(' ')[0] : ''),
                        dimensions: {
                            width: rect.width,
                            height: rect.height,
                            naturalWidth: gameBoard.width || gameBoard.naturalWidth || 'unknown',
                            naturalHeight: gameBoard.height || gameBoard.naturalHeight || 'unknown'
                        },
                        position: {
                            left: rect.left,
                            top: rect.top,
                            right: rect.right,
                            bottom: rect.bottom
                        },
                        visibility: {
                            inViewport: rect.right <= window.innerWidth && rect.bottom <= window.innerHeight,
                            percentVisible: Math.min(100, Math.max(0, 
                                ((Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0)) *
                                (Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0))) /
                                (rect.width * rect.height) * 100)).toFixed(1)
                        },
                        styles: {
                            position: style.position,
                            width: style.width,
                            height: style.height,
                            maxWidth: style.maxWidth,
                            maxHeight: style.maxHeight,
                            transform: style.transform,
                            zIndex: style.zIndex,
                            overflow: style.overflow
                        }
                    };
                    
                    // Check layout and container
                    const container = gameBoard.parentElement;
                    if (container) {
                        const containerRect = container.getBoundingClientRect();
                        const containerStyle = window.getComputedStyle(container);
                        
                        results.layout = {
                            container: {
                                width: containerRect.width,
                                height: containerRect.height,
                                overflow: containerStyle.overflow,
                                padding: containerStyle.padding,
                                margin: containerStyle.margin
                            },
                            viewport: {
                                width: window.innerWidth,
                                height: window.innerHeight,
                                availableHeight: window.innerHeight - (window.outerHeight - window.innerHeight) // Account for browser UI
                            }
                        };
                    }
                    
                    // Check for mobile-specific issues
                    const viewportMeta = document.querySelector('meta[name="viewport"]');
                    results.layout.viewportMeta = viewportMeta ? viewportMeta.content : null;
                    
                    // Performance check
                    if (performance.timing) {
                        results.performance = {
                            loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
                            domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
                        };
                    }
                    
                    // Identify issues
                    if (rect.width === 0 || rect.height === 0) {
                        results.issues.push('❌ Game board has zero dimensions');
                    }
                    
                    if (rect.right > window.innerWidth) {
                        results.issues.push(`❌ Game board extends ${(rect.right - window.innerWidth).toFixed(0)}px beyond right edge`);
                    }
                    
                    if (rect.bottom > window.innerHeight) {
                        results.issues.push(`❌ Game board extends ${(rect.bottom - window.innerHeight).toFixed(0)}px beyond bottom edge`);
                    }
                    
                    if (parseFloat(results.gameBoard.visibility.percentVisible) < 95) {
                        results.issues.push(`⚠️ Only ${results.gameBoard.visibility.percentVisible}% of game board visible`);
                    }
                    
                    if (!viewportMeta || !viewportMeta.content.includes('width=device-width')) {
                        results.issues.push('❌ Missing or incorrect viewport meta tag');
                    }
                    
                    // Generate recommendations
                    if (rect.width > window.innerWidth) {
                        results.recommendations.push('Add CSS: max-width: 100vw to prevent horizontal overflow');
                    }
                    
                    if (rect.height > window.innerHeight) {
                        results.recommendations.push('Add CSS: max-height: 100vh to prevent vertical overflow');
                    }
                    
                    if (style.position === 'absolute' && (rect.left !== 0 || rect.top !== 0)) {
                        results.recommendations.push('Check absolute positioning - may cause mobile layout issues');
                    }
                    
                    return results;
                }, testSite.name);
                
                // Display results for this site
                console.log(`\n📊 ${testSite.name.toUpperCase()} ANALYSIS:`);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                
                if (analysis.gameBoard) {
                    console.log(`🎮 Game Board: ${analysis.gameBoard.selector}`);
                    console.log(`   Dimensions: ${analysis.gameBoard.dimensions.width}x${analysis.gameBoard.dimensions.height}px`);
                    console.log(`   Position: (${analysis.gameBoard.position.left}, ${analysis.gameBoard.position.top})`);
                    console.log(`   Visibility: ${analysis.gameBoard.visibility.percentVisible}% visible`);
                    console.log(`   In viewport: ${analysis.gameBoard.visibility.inViewport ? '✅ Yes' : '❌ No'}`);
                    
                    if (analysis.layout.viewport) {
                        console.log(`📱 Viewport: ${analysis.layout.viewport.width}x${analysis.layout.viewport.height}px`);
                        console.log(`   Available height: ${analysis.layout.viewport.availableHeight}px`);
                    }
                    
                    if (analysis.performance.loadTime) {
                        console.log(`⏱️ Performance: ${analysis.performance.loadTime}ms load time`);
                    }
                }
                
                if (analysis.issues.length > 0) {
                    console.log(`\n🚨 Issues (${analysis.issues.length}):`);
                    analysis.issues.forEach((issue, i) => console.log(`   ${i + 1}. ${issue}`));
                }
                
                if (analysis.recommendations.length > 0) {
                    console.log(`\n💡 Recommendations (${analysis.recommendations.length}):`);
                    analysis.recommendations.forEach((rec, i) => console.log(`   ${i + 1}. ${rec}`));
                }
                
            } catch (error) {
                console.log(`❌ Failed to test ${testSite.name}: ${error.message}`);
            }
        }
        
        console.log(`\n🎯 COMPARISON SUMMARY:`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('The browser window shows both development and production versions.');
        console.log('Compare these with your iPhone XR experience to identify differences.');
        console.log('\n📱 What to check on your iPhone XR:');
        console.log('   1. Does the game board fill the screen properly?');
        console.log('   2. Are there scroll bars or cut-off edges?');
        console.log('   3. Is the game playable without zooming?');
        console.log('   4. Do the gems appear properly sized?');
        
        console.log('\nPress Ctrl+C when finished inspecting...');
        await new Promise(() => {});
        
    } catch (error) {
        console.error('❌ Production mobile test failed:', error.message);
        if (browser) await browser.close();
    }
}

testProductionMobile();