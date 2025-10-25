/**
 * Simple Product Creation Test
 * Tests basic product creation functionality without complex UI interactions
 */

const puppeteer = require('puppeteer');

async function runSimpleProductCreationTest() {
  let browser;
  
  try {
    console.log('🚀 Starting Simple Product Creation Test...\n');
    
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1200, height: 800 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Enable console logging from browser
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        console.log(`❌ Browser Error: ${text}`);
      } else if (text.includes('🛍️') || text.includes('📱') || text.includes('✅') || text.includes('❌')) {
        console.log(`📱 Browser: ${text}`);
      }
    });
    
    console.log('📍 TEST: Navigate to merchandise store');
    await page.goto('http://localhost:3001/merchandise', { waitUntil: 'networkidle0' });
    
    // Wait for store to initialize
    await page.waitForSelector('.merchandise-store', { timeout: 10000 });
    console.log('✅ Merchandise store loaded');
    
    console.log('\n🖼️ TEST: Check for gallery images');
    const imageCount = await page.evaluate(() => {
      const images = document.querySelectorAll('.gallery-image-card');
      return images.length;
    });
    
    if (imageCount === 0) {
      console.log('⚠️ No gallery images found - creating test product via API');
      
      // Create a test product directly via API
      const testProduct = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/merchandise/create-product', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer dev-bypass'
            },
            body: JSON.stringify({
              imageId: 'test-image-123',
              imageUrl: 'http://localhost:3001/test-image.jpg',
              imageTitle: 'Test Image for Product Creation',
              productType: 'premium-tshirt',
              productOptions: {
                borderStyle: 'solid-medium',
                defaultSize: 'M',
                defaultColor: 'Black'
              }
            })
          });
          
          const data = await response.json();
          return { success: response.ok, data };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });
      
      if (testProduct.success) {
        console.log('✅ Test product created via API');
        console.log('   → Product ID:', testProduct.data.product?.id);
        console.log('   → Product Title:', testProduct.data.product?.title);
        
        // Refresh the page to see the new product
        await page.reload({ waitUntil: 'networkidle0' });
        await page.waitForSelector('.merchandise-store', { timeout: 5000 });
        
        // Check if product appears in UI
        const productCount = await page.evaluate(() => {
          const products = document.querySelectorAll('.product-card');
          return products.length;
        });
        
        console.log(`📦 Products in UI: ${productCount}`);
        
        if (productCount > 0) {
          console.log('✅ Product appears in UI after creation');
          
          // Test product deletion
          console.log('\n🗑️ TEST: Delete the test product');
          
          const deleteResult = await page.evaluate(() => {
            const deleteBtn = document.querySelector('.delete-product-btn');
            if (deleteBtn) {
              deleteBtn.click();
              return true;
            }
            return false;
          });
          
          if (deleteResult) {
            // Wait for confirmation dialog and confirm
            await page.waitForTimeout(500);
            
            // Handle the confirm dialog
            page.on('dialog', async dialog => {
              console.log('   → Confirming deletion...');
              await dialog.accept();
            });
            
            // Wait for deletion to complete
            await page.waitForTimeout(2000);
            
            const finalProductCount = await page.evaluate(() => {
              const products = document.querySelectorAll('.product-card');
              return products.length;
            });
            
            if (finalProductCount === 0) {
              console.log('✅ Product deleted successfully');
            } else {
              console.log('❌ Product deletion failed - still visible in UI');
            }
          } else {
            console.log('❌ Delete button not found');
          }
        } else {
          console.log('❌ Product not visible in UI after creation');
        }
        
      } else {
        console.log('❌ Failed to create test product via API');
        console.log('   → Error:', testProduct.error || testProduct.data?.error);
      }
      
    } else {
      console.log(`✅ Found ${imageCount} gallery images`);
      
      // Test with existing gallery images
      console.log('\n🖼️ TEST: Select first gallery image');
      
      await page.click('.gallery-image-select');
      console.log('✅ Image selected');
      
      // Wait for product navigator to appear
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if simple categories appeared (fallback)
      const hasSimpleCategories = await page.evaluate(() => {
        return document.querySelector('.simple-categories') !== null;
      });
      
      if (hasSimpleCategories) {
        console.log('✅ Simple categories fallback loaded');
        
        // Click on first simple category
        console.log('\n👕 TEST: Select premium t-shirt');
        await page.click('.select-simple-product[data-product="premium-tshirt"]');
        
        // Wait for customization modal
        await page.waitForSelector('.product-customization-modal', { timeout: 5000 });
        console.log('✅ Customization modal opened');
        
        // Click create product button
        await page.click('#createProductBtn');
        console.log('✅ Product creation initiated');
        
        // Wait for creation to complete
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check if product was created
        const productCount = await page.evaluate(() => {
          const products = document.querySelectorAll('.product-card');
          return products.length;
        });
        
        console.log(`📦 Products after creation: ${productCount}`);
        
        if (productCount > 0) {
          console.log('✅ Product created successfully via UI');
        } else {
          console.log('❌ Product creation via UI failed');
        }
        
      } else {
        console.log('❌ Neither ProductNavigator nor simple categories loaded');
      }
    }
    
    console.log('\n================================================================================');
    console.log('📊 SIMPLE PRODUCT CREATION TEST COMPLETE');
    console.log('================================================================================\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  runSimpleProductCreationTest();
}

module.exports = runSimpleProductCreationTest;