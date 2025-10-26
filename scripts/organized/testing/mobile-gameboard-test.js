#!/usr/bin/env node

/**
 * Wavelength Gems - iPhone XR Mobile Viewport Test
 * Specifically tests game board rendering and visibility on iPhone XR dimensions
 */

const puppeteer = require('puppeteer');

async function testMobileGameBoard() {
    console.log('📱 iPhone XR Game Board Visibility Test');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    let browser;
    try {
        // Launch browser with mobile simulation
        browser = await puppeteer.launch({ 
            headless: false, // Show browser to see actual rendering
            defaultViewport: null,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // iPhone XR dimensions (actual device specs)
        const iPhoneXR = {
            width: 414,   // CSS pixels
            height: 896,  // CSS pixels
            deviceScaleFactor: 2,
            isMobile: true,
            hasTouch: true,
            isLandscape: false
        };
        
        console.log(`📱 Setting iPhone XR viewport: ${iPhoneXR.width}x${iPhoneXR.height}`);
        await page.setViewport(iPhoneXR);
        
        // Set mobile user agent
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1');
        
        console.log('🔗 Loading Wavelength Gems on mobile viewport...');
        await page.goto('http://localhost:3001/games/wavelength-gems', { 
            waitUntil: 'networkidle0',
            timeout: 20000 
        });
        
        console.log('⏳ Waiting for game to load...');
        await page.waitForFunction(() => document.readyState === 'complete', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Comprehensive mobile game board analysis
        const mobileAnalysis = await page.evaluate((viewport) => {
            const results = {
                viewport: viewport,
                timestamp: new Date().toISOString(),
                gameBoard: {},
                visibility: {},
                layout: {},
                issues: [],
                recommendations: []
            };
            
            // Find game board element
            const gameBoard = document.querySelector('#game-board') || 
                             document.querySelector('canvas') || 
                             document.querySelector('.game-container') ||
                             document.querySelector('.game-board');
            
            if (!gameBoard) {
                results.issues.push('❌ CRITICAL: No game board element found');
                return results;
            }
            
            // Get game board dimensions and position
            const boardRect = gameBoard.getBoundingClientRect();
            results.gameBoard = {
                element: gameBoard.tagName.toLowerCase(),
                id: gameBoard.id || 'no-id',
                className: gameBoard.className || 'no-class',
                width: boardRect.width,
                height: boardRect.height,
                left: boardRect.left,
                top: boardRect.top,
                right: boardRect.right,
                bottom: boardRect.bottom,
                visible: boardRect.width > 0 && boardRect.height > 0
            };
            
            // Check viewport overflow/truncation
            results.visibility = {
                fitsInViewport: boardRect.right <= window.innerWidth && boardRect.bottom <= window.innerHeight,
                horizontalOverflow: boardRect.right > window.innerWidth,
                verticalOverflow: boardRect.bottom > window.innerHeight,
                horizontalTruncated: boardRect.left < 0 || boardRect.right > window.innerWidth,
                verticalTruncated: boardRect.top < 0 || boardRect.bottom > window.innerHeight,
                visibleWidth: Math.min(boardRect.right, window.innerWidth) - Math.max(boardRect.left, 0),
                visibleHeight: Math.min(boardRect.bottom, window.innerHeight) - Math.max(boardRect.top, 0)
            };
            
            // Calculate visibility percentages
            const totalBoardArea = boardRect.width * boardRect.height;
            const visibleArea = results.visibility.visibleWidth * results.visibility.visibleHeight;
            results.visibility.visibilityPercentage = totalBoardArea > 0 ? (visibleArea / totalBoardArea * 100).toFixed(1) : 0;
            
            // Check layout and container issues
            const container = gameBoard.parentElement;
            if (container) {
                const containerRect = container.getBoundingClientRect();
                results.layout = {
                    containerWidth: containerRect.width,
                    containerHeight: containerRect.height,
                    containerOverflow: window.getComputedStyle(container).overflow,
                    boardFitsInContainer: boardRect.width <= containerRect.width && boardRect.height <= containerRect.height
                };
            }
            
            // Analyze CSS styles affecting mobile layout
            const computedStyle = window.getComputedStyle(gameBoard);
            results.layout.styles = {
                position: computedStyle.position,
                display: computedStyle.display,
                width: computedStyle.width,
                height: computedStyle.height,
                maxWidth: computedStyle.maxWidth,
                maxHeight: computedStyle.maxHeight,
                transform: computedStyle.transform,
                overflow: computedStyle.overflow
            };
            
            // Check for mobile-specific CSS
            const metaViewport = document.querySelector('meta[name="viewport"]');
            results.layout.viewportMeta = metaViewport ? metaViewport.content : 'missing';
            
            // Generate issues and recommendations
            if (!results.gameBoard.visible) {
                results.issues.push('❌ Game board is not visible (0 dimensions)');
            }
            
            if (results.visibility.horizontalTruncated) {
                results.issues.push(`❌ Game board is horizontally truncated (extends ${boardRect.right - window.innerWidth}px beyond viewport)`);
                results.recommendations.push('Add responsive CSS: max-width: 100vw and adjust game board scaling');
            }
            
            if (results.visibility.verticalTruncated) {
                results.issues.push(`❌ Game board is vertically truncated (extends ${boardRect.bottom - window.innerHeight}px beyond viewport)`);
                results.recommendations.push('Add responsive CSS: max-height: 100vh and implement vertical scrolling or scaling');
            }
            
            if (parseFloat(results.visibility.visibilityPercentage) < 90) {
                results.issues.push(`⚠️ Only ${results.visibility.visibilityPercentage}% of game board is visible`);
                results.recommendations.push('Implement responsive design to ensure 100% game board visibility on mobile');
            }
            
            if (boardRect.width > window.innerWidth) {
                results.recommendations.push(`Scale down game board: current ${boardRect.width}px > viewport ${window.innerWidth}px`);
            }
            
            if (!metaViewport) {
                results.issues.push('❌ Missing viewport meta tag for mobile optimization');
                results.recommendations.push('Add: <meta name="viewport" content="width=device-width, initial-scale=1.0">');
            }
            
            return results;
        }, iPhoneXR);
        
        // Display comprehensive analysis
        console.log('\n📊 IPHONE XR GAME BOARD ANALYSIS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        console.log(`🎮 Game Board Found: ${mobileAnalysis.gameBoard.element ? '✅ Yes' : '❌ No'}`);
        if (mobileAnalysis.gameBoard.element) {
            console.log(`   Element: <${mobileAnalysis.gameBoard.element}> ${mobileAnalysis.gameBoard.id ? '#' + mobileAnalysis.gameBoard.id : ''}`);
            console.log(`   Dimensions: ${mobileAnalysis.gameBoard.width}x${mobileAnalysis.gameBoard.height}px`);
            console.log(`   Position: left=${mobileAnalysis.gameBoard.left}px, top=${mobileAnalysis.gameBoard.top}px`);
        }
        
        console.log(`\n📱 Viewport: ${iPhoneXR.width}x${iPhoneXR.height}px (iPhone XR)`);
        console.log(`🔍 Visibility: ${mobileAnalysis.visibility.visibilityPercentage}% of game board visible`);
        console.log(`   Fits in viewport: ${mobileAnalysis.visibility.fitsInViewport ? '✅ Yes' : '❌ No'}`);
        console.log(`   Horizontal overflow: ${mobileAnalysis.visibility.horizontalOverflow ? '❌ Yes' : '✅ No'}`);
        console.log(`   Vertical overflow: ${mobileAnalysis.visibility.verticalOverflow ? '❌ Yes' : '✅ No'}`);
        console.log(`   Visible area: ${mobileAnalysis.visibility.visibleWidth}x${mobileAnalysis.visibility.visibleHeight}px`);
        
        if (mobileAnalysis.layout.containerWidth) {
            console.log(`\n📦 Container Analysis:`);
            console.log(`   Container size: ${mobileAnalysis.layout.containerWidth}x${mobileAnalysis.layout.containerHeight}px`);
            console.log(`   Board fits in container: ${mobileAnalysis.layout.boardFitsInContainer ? '✅ Yes' : '❌ No'}`);
            console.log(`   Container overflow: ${mobileAnalysis.layout.containerOverflow}`);
        }
        
        console.log(`\n🎨 CSS Styles:`);
        console.log(`   Position: ${mobileAnalysis.layout.styles.position}`);
        console.log(`   Display: ${mobileAnalysis.layout.styles.display}`);
        console.log(`   Width: ${mobileAnalysis.layout.styles.width}`);
        console.log(`   Height: ${mobileAnalysis.layout.styles.height}`);
        console.log(`   Max-width: ${mobileAnalysis.layout.styles.maxWidth}`);
        console.log(`   Max-height: ${mobileAnalysis.layout.styles.maxHeight}`);
        console.log(`   Viewport meta: ${mobileAnalysis.layout.viewportMeta}`);
        
        // Issues and recommendations
        if (mobileAnalysis.issues.length > 0) {
            console.log(`\n🚨 ISSUES IDENTIFIED (${mobileAnalysis.issues.length}):`);
            mobileAnalysis.issues.forEach((issue, i) => {
                console.log(`   ${i + 1}. ${issue}`);
            });
        }
        
        if (mobileAnalysis.recommendations.length > 0) {
            console.log(`\n💡 RECOMMENDATIONS (${mobileAnalysis.recommendations.length}):`);
            mobileAnalysis.recommendations.forEach((rec, i) => {
                console.log(`   ${i + 1}. ${rec}`);
            });
        }
        
        // Overall assessment
        console.log(`\n🎯 MOBILE READINESS ASSESSMENT:`);
        const visibilityScore = parseFloat(mobileAnalysis.visibility.visibilityPercentage);
        if (visibilityScore >= 95) {
            console.log('✅ EXCELLENT: Game board renders well on iPhone XR');
        } else if (visibilityScore >= 80) {
            console.log('⚠️ GOOD: Minor mobile optimization needed');
        } else if (visibilityScore >= 50) {
            console.log('⚠️ POOR: Significant mobile layout issues detected');
        } else {
            console.log('❌ CRITICAL: Game board severely truncated on mobile');
        }
        
        console.log(`\n📋 IMMEDIATE ACTION ITEMS:`);
        if (mobileAnalysis.visibility.horizontalOverflow) {
            console.log('   🔧 Fix horizontal overflow - implement responsive scaling');
        }
        if (mobileAnalysis.visibility.verticalOverflow) {
            console.log('   🔧 Fix vertical overflow - adjust game board height');
        }
        if (visibilityScore < 90) {
            console.log('   🔧 Improve mobile responsive design for full visibility');
        }
        if (mobileAnalysis.layout.viewportMeta === 'missing') {
            console.log('   🔧 Add proper viewport meta tag');
        }
        
        // Keep browser open for inspection
        console.log(`\n🔍 Browser left open for visual inspection...`);
        console.log('You can inspect the mobile layout and compare with your iPhone XR experience.');
        console.log('Press Ctrl+C when ready to close.');
        
        // Wait for manual termination
        await new Promise(() => {});
        
    } catch (error) {
        console.error('❌ Mobile test failed:', error.message);
        if (browser) await browser.close();
    }
}

// Execute the mobile game board test
testMobileGameBoard();