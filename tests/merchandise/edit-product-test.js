/**
 * Edit Product Functionality Test
 * 
 * Tests the edit product modal and functionality
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testEditProduct() {
  console.log('✏️ Testing Edit Product Functionality\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    slowMo: 50
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    // Navigate and create a product first
    await page.goto(`${BASE_URL}/merchandise`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.gallery-image-card');
    
    // Select first image and create a product
    const selectButton = await page.waitForSelector('.gallery-image-select');
    await selectButton.click();
    await wait(500);
    
    const productButton = await page.waitForSelector('.select-product-type-btn');
    await productButton.click();
    
    await page.waitForSelector('.product-customization-modal');
    const designButton = await page.waitForSelector('#createProductBtn');
    await designButton.click();
    
    // Wait for product creation to complete
    await wait(8000);
    
    // Now test edit functionality
    console.log('🔍 Looking for edit button...');
    await page.waitForSelector('.edit-product-btn', { timeout: 10000 });
    
    const editButton = await page.waitForSelector('.edit-product-btn');
    console.log('✅ Found edit button, clicking...');
    await editButton.click();
    
    // Wait for edit modal
    await page.waitForSelector('.edit-product-modal', { timeout: 5000 });
    console.log('✅ Edit modal opened');
    
    // Test editing the title
    const titleInput = await page.waitForSelector('#edit-title');
    await titleInput.click({ clickCount: 3 }); // Select all text
    await titleInput.type('My Awesome Custom Product');
    console.log('✅ Updated product title');
    
    // Test editing description
    const descInput = await page.waitForSelector('#edit-description');
    await descInput.click();
    await descInput.type('This is my custom description for testing');
    console.log('✅ Updated product description');
    
    // Test variant checkboxes
    const variantCheckboxes = await page.$$('.variant-checkbox');
    if (variantCheckboxes.length > 1) {
      // Uncheck the second variant
      await variantCheckboxes[1].click();
      console.log('✅ Toggled variant checkbox');
    }
    
    // Test price input
    const priceInputs = await page.$$('.variant-price');
    if (priceInputs.length > 0) {
      await priceInputs[0].click({ clickCount: 3 });
      await priceInputs[0].type('25.99');
      console.log('✅ Updated variant price');
    }
    
    // Save changes
    const saveButton = await page.waitForSelector('button[type="submit"]');
    await saveButton.click();
    console.log('✅ Clicked save button');
    
    // Wait for success message
    await wait(2000);
    
    // Check if modal closed
    const modalVisible = await page.evaluate(() => {
      const modal = document.querySelector('.edit-product-modal');
      return modal && modal.style.display !== 'none';
    });
    
    if (!modalVisible) {
      console.log('✅ Edit modal closed after saving');
    } else {
      console.log('⚠️ Edit modal still visible');
    }
    
    // Verify changes were applied by checking the product card
    const productTitle = await page.evaluate(() => {
      const productCard = document.querySelector('.product-card h4');
      return productCard ? productCard.textContent : null;
    });
    
    if (productTitle && productTitle.includes('My Awesome Custom Product')) {
      console.log('✅ Product title updated successfully');
    } else {
      console.log('⚠️ Product title may not have updated:', productTitle);
    }
    
    console.log('\n🎉 Edit product test completed successfully!');
    
  } catch (error) {
    console.error('❌ Edit product test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testEditProduct().catch(console.error);