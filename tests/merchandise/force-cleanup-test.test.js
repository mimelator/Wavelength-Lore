const puppeteer = require('puppeteer');

describe('Force Cleanup Test', () => {
    let browser, page;

    beforeAll(async () => {
        browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: { width: 1200, height: 800 }
        });
        page = await browser.newPage();
        
        // Capture console messages
        page.on('console', msg => {
            if (msg.text().includes('cleanup') || msg.text().includes('broken')) {
                console.log('🔍 CLEANUP MESSAGE:', msg.text());
            }
        });
    }, 60000);

    afterAll(async () => {
        if (browser) await browser.close();
    });

    test('Force cleanup by triggering merchandise page multiple times', async () => {
        console.log('🔄 Loading merchandise page to trigger cleanup...');
        
        // Load merchandise page multiple times to trigger cleanup
        for (let i = 1; i <= 3; i++) {
            console.log(`🔄 Load attempt ${i}/3`);
            
            await page.goto('http://localhost:3001/merchandise', { 
                waitUntil: 'networkidle0',
                timeout: 30000 
            });
            
            // Wait for any cleanup operations
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Check if cleanup function exists and call it manually
            const cleanupResult = await page.evaluate(() => {
                if (typeof window.cleanupBrokenProducts === 'function') {
                    console.log('🧹 Manually triggering cleanup...');
                    return window.cleanupBrokenProducts();
                }
                return 'No cleanup function found';
            });
            
            console.log(`🧹 Cleanup result ${i}:`, cleanupResult);
        }
        
        console.log('✅ Cleanup attempts completed');
        
        // Final check for any remaining messages
        const finalPageText = await page.evaluate(() => document.body.textContent);
        const hasCleanupMessages = finalPageText.toLowerCase().includes('broken products') ||
                                  finalPageText.toLowerCase().includes('cleanup');
        
        if (hasCleanupMessages) {
            console.log('⚠️  Still seeing cleanup messages after forced cleanup');
        } else {
            console.log('✅ No cleanup messages detected after cleanup');
        }
        
    }, 120000);
});