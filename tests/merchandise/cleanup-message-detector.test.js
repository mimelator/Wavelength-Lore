const puppeteer = require('puppeteer');

describe('Cleanup Message Detection', () => {
    let browser, page;

    beforeAll(async () => {
        browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: { width: 1200, height: 800 }
        });
        page = await browser.newPage();
        
        // Capture console messages
        page.on('console', msg => {
            console.log('BROWSER CONSOLE:', msg.text());
        });
    }, 60000);

    afterAll(async () => {
        if (browser) await browser.close();
    });

    test('Check for cleanup messages on merchandise page', async () => {
        console.log('🔍 Loading merchandise page...');
        
        await page.goto('http://localhost:3001/merchandise');
        await page.waitForSelector('body', { timeout: 10000 });
        
        // Wait for any cleanup to occur
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check for cleanup messages in page content
        const pageText = await page.evaluate(() => document.body.textContent);
        
        const cleanupKeywords = [
            'broken products',
            'cleanup',
            'removing',
            'corrupted',
            'Found 5 broken',
            'products to clean'
        ];
        
        const foundMessages = cleanupKeywords.filter(keyword => 
            pageText.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (foundMessages.length > 0) {
            console.log('🚨 CLEANUP MESSAGES DETECTED:');
            foundMessages.forEach(msg => console.log(`   - "${msg}"`));
            
            // Get more context around the messages
            const alerts = await page.$$eval('.alert, .message, .notification', 
                elements => elements.map(el => el.textContent.trim())
            );
            
            if (alerts.length > 0) {
                console.log('📢 Alert elements found:');
                alerts.forEach(alert => console.log(`   - ${alert}`));
            }
        } else {
            console.log('✅ No cleanup messages detected');
        }
        
        // Check for specific cleanup function calls
        const hasCleanupFunction = await page.evaluate(() => {
            return typeof window.cleanupBrokenProducts === 'function';
        });
        
        console.log('🔧 Cleanup function exists:', hasCleanupFunction);
        
        expect(foundMessages.length).toBe(0);
        
    }, 30000);
});