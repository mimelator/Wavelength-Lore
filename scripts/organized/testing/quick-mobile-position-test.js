const puppeteer = require('puppeteer');

(async () => {
    console.log('📱 Quick iPhone XR Game Board Position Test');
    console.log('━'.repeat(60));
    
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: null
    });

    try {
        const page = await browser.newPage();
        
        // Set iPhone XR viewport
        await page.setViewport({
            width: 414,
            height: 896,
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true
        });

        console.log('📱 Setting iPhone XR viewport: 414x896');
        console.log('🔗 Testing Development: http://localhost:3001/games/wavelength-gems');
        
        await page.goto('http://localhost:3001/games/wavelength-gems', { 
            waitUntil: 'networkidle0',
            timeout: 15000 
        });

        // Wait for canvas to load
        await page.waitForSelector('#gemsCanvas', { timeout: 10000 });
        
        // Get canvas position and dimensions
        const canvasInfo = await page.evaluate(() => {
            const canvas = document.getElementById('gemsCanvas');
            if (!canvas) return null;
            
            const rect = canvas.getBoundingClientRect();
            return {
                width: rect.width,
                height: rect.height,
                top: rect.top,
                left: rect.left,
                canvasHeight: canvas.height,
                canvasWidth: canvas.width,
                windowHeight: window.innerHeight,
                windowWidth: window.innerWidth
            };
        });

        console.log('\n📊 CANVAS ANALYSIS:');
        console.log('━'.repeat(60));
        console.log(`📏 Canvas Dimensions: ${canvasInfo.width}x${canvasInfo.height}px`);
        console.log(`📍 Canvas Position: (${canvasInfo.left}, ${canvasInfo.top})`);
        console.log(`🖥️ Viewport: ${canvasInfo.windowWidth}x${canvasInfo.windowHeight}px`);
        console.log(`📐 Internal Canvas Size: ${canvasInfo.canvasWidth}x${canvasInfo.canvasHeight}px`);
        
        // Check if canvas fits in viewport
        const fitsInViewport = canvasInfo.top >= 0 && 
                             (canvasInfo.top + canvasInfo.height) <= canvasInfo.windowHeight;
        
        console.log(`✅ Canvas fits in viewport: ${fitsInViewport ? 'YES' : 'NO'}`);
        
        if (!fitsInViewport) {
            const overflowTop = canvasInfo.top < 0 ? Math.abs(canvasInfo.top) : 0;
            const overflowBottom = (canvasInfo.top + canvasInfo.height) - canvasInfo.windowHeight;
            console.log(`⚠️ Overflow top: ${overflowTop}px`);
            console.log(`⚠️ Overflow bottom: ${overflowBottom}px`);
        }

        // Keep browser open for inspection
        console.log('\nPress Ctrl+C when finished inspecting...');
        await new Promise(resolve => {
            process.on('SIGINT', resolve);
        });

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
})();