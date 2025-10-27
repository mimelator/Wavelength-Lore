const puppeteer = require('puppeteer');

async function testTextReadabilityFix() {
    console.log('🌊 WAVELENGTH: Testing text readability improvements...');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        devtools: false,
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
        
        // Direct trigger category cards display
        console.log('🔧 Triggering category cards display...');
        await page.evaluate(() => {
            if (window.merchandiseStore && window.merchandiseStore.displayCategoryCards) {
                window.merchandiseStore.displayCategoryCards();
            }
        });
        
        // Wait for category cards
        console.log('⏳ Waiting for category cards...');
        await page.waitForSelector('.category-card', { timeout: 10000 });
        
        // Click on first category (t-shirt)
        console.log('🖱️ Clicking first category card...');
        await page.click('.category-card:first-child .browse-category-btn');
        
        // Wait for products
        console.log('⏳ Waiting for products...');
        await page.waitForSelector('.product-description', { timeout: 10000 });
        
        // Check text readability
        console.log('🔍 Analyzing text readability...');
        const textAnalysis = await page.evaluate(() => {
            const descriptions = Array.from(document.querySelectorAll('.product-description'));
            return descriptions.slice(0, 5).map((el, index) => {
                const computedStyle = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                
                return {
                    index: index + 1,
                    text: el.textContent.trim().substring(0, 50) + '...',
                    color: computedStyle.color,
                    textShadow: computedStyle.textShadow,
                    fontSize: computedStyle.fontSize,
                    isVisible: rect.width > 0 && rect.height > 0,
                    backgroundColor: computedStyle.backgroundColor
                };
            });
        });
        
        console.log('\n📋 TEXT READABILITY ANALYSIS:');
        console.log('═══════════════════════════════════════');
        
        let improvedCount = 0;
        textAnalysis.forEach(analysis => {
            console.log(`\n${analysis.index}. "${analysis.text}"`);
            console.log(`   🎨 Color: ${analysis.color}`);
            console.log(`   ✨ Text Shadow: ${analysis.textShadow}`);
            console.log(`   📏 Font Size: ${analysis.fontSize}`);
            console.log(`   👁️  Visible: ${analysis.isVisible ? '✅' : '❌'}`);
            
            // Check if it has the improved dark color (rgb(45, 55, 72) = #2d3748)
            const hasImprovedColor = analysis.color.includes('45, 55, 72') || 
                                   analysis.color.includes('rgb(45, 55, 72)') ||
                                   analysis.color.includes('#2d3748');
            
            const hasTextShadow = analysis.textShadow !== 'none' && analysis.textShadow !== '';
            
            if (hasImprovedColor && hasTextShadow) {
                console.log(`   ✅ IMPROVED: Dark color + text shadow for readability`);
                improvedCount++;
            } else if (hasImprovedColor) {
                console.log(`   🟡 PARTIAL: Dark color but no text shadow`);
            } else {
                console.log(`   ❌ NEEDS WORK: Still using light color`);
            }
        });
        
        console.log('\n🎯 RESULTS:');
        console.log(`   📊 Total analyzed: ${textAnalysis.length}`);
        console.log(`   ✅ Fully improved: ${improvedCount}`);
        console.log(`   📈 Success rate: ${Math.round((improvedCount / textAnalysis.length) * 100)}%`);
        
        if (improvedCount === textAnalysis.length) {
            console.log('\n🎉 SUCCESS: All product descriptions now have improved readability!');
        } else if (improvedCount > 0) {
            console.log('\n🟡 PARTIAL SUCCESS: Some improvements detected, may need additional fixes');
        } else {
            console.log('\n❌ NO IMPROVEMENTS: Text readability fixes may not be applied');
        }
        
        console.log('\n🔍 Browser kept open for visual inspection...');
        console.log('Press Ctrl+C to close when done reviewing.');
        
        // Keep browser open for visual inspection
        await new Promise(resolve => {
            process.on('SIGINT', resolve);
        });
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\nThis could be due to:');
        console.log('1. Server not fully started');
        console.log('2. Category card workflow not working');
        console.log('3. Page structure changes');
    } finally {
        await browser.close();
    }
}

// Run the test
testTextReadabilityFix().catch(console.error);