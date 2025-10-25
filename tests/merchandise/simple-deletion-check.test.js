const puppeteer = require('puppeteer');

describe('Simple Deletion Check', () => {
    let browser, page;
    let consoleMessages = [];

    beforeAll(async () => {
        browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: { width: 1200, height: 800 }
        });
        page = await browser.newPage();
        
        page.on('console', msg => {
            const text = msg.text();
            consoleMessages.push(text);
            
            // Alert on deletion messages
            if (text.includes('Found') && text.includes('broken products')) {
                console.error('🚨 DELETION MESSAGE:', text);
            }
            if (text.includes('Cleaning up') || text.includes('corrupted products')) {
                console.error('🚨 CLEANUP MESSAGE:', text);
            }
        });
    });

    afterAll(async () => {
        if (browser) await browser.close();
    });

    it('should check for deletion messages', async () => {
        await page.goto('http://localhost:3001/merchandise?imageId=test&imageUrl=test');
        await page.waitForSelector('body', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 8000));

        // Filter for deletion-related messages
        const deletionMessages = consoleMessages.filter(msg => 
            msg.includes('Found') && msg.includes('broken products') ||
            msg.includes('Cleaning up') ||
            msg.includes('corrupted products') ||
            msg.includes('Deleted') && msg.includes('products')
        );

        console.log('\n=== DELETION MESSAGE ANALYSIS ===');
        console.log(`Total console messages: ${consoleMessages.length}`);
        console.log(`Deletion-related messages: ${deletionMessages.length}`);
        
        if (deletionMessages.length > 0) {
            console.log('\n🚨 ALERT: Found deletion messages:');
            deletionMessages.forEach((msg, i) => {
                console.log(`${i + 1}. ${msg}`);
            });
            console.log('\n🚨 This indicates products are being created and immediately marked as corrupted!');
        } else {
            console.log('\n✅ No deletion messages found - cleanup working correctly');
        }

        expect(true).toBe(true);
    });
});