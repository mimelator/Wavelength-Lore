const puppeteer = require('puppeteer');

async function validateTextReadabilityFixes() {
    console.log('🌊 WAVELENGTH: Validating text readability fixes...');
    
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
        
        // Wait for page load
        await page.waitForFunction(() => document.readyState === 'complete');
        
        console.log('🔍 Checking for problematic gray text...');
        
        // Check for any remaining problematic text
        const problematicTextCheck = await page.evaluate(() => {
            const results = [];
            
            // Get all elements that might contain text
            const allElements = document.querySelectorAll('*');
            
            allElements.forEach(el => {
                if (el.textContent && el.textContent.trim().length > 5) {
                    const computedStyle = window.getComputedStyle(el);
                    const color = computedStyle.color;
                    
                    // Check for the problematic light gray color
                    const isProblematicGray = 
                        color.includes('113, 128, 150') || 
                        color.includes('rgb(113, 128, 150)') ||
                        color.includes('#718096');
                    
                    if (isProblematicGray) {
                        results.push({
                            text: el.textContent.trim().substring(0, 80) + '...',
                            className: el.className,
                            tagName: el.tagName,
                            color: color,
                            textShadow: computedStyle.textShadow
                        });
                    }
                }
            });
            
            return results;
        });
        
        console.log('\n📋 PROBLEMATIC GRAY TEXT ANALYSIS:');
        console.log('═══════════════════════════════════════');
        
        if (problematicTextCheck.length === 0) {
            console.log('✅ SUCCESS: No problematic gray text found!');
        } else {
            console.log(`❌ Found ${problematicTextCheck.length} elements with problematic gray text:`);
            problematicTextCheck.forEach((item, index) => {
                console.log(`\n${index + 1}. "${item.text}"`);
                console.log(`   Tag: <${item.tagName.toLowerCase()}> class="${item.className}"`);
                console.log(`   Color: ${item.color}`);
                console.log(`   Text Shadow: ${item.textShadow}`);
            });
        }
        
        // Now check for good contrast text
        console.log('\n🔍 Checking for properly styled text...');
        
        const goodTextCheck = await page.evaluate(() => {
            const results = [];
            const targetSelectors = [
                '.product-description',
                '.category-description', 
                '.category-title-section p'
            ];
            
            targetSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    if (el.textContent && el.textContent.trim().length > 5) {
                        const computedStyle = window.getComputedStyle(el);
                        const color = computedStyle.color;
                        
                        const hasGoodColor = 
                            color.includes('45, 55, 72') || 
                            color.includes('rgb(45, 55, 72)') ||
                            color.includes('#2d3748');
                        
                        const hasTextShadow = computedStyle.textShadow !== 'none';
                        
                        results.push({
                            selector: selector,
                            text: el.textContent.trim().substring(0, 60) + '...',
                            color: color,
                            textShadow: computedStyle.textShadow,
                            hasGoodColor: hasGoodColor,
                            hasTextShadow: hasTextShadow,
                            isGood: hasGoodColor && hasTextShadow
                        });
                    }
                });
            });
            
            return results;
        });
        
        console.log('\n📋 PROPERLY STYLED TEXT CHECK:');
        console.log('═══════════════════════════════════════');
        
        let goodCount = 0;
        let totalCount = goodTextCheck.length;
        
        goodTextCheck.forEach((item, index) => {
            console.log(`\n${index + 1}. [${item.selector}] "${item.text}"`);
            console.log(`   Color: ${item.color} ${item.hasGoodColor ? '✅' : '❌'}`);
            console.log(`   Text Shadow: ${item.textShadow} ${item.hasTextShadow ? '✅' : '❌'}`);
            console.log(`   Overall: ${item.isGood ? '✅ GOOD' : '❌ NEEDS WORK'}`);
            
            if (item.isGood) goodCount++;
        });
        
        console.log('\n🎯 FINAL RESULTS:');
        console.log('═══════════════════════════════════════');
        console.log(`📊 Total description elements: ${totalCount}`);
        console.log(`✅ Properly styled: ${goodCount}`);
        console.log(`❌ Still need work: ${totalCount - goodCount}`);
        console.log(`📈 Success rate: ${totalCount > 0 ? Math.round((goodCount / totalCount) * 100) : 0}%`);
        
        if (totalCount === goodCount && problematicTextCheck.length === 0) {
            console.log('\n🎉 SUCCESS: All text readability issues have been fixed!');
        } else {
            console.log('\n🔧 Some issues may remain - check the browser for visual confirmation');
        }
        
        console.log('\n🔍 Browser open for visual inspection. Press Ctrl+C to close.');
        
        // Keep browser open
        await new Promise(resolve => {
            process.on('SIGINT', resolve);
        });
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the validation
validateTextReadabilityFixes().catch(console.error);