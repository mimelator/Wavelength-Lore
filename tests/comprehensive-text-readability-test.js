const puppeteer = require('puppeteer');

async function comprehensiveTextReadabilityTest() {
    console.log('🌊 WAVELENGTH: Comprehensive Text Readability Analysis...');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        devtools: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });
        
        console.log('📍 Navigating to merchandise page...');
        await page.goto('http://localhost:3001/merchandise', { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });
        
        // Wait for page to load completely
        await page.waitForTimeout(3000);
        
        console.log('🔍 Analyzing ALL text elements for readability...');
        
        // Get comprehensive text analysis
        const textAnalysis = await page.evaluate(() => {
            const results = [];
            
            // Find all text elements that might contain descriptions
            const selectors = [
                '.product-description',
                '.category-description', 
                '.category-card p',
                '.category-card .description',
                '.product-info p',
                '.description',
                'p[class*="description"]',
                '*[class*="description"]:not(input):not(textarea)',
                // Check for any text that matches the pattern mentioned
                '*:contains("Comfortable hoodies")',
                '*:contains("Custom merchandise")'
            ];
            
            // Function to get all text nodes
            function getTextNodes(element) {
                const textNodes = [];
                const walker = document.createTreeWalker(
                    element,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );
                
                let node;
                while (node = walker.nextNode()) {
                    if (node.textContent.trim().length > 10) { // Only meaningful text
                        textNodes.push(node);
                    }
                }
                return textNodes;
            }
            
            // Check each selector
            selectors.forEach(selector => {
                try {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach((el, index) => {
                        if (el && el.textContent && el.textContent.trim().length > 10) {
                            const computedStyle = window.getComputedStyle(el);
                            const rect = el.getBoundingClientRect();
                            
                            results.push({
                                selector: selector,
                                index: index,
                                text: el.textContent.trim().substring(0, 60) + '...',
                                color: computedStyle.color,
                                backgroundColor: computedStyle.backgroundColor,
                                textShadow: computedStyle.textShadow,
                                fontSize: computedStyle.fontSize,
                                fontWeight: computedStyle.fontWeight,
                                opacity: computedStyle.opacity,
                                isVisible: rect.width > 0 && rect.height > 0 && computedStyle.display !== 'none',
                                className: el.className,
                                tagName: el.tagName,
                                hasParentWithBackground: false
                            });
                        }
                    });
                } catch (e) {
                    // Skip selectors that don't work
                }
            });
            
            // Special check for text containing specific phrases
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                if (el.textContent && (
                    el.textContent.includes('Comfortable hoodies') ||
                    el.textContent.includes('Custom merchandise') ||
                    el.textContent.includes('cool weather and casual style')
                )) {
                    const computedStyle = window.getComputedStyle(el);
                    const rect = el.getBoundingClientRect();
                    
                    results.push({
                        selector: 'SPECIAL_PHRASE_MATCH',
                        index: 0,
                        text: el.textContent.trim().substring(0, 80) + '...',
                        color: computedStyle.color,
                        backgroundColor: computedStyle.backgroundColor,
                        textShadow: computedStyle.textShadow,
                        fontSize: computedStyle.fontSize,
                        fontWeight: computedStyle.fontWeight,
                        opacity: computedStyle.opacity,
                        isVisible: rect.width > 0 && rect.height > 0,
                        className: el.className,
                        tagName: el.tagName,
                        hasParentWithBackground: true
                    });
                }
            });
            
            return results;
        });
        
        console.log('\n📋 COMPREHENSIVE TEXT READABILITY ANALYSIS:');
        console.log('═══════════════════════════════════════════════════');
        
        // Group results by selector
        const groupedResults = {};
        textAnalysis.forEach(result => {
            if (!groupedResults[result.selector]) {
                groupedResults[result.selector] = [];
            }
            groupedResults[result.selector].push(result);
        });
        
        let totalProblematic = 0;
        let totalChecked = 0;
        
        Object.keys(groupedResults).forEach(selector => {
            const results = groupedResults[selector];
            console.log(`\n🎯 SELECTOR: ${selector}`);
            console.log('─'.repeat(50));
            
            results.forEach((result, index) => {
                totalChecked++;
                console.log(`\n${index + 1}. "${result.text}"`);
                console.log(`   🏷️  Tag: <${result.tagName.toLowerCase()}> class="${result.className}"`);
                console.log(`   🎨 Color: ${result.color}`);
                console.log(`   🖼️  Background: ${result.backgroundColor}`);
                console.log(`   ✨ Text Shadow: ${result.textShadow}`);
                console.log(`   📏 Font: ${result.fontSize} / ${result.fontWeight}`);
                console.log(`   👁️  Visible: ${result.isVisible ? '✅' : '❌'}`);
                console.log(`   🔍 Opacity: ${result.opacity}`);
                
                // Analyze readability
                const isProblematic = result.isVisible && (
                    result.color.includes('113, 128, 150') || // #718096
                    result.color.includes('rgb(113, 128, 150)') ||
                    result.color.includes('#718096') ||
                    (result.textShadow === 'none' && result.backgroundColor.includes('rgba(0, 0, 0, 0)'))
                );
                
                const hasGoodContrast = result.color.includes('45, 55, 72') || // #2d3748
                                      result.color.includes('rgb(45, 55, 72)') ||
                                      result.color.includes('#2d3748');
                
                const hasTextShadow = result.textShadow !== 'none' && result.textShadow !== '';
                
                if (isProblematic) {
                    console.log(`   ❌ PROBLEMATIC: Light gray text - hard to read!`);
                    totalProblematic++;
                } else if (hasGoodContrast && hasTextShadow) {
                    console.log(`   ✅ GOOD: Dark color with text shadow`);
                } else if (hasGoodContrast) {
                    console.log(`   🟡 OKAY: Dark color but no text shadow`);
                } else {
                    console.log(`   🟠 NEEDS REVIEW: Color/contrast might need improvement`);
                }
            });
        });
        
        console.log('\n🎯 SUMMARY:');
        console.log('═══════════════════════════════════════');
        console.log(`📊 Total text elements analyzed: ${totalChecked}`);
        console.log(`❌ Problematic (hard to read): ${totalProblematic}`);
        console.log(`✅ Good readability: ${totalChecked - totalProblematic}`);
        console.log(`📈 Readability success rate: ${Math.round(((totalChecked - totalProblematic) / totalChecked) * 100)}%`);
        
        if (totalProblematic > 0) {
            console.log('\n🔧 RECOMMENDATIONS:');
            console.log('1. Update CSS for problematic selectors to use #2d3748 color');
            console.log('2. Add text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8)');
            console.log('3. Consider background contrast improvements');
        }
        
        // Try to trigger category cards specifically
        console.log('\n🔄 Attempting to trigger category cards for specific testing...');
        
        try {
            await page.evaluate(() => {
                // Try multiple methods to show category cards
                if (window.merchandiseStore) {
                    if (window.merchandiseStore.displayCategoryCards) {
                        window.merchandiseStore.displayCategoryCards();
                    }
                    if (window.merchandiseStore.showCategoryCards) {
                        window.merchandiseStore.showCategoryCards();
                    }
                }
            });
            
            await page.waitForTimeout(2000);
            
            // Try clicking if cards appear
            try {
                await page.waitForSelector('.category-card', { timeout: 5000 });
                console.log('✅ Category cards found! Clicking first one...');
                await page.click('.category-card:first-child .browse-category-btn');
                
                await page.waitForTimeout(3000);
                
                // Re-analyze after category selection
                console.log('\n🔄 RE-ANALYZING AFTER CATEGORY SELECTION...');
                const postClickAnalysis = await page.evaluate(() => {
                    const descriptions = Array.from(document.querySelectorAll('.category-description, .product-description, *[class*="description"]'));
                    return descriptions.map(el => {
                        const computedStyle = window.getComputedStyle(el);
                        return {
                            text: el.textContent.trim().substring(0, 60) + '...',
                            color: computedStyle.color,
                            textShadow: computedStyle.textShadow,
                            className: el.className,
                            tagName: el.tagName
                        };
                    });
                });
                
                console.log('\n📋 AFTER CATEGORY SELECTION:');
                postClickAnalysis.forEach((item, index) => {
                    console.log(`${index + 1}. "${item.text}"`);
                    console.log(`   Class: ${item.className}`);
                    console.log(`   Color: ${item.color}`);
                    console.log(`   Shadow: ${item.textShadow}`);
                    
                    if (item.text.includes('Comfortable hoodies') || item.text.includes('cool weather')) {
                        console.log(`   🎯 FOUND TARGET TEXT! This needs fixing!`);
                    }
                });
                
            } catch (e) {
                console.log('⚠️ Could not trigger category workflow automatically');
            }
        } catch (e) {
            console.log('⚠️ Category cards not accessible via JavaScript');
        }
        
        console.log('\n🔍 Browser kept open for manual inspection...');
        console.log('You can manually navigate and check specific text elements.');
        console.log('Press Ctrl+C when done.');
        
        // Keep browser open for manual testing
        await new Promise(resolve => {
            process.on('SIGINT', resolve);
        });
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the comprehensive test
comprehensiveTextReadabilityTest().catch(console.error);