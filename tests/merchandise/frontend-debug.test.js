const puppeteer = require('puppeteer');

describe('Frontend Debug Test', () => {
    let browser, page;

    beforeAll(async () => {
        browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: { width: 1200, height: 800 }
        });
        page = await browser.newPage();
        
        // Monitor console messages
        page.on('console', msg => {
            console.log(`[${msg.type().toUpperCase()}]`, msg.text());
        });
        
        // Monitor network requests
        page.on('response', response => {
            if (response.url().includes('product-catalog') || response.url().includes('product-navigator')) {
                console.log(`📡 Network: ${response.status()} ${response.url()}`);
            }
        });
    });

    afterAll(async () => {
        if (browser) await browser.close();
    });

    it('should debug merchandise store initialization', async () => {
        console.log('🔍 Navigating to merchandise store...');
        await page.goto('http://localhost:3001/merchandise?imageId=test&imageUrl=test');
        await page.waitForSelector('body', { timeout: 10000 });

        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Check what's available in the global scope
        const globalCheck = await page.evaluate(() => {
            return {
                merchandiseStoreExists: typeof MerchandiseStore !== 'undefined',
                productNavigatorExists: typeof ProductNavigator !== 'undefined',
                merchandiseStoreInstance: !!window.merchandiseStore,
                productNavigatorInstance: !!window.merchandiseStore?.productNavigator,
                containerExists: !!document.getElementById('merchandise-store'),
                navigatorContainerExists: !!document.getElementById('product-navigator'),
                selectedImage: window.merchandiseStore?.selectedImage || null,
                productTypes: window.merchandiseStore?.productTypes ? Object.keys(window.merchandiseStore.productTypes) : null
            };
        });

        console.log('🔍 Global Check:', globalCheck);

        // Check DOM elements
        const domCheck = await page.evaluate(() => {
            const navigator = document.querySelector('.product-navigator');
            const categories = document.querySelectorAll('.category-card');
            const chooseSection = document.getElementById('choose-product-section');
            
            return {
                navigatorElement: !!navigator,
                navigatorVisible: navigator ? navigator.offsetParent !== null : false,
                navigatorHTML: navigator ? navigator.innerHTML.substring(0, 200) : null,
                categoryCount: categories.length,
                chooseSectionExists: !!chooseSection,
                chooseSectionVisible: chooseSection ? chooseSection.offsetParent !== null : false
            };
        });

        console.log('🔍 DOM Check:', domCheck);

        // Try to manually trigger initialization
        const manualInit = await page.evaluate(() => {
            if (window.merchandiseStore && !window.merchandiseStore.selectedImage) {
                console.log('🔧 Manually selecting image...');
                window.merchandiseStore.selectedImage = 'test-image';
                window.merchandiseStore.render();
                
                setTimeout(() => {
                    if (window.merchandiseStore.initializeProductNavigator) {
                        console.log('🔧 Manually initializing product navigator...');
                        window.merchandiseStore.initializeProductNavigator();
                    }
                }, 500);
                
                return 'Manual initialization triggered';
            }
            return 'No manual initialization needed';
        });

        console.log('🔧 Manual Init:', manualInit);

        // Wait and check again
        await new Promise(resolve => setTimeout(resolve, 3000));

        const finalCheck = await page.evaluate(() => {
            const categories = document.querySelectorAll('.category-card');
            const navigator = document.querySelector('.product-navigator');
            
            return {
                categoryCount: categories.length,
                navigatorExists: !!navigator,
                navigatorContent: navigator ? navigator.innerHTML.substring(0, 300) : null,
                selectedImage: window.merchandiseStore?.selectedImage,
                productNavigatorInstance: !!window.merchandiseStore?.productNavigator
            };
        });

        console.log('🔍 Final Check:', finalCheck);

        expect(globalCheck.merchandiseStoreExists).toBe(true);
        expect(globalCheck.productNavigatorExists).toBe(true);
    });
});