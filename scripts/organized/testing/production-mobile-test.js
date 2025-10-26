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
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Interact with the welcome screen to get to the actual game
                console.log('🎮 Attempting to start the game...');
                
                // Try to find and click start button or dismiss welcome screen
                const startSelectors = [
                    'button:contains("Start")',
                    'button:contains("Play")', 
                    '.start-button',
                    '.play-button',
                    '[data-action="start"]',
                    '.welcome-screen button',
                    '.instructions button'
                ];
                
                let gameStarted = false;
                for (const selector of startSelectors) {
                    try {
                        if (selector.includes(':contains')) {
                            // Handle text-based selectors
                            const button = await page.evaluateHandle(() => {
                                const buttons = Array.from(document.querySelectorAll('button'));
                                return buttons.find(btn => 
                                    btn.textContent.toLowerCase().includes('start') ||
                                    btn.textContent.toLowerCase().includes('play') ||
                                    btn.textContent.toLowerCase().includes('begin')
                                );
                            });
                            if (button.asElement()) {
                                await button.asElement().click();
                                console.log('   ✅ Clicked start button via text search');
                                gameStarted = true;
                                break;
                            }
                        } else {
                            const element = await page.$(selector);
                            if (element) {
                                await element.click();
                                console.log(`   ✅ Clicked: ${selector}`);
                                gameStarted = true;
                                break;
                            }
                        }
                    } catch (e) {
                        // Continue trying other selectors
                    }
                }
                
                // Try clicking anywhere on screen if no button found (some games start on any click)
                if (!gameStarted) {
                    console.log('   🔄 No start button found, trying screen tap...');
                    await page.click('body');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Try escape key to dismiss overlays
                    await page.keyboard.press('Escape');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
                // Wait for game board to appear
                console.log('⏳ Waiting for actual game board to appear...');
                await new Promise(resolve => setTimeout(resolve, 3000));
                
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
                    
                    // Find actual game board (not welcome screen canvas)
                    const selectors = [
                        '#gameBoard',        // Main game board ID
                        '#game-board', 
                        '.game-grid',
                        '.gems-container',
                        'canvas:not(.welcome-canvas):not(.background-canvas)',
                        '.game-container canvas',
                        '.game-board'
                    ];
                    let gameBoard = null;
                    
                    for (const selector of selectors) {
                        gameBoard = document.querySelector(selector);
                        if (gameBoard) {
                            // Verify this is actually the game board with gems, not just a welcome screen
                            const hasGems = gameBoard.querySelector ? 
                                gameBoard.querySelector('.gem') !== null : 
                                gameBoard.getContext && gameBoard.width > 100 && gameBoard.height > 100;
                            
                            if (hasGems || gameBoard.children.length > 0) {
                                break;
                            }
                        }
                    }
                    
                    // Check if we have gems/grid items as additional validation
                    const gems = document.querySelectorAll('.gem');
                    const gridItems = document.querySelectorAll('.grid-item, .game-cell');
                    
                    results.gameElements = {
                        boardFound: !!gameBoard,
                        boardSelector: gameBoard ? (gameBoard.tagName.toLowerCase() + (gameBoard.id ? '#' + gameBoard.id : '') + (gameBoard.className ? '.' + gameBoard.className.split(' ')[0] : '')) : null,
                        gemsCount: gems.length,
                        gridItemsCount: gridItems.length,
                        hasActiveGame: gems.length > 0 || gridItems.length > 0
                    };
                    
                    if (!gameBoard && !results.gameElements.hasActiveGame) {
                        results.issues.push(`❌ No active game board found using selectors: ${selectors.join(', ')}`);
                        results.issues.push(`❌ No gems or grid items found (${results.gameElements.gemsCount} gems, ${results.gameElements.gridItemsCount} grid items)`);
                        results.issues.push(`❌ Game may still be on welcome/instruction screen`);
                        return results;
                    }
                    
                    // If we found gems but no main board element, create a virtual board analysis
                    if (!gameBoard && results.gameElements.hasActiveGame) {
                        const gemsContainer = document.querySelector('.gems-container') || document.querySelector('#gameBoard') || document.body;
                        if (gemsContainer) {
                            gameBoard = gemsContainer;
                            results.issues.push(`⚠️ Using gems container as game board reference`);
                        }
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
                
                if (analysis.gameElements) {
                    console.log(`🎮 Game Status:`);
                    console.log(`   Board found: ${analysis.gameElements.boardFound ? '✅ Yes' : '❌ No'}`);
                    console.log(`   Active game: ${analysis.gameElements.hasActiveGame ? '✅ Yes' : '❌ No'}`);
                    console.log(`   Gems count: ${analysis.gameElements.gemsCount}`);
                    console.log(`   Grid items: ${analysis.gameElements.gridItemsCount}`);
                    
                    if (analysis.gameElements.boardSelector) {
                        console.log(`   Board element: ${analysis.gameElements.boardSelector}`);
                    }
                }
                
                if (analysis.gameBoard) {
                    console.log(`📊 Game Board Analysis:`);
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