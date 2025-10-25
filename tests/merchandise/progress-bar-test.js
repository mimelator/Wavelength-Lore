/**
 * Progress Bar Test for Product Creation
 * 
 * Tests the progress bar during product creation flow
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testProgressBar() {
  console.log('🎯 Testing Progress Bar During Product Creation\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    slowMo: 50
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Monitor progress bar updates
  const progressUpdates = [];
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('🎨') || text.includes('📸') || text.includes('🎽') || text.includes('✨')) {
      console.log(`📱 Progress: ${text}`);
    }
  });
  
  try {
    // Navigate and setup
    await page.goto(`${BASE_URL}/merchandise`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.gallery-image-card');
    
    // Select first image
    const selectButton = await page.waitForSelector('.gallery-image-select');
    await selectButton.click();
    await wait(500);
    
    // Click first product type
    await page.waitForSelector('#choose-product-section');
    const productButton = await page.waitForSelector('.select-product-type-btn');
    await productButton.click();
    
    // Wait for modal
    await page.waitForSelector('.product-customization-modal');
    await wait(500);
    
    // Monitor progress bar visibility and updates
    const progressMonitor = setInterval(async () => {
      try {
        const progressInfo = await page.evaluate(() => {
          const modal = document.querySelector('#loading-modal');
          const message = document.querySelector('#loading-message');
          const progressFill = document.querySelector('#loading-progress-fill');
          const progressText = document.querySelector('#loading-progress-text');
          
          return {
            modalVisible: modal && modal.style.display !== 'none',
            message: message ? message.textContent : null,
            progressWidth: progressFill ? progressFill.style.width : null,
            progressText: progressText ? progressText.textContent : null
          };
        });
        
        if (progressInfo.modalVisible) {
          console.log(`📊 Progress: ${progressInfo.progressText} - ${progressInfo.message}`);
          progressUpdates.push(progressInfo);
        }
      } catch (e) {
        // Ignore errors during monitoring
      }
    }, 200);
    
    // Click Design Product button
    const designButton = await page.waitForSelector('#createProductBtn');
    console.log('🚀 Clicking Design Product button...');
    await designButton.click();
    
    // Wait for process to complete
    await wait(5000);
    clearInterval(progressMonitor);
    
    // Check if progress bar appeared and updated
    console.log('\n📈 Progress Bar Analysis:');
    console.log(`   Total updates captured: ${progressUpdates.length}`);
    
    if (progressUpdates.length > 0) {
      console.log('   Progress stages:');
      progressUpdates.forEach((update, i) => {
        console.log(`     ${i + 1}. ${update.progressText} - ${update.message}`);
      });
      console.log('✅ Progress bar working correctly!');
    } else {
      console.log('❌ No progress bar updates captured');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testProgressBar().catch(console.error);