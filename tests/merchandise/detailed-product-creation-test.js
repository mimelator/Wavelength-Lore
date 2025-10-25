/**
 * Detailed Product Creation Test
 * Captures console logs and network requests during product creation
 */

const puppeteer = require('puppeteer');

async function testDetailedProductCreation() {
    console.log('🔬 Detailed Product Creation Test');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Capture console logs
    const consoleLogs = [];
    page.on('console', msg => {
        const logEntry = `${msg.type()}: ${msg.text()}`;
        consoleLogs.push(logEntry);
        console.log(`🖥️  ${logEntry}`);
    });
    
    // Capture network requests
    const networkRequests = [];
    page.on('request', request => {
        if (request.url().includes('/api/merchandise/')) {
            networkRequests.push({
                url: request.url(),
                method: request.method(),
                postData: request.postData()
            });
            console.log(`🌐 REQUEST: ${request.method()} ${request.url()}`);
        }
    });
    
    page.on('response', response => {
        if (response.url().includes('/api/merchandise/')) {
            console.log(`📡 RESPONSE: ${response.status()} ${response.url()}`);
        }
    });
    
    try {
        await page.goto('http://localhost:3001/merchandise', { 
            waitUntil: 'networkidle0',
            timeout: 15000 
        });
        
        await page.waitForSelector('body', { timeout: 5000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('🎯 Step 1: Select first image');
        const firstImageButton = await page.$('.gallery-image-select');
        await firstImageButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('🎯 Step 2: Navigate to products');
        // Navigate through ProductNavigator
        const firstCategory = await page.$('.category-card');
        await firstCategory.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const firstSubcategory = await page.$('.subcategory-card');
        await firstSubcategory.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('🎯 Step 3: Select first product');
        const firstProduct = await page.$('.select-product-btn');
        await firstProduct.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('🎯 Step 4: Verify modal and click create');
        const modal = await page.$('.product-customization-modal');
        if (!modal) {
            console.log('❌ Modal not found');
            return false;
        }
        
        const createButton = await page.$('#createProductBtn');
        if (!createButton) {
            console.log('❌ Create button not found');
            return false;
        }
        
        console.log('🚀 Clicking create button and monitoring...');
        await createButton.click();
        
        // Monitor for 15 seconds
        for (let i = 0; i < 15; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check loading modal
            const loadingModal = await page.$('#loading-modal[style*="block"]');
            if (loadingModal && i === 0) {
                console.log('⏳ Loading modal appeared');
            }
            
            // Check for success/error states
            const successToast = await page.$('.toast-success');
            const errorToast = await page.$('.toast-error');
            const modalClosed = !(await page.$('.product-customization-modal[style*="block"]'));
            
            if (successToast || errorToast || modalClosed) {
                console.log(`📊 Status after ${i + 1}s:`);
                console.log(`  Success: ${!!successToast}`);
                console.log(`  Error: ${!!errorToast}`);
                console.log(`  Modal closed: ${modalClosed}`);
                break;
            }
        }
        
        console.log('\n📋 Summary:');
        console.log(`🖥️  Console logs: ${consoleLogs.length}`);
        console.log(`🌐 Network requests: ${networkRequests.length}`);
        
        if (networkRequests.length > 0) {
            console.log('\n🌐 API Requests made:');
            networkRequests.forEach(req => {
                console.log(`  ${req.method} ${req.url}`);
                if (req.postData) {
                    console.log(`    Data: ${req.postData.substring(0, 200)}...`);
                }
            });
        }
        
        return true;
        
    } catch (error) {
        console.log(`❌ Test Error: ${error.message}`);
        return false;
    } finally {
        await browser.close();
    }
}

testDetailedProductCreation();