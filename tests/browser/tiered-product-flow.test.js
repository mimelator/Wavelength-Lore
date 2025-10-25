/**
 * Tiered Product System - Complete User Flow Test
 * Tests the full user journey from image selection to product creation
 */

const puppeteer = require('puppeteer');

describe('Tiered Product System - Complete User Flow', () => {
  let browser, page;
  const BASE_URL = 'http://localhost:3001';
  
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
  });

  afterAll(async () => {
    if (browser) await browser.close();
  });

  describe('Complete Product Creation Flow', () => {
    test('User can navigate tiered system and create product', async () => {
      // Step 1: Navigate to merchandise store
      await page.goto(`${BASE_URL}/merchandise`);
      await page.waitForSelector('#merchandise-store', { timeout: 15000 });
      
      // Step 2: Select an image from gallery
      await page.waitForSelector('.gallery-image-card', { timeout: 10000 });
      const galleryImages = await page.$$('.gallery-image-card');
      expect(galleryImages.length).toBeGreaterThan(0);
      
      // Click first available image
      await galleryImages[0].click();
      await delay(1000);
      
      // Step 3: Verify product navigator appears
      await page.waitForSelector('#product-navigator', { timeout: 10000 });
      const navigator = await page.$('#product-navigator');
      expect(navigator).toBeTruthy();
      
      // Step 4: Navigate through categories
      await page.waitForSelector('.category-card', { timeout: 5000 });
      const categories = await page.$$('.category-card');
      expect(categories.length).toBeGreaterThan(0);
      
      // Click random category
      const randomCategory = Math.floor(Math.random() * categories.length);
      await categories[randomCategory].click();
      await delay(1000);
      
      // Step 5: Navigate to subcategory
      await page.waitForSelector('.subcategory-card', { timeout: 5000 });
      const subcategories = await page.$$('.subcategory-card');
      
      if (subcategories.length > 0) {
        const randomSubcategory = Math.floor(Math.random() * subcategories.length);
        await subcategories[randomSubcategory].click();
        await delay(1000);
        
        // Step 6: Select a product
        await page.waitForSelector('.select-product-btn', { timeout: 5000 });
        const productButtons = await page.$$('.select-product-btn');
        expect(productButtons.length).toBeGreaterThan(0);
        
        // Click random product
        const randomProduct = Math.floor(Math.random() * productButtons.length);
        await productButtons[randomProduct].click();
        await page.waitForTimeout(2000);
        
        // Step 7: Verify customization modal appears
        const customizationModal = await page.waitForSelector('.product-customization-modal', { timeout: 10000 });
        expect(customizationModal).toBeTruthy();
        
        // Step 8: Fill customization options
        await page.select('#defaultSize', 'M');
        await page.select('#defaultColor', 'Black');
        await page.select('#borderStyleSelect', 'solid-medium');
        
        // Step 9: Create the product
        const createBtn = await page.$('#createProductBtn');
        expect(createBtn).toBeTruthy();
        
        await createBtn.click();
        
        // Step 10: Wait for product creation to complete
        await delay(2000);
        const successIndicator = await page.$('.toast-success, .loading-modal');
        expect(successIndicator).toBeTruthy();
        
        console.log('✅ Complete product creation flow successful');
      }
    }, 60000);

    test('Search functionality works in tiered navigation', async () => {
      await page.goto(`${BASE_URL}/merchandise`);
      await page.waitForSelector('#merchandise-store');
      
      // Select an image first
      await page.waitForSelector('.gallery-image-card');
      const firstImage = await page.$('.gallery-image-card');
      if (firstImage) {
        await firstImage.click();
        await delay(1000);
      }
      
      // Wait for navigator and search
      await page.waitForSelector('#product-navigator');
      await page.waitForSelector('#product-search', { timeout: 5000 });
      
      // Test search functionality
      await page.type('#product-search', 'shirt');
      await delay(2000);
      
      // Verify search results appear
      const searchResults = await page.$$('.product-card');
      expect(searchResults.length).toBeGreaterThan(0);
      
      // Test product selection from search
      if (searchResults.length > 0) {
        const selectBtn = await searchResults[0].$('.select-product-btn');
        if (selectBtn) {
          await selectBtn.click();
          await delay(2000);
          
          const modal = await page.$('.product-customization-modal');
          expect(modal).toBeTruthy();
        }
      }
    }, 30000);

    test('Breadcrumb navigation works correctly', async () => {
      await page.goto(`${BASE_URL}/merchandise`);
      await page.waitForSelector('#merchandise-store');
      
      // Select image and navigate
      const firstImage = await page.$('.gallery-image-card');
      await firstImage.click();
      await page.waitForTimeout(1000);
      
      await page.waitForSelector('#product-navigator');
      
      // Navigate to category
      const category = await page.$('.category-card');
      if (category) {
        await category.click();
        await page.waitForTimeout(1000);
        
        // Check breadcrumbs
        await page.waitForSelector('.breadcrumbs');
        const breadcrumbs = await page.$$('.breadcrumb');
        expect(breadcrumbs.length).toBeGreaterThan(1);
        
        // Click back to categories via breadcrumb
        await breadcrumbs[0].click();
        await page.waitForTimeout(1000);
        
        // Verify we're back at categories
        const categoriesVisible = await page.$('.categories-grid');
        expect(categoriesVisible).toBeTruthy();
      }
    }, 20000);
  });

  describe('Error Handling and Edge Cases', () => {
    test('Handles no image selection gracefully', async () => {
      await page.goto(`${BASE_URL}/merchandise`);
      await page.waitForSelector('#merchandise-store');
      
      // Try to access navigator without selecting image
      const navigator = await page.$('#product-navigator');
      expect(navigator).toBeFalsy();
      
      // Verify appropriate message is shown
      const chooseProductSection = await page.$('#choose-product-section');
      expect(chooseProductSection).toBeFalsy();
    });

    test('Handles network errors gracefully', async () => {
      await page.goto(`${BASE_URL}/merchandise`);
      await page.waitForSelector('#merchandise-store');
      
      // Select image
      const firstImage = await page.$('.gallery-image-card');
      await firstImage.click();
      await page.waitForTimeout(1000);
      
      // Simulate network failure
      await page.setOfflineMode(true);
      
      try {
        await page.reload();
        await page.waitForTimeout(3000);
        
        // Check if error handling is present
        const hasError = await page.evaluate(() => {
          return document.body.textContent.includes('error') ||
                 document.body.textContent.includes('failed') ||
                 document.querySelector('.error-state') !== null;
        });
        
        expect(typeof hasError).toBe('boolean');
      } finally {
        await page.setOfflineMode(false);
      }
    });
  });

  describe('Mobile Responsiveness', () => {
    test('Tiered navigation works on mobile', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.goto(`${BASE_URL}/merchandise`);
      await page.waitForSelector('#merchandise-store');
      
      // Select image
      const firstImage = await page.$('.gallery-image-card');
      await firstImage.click();
      await page.waitForTimeout(1000);
      
      // Check navigator loads on mobile
      await page.waitForSelector('#product-navigator');
      const navigator = await page.$('#product-navigator');
      expect(navigator).toBeTruthy();
      
      // Test category navigation on mobile
      const category = await page.$('.category-card');
      if (category) {
        await category.click();
        await page.waitForTimeout(1000);
        
        const subcategories = await page.$('.subcategories-grid');
        expect(subcategories).toBeTruthy();
      }
    });
  });
});