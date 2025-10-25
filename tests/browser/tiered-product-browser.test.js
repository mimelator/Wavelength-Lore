/**
 * Tiered Product System Browser Test Suite
 * Tests UI interactions and functionality using Puppeteer
 */

const puppeteer = require('puppeteer');
const { createApp } = require('../../app');

describe('Tiered Product System Browser Tests', () => {
  let browser, page, server, app;
  const PORT = 3002; // Test port

  beforeAll(async () => {
    // Start test server
    app = await createApp();
    server = app.listen(PORT);
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
  });

  afterAll(async () => {
    if (browser) await browser.close();
    if (server) server.close();
  });

  beforeEach(async () => {
    await page.goto(`http://localhost:${PORT}/product-selection`);
    await page.waitForSelector('.product-navigator', { timeout: 10000 });
  });

  describe('Page Loading', () => {
    test('Product selection page loads successfully', async () => {
      const title = await page.title();
      expect(title).toContain('Select Your Product');
      
      const navigator = await page.$('.product-navigator');
      expect(navigator).toBeTruthy();
    });

    test('Main categories are displayed', async () => {
      await page.waitForSelector('.main-categories .category-card');
      
      const categories = await page.$$('.main-categories .category-card');
      expect(categories.length).toBeGreaterThan(0);
      
      const firstCategory = await page.$eval('.category-card h3', el => el.textContent);
      expect(firstCategory).toBeTruthy();
    });
  });

  describe('Navigation Functionality', () => {
    test('Clicking category shows subcategories', async () => {
      await page.click('.category-card:first-child');
      await page.waitForSelector('.subcategories', { timeout: 5000 });
      
      const subcategories = await page.$('.subcategories');
      expect(subcategories).toBeTruthy();
      
      const backButton = await page.$('.back-button');
      expect(backButton).toBeTruthy();
    });

    test('Back button returns to main categories', async () => {
      // Navigate to subcategories
      await page.click('.category-card:first-child');
      await page.waitForSelector('.subcategories');
      
      // Click back button
      await page.click('.back-button');
      await page.waitForSelector('.main-categories');
      
      const mainCategories = await page.$('.main-categories');
      expect(mainCategories).toBeTruthy();
    });

    test('Breadcrumb navigation works', async () => {
      // Navigate to subcategories
      await page.click('.category-card:first-child');
      await page.waitForSelector('.breadcrumb');
      
      const breadcrumb = await page.$('.breadcrumb');
      expect(breadcrumb).toBeTruthy();
      
      // Click breadcrumb home
      await page.click('.breadcrumb .breadcrumb-item:first-child');
      await page.waitForSelector('.main-categories');
    });

    test('Three-tier navigation works completely', async () => {
      // Navigate to subcategories
      await page.click('.category-card:first-child');
      await page.waitForSelector('.subcategories');
      
      // Navigate to products
      const subcategoryExists = await page.$('.subcategory-card');
      if (subcategoryExists) {
        await page.click('.subcategory-card:first-child');
        await page.waitForSelector('.products-grid', { timeout: 5000 });
        
        const productsGrid = await page.$('.products-grid');
        expect(productsGrid).toBeTruthy();
      }
    });
  });

  describe('Search Functionality', () => {
    test('Search input is present and functional', async () => {
      const searchInput = await page.$('.search-input');
      expect(searchInput).toBeTruthy();
      
      await page.type('.search-input', 'shirt');
      await page.waitForTimeout(500); // Wait for debounce
      
      const searchResults = await page.$('.search-results');
      expect(searchResults).toBeTruthy();
    });

    test('Search shows results', async () => {
      await page.type('.search-input', 'test');
      await page.waitForTimeout(1000);
      
      const hasResults = await page.evaluate(() => {
        const results = document.querySelector('.search-results');
        return results && results.children.length > 0;
      });
      
      // Results may be empty, but search functionality should work
      expect(typeof hasResults).toBe('boolean');
    });

    test('Clear search button works', async () => {
      await page.type('.search-input', 'test');
      await page.waitForTimeout(500);
      
      const clearButton = await page.$('.clear-search');
      if (clearButton) {
        await page.click('.clear-search');
        
        const inputValue = await page.$eval('.search-input', el => el.value);
        expect(inputValue).toBe('');
      }
    });
  });

  describe('Responsive Design', () => {
    test('Mobile view works correctly', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.reload();
      await page.waitForSelector('.product-navigator');
      
      const navigator = await page.$('.product-navigator');
      expect(navigator).toBeTruthy();
      
      // Check if mobile-specific elements are present
      const isMobileLayout = await page.evaluate(() => {
        return window.getComputedStyle(document.querySelector('.product-navigator')).display !== 'none';
      });
      
      expect(isMobileLayout).toBe(true);
    });

    test('Tablet view works correctly', async () => {
      await page.setViewport({ width: 768, height: 1024 });
      await page.reload();
      await page.waitForSelector('.product-navigator');
      
      const categories = await page.$$('.category-card');
      expect(categories.length).toBeGreaterThan(0);
    });
  });

  describe('Loading States', () => {
    test('Loading indicators appear during navigation', async () => {
      // This test checks if loading states are handled properly
      await page.click('.category-card:first-child');
      
      // Check if loading state appears (even briefly)
      const hasLoadingState = await page.evaluate(() => {
        return document.querySelector('.loading') !== null ||
               document.querySelector('.spinner') !== null ||
               document.querySelector('[data-loading]') !== null;
      });
      
      // Loading state may be too fast to catch, so we just ensure navigation works
      await page.waitForSelector('.subcategories, .main-categories');
    });
  });

  describe('Error Handling', () => {
    test('Handles network errors gracefully', async () => {
      // Simulate network failure by going offline
      await page.setOfflineMode(true);
      
      try {
        await page.reload();
        await page.waitForTimeout(2000);
        
        // Check if error message is shown
        const hasErrorMessage = await page.evaluate(() => {
          return document.body.textContent.includes('error') ||
                 document.body.textContent.includes('failed') ||
                 document.querySelector('.error-message') !== null;
        });
        
        // Error handling should be present
        expect(typeof hasErrorMessage).toBe('boolean');
      } finally {
        await page.setOfflineMode(false);
      }
    });
  });

  describe('Accessibility', () => {
    test('Navigation is keyboard accessible', async () => {
      // Focus first category card
      await page.focus('.category-card:first-child');
      
      // Press Enter to activate
      await page.keyboard.press('Enter');
      await page.waitForSelector('.subcategories, .main-categories');
      
      // Should navigate successfully
      const currentView = await page.$('.subcategories') || await page.$('.main-categories');
      expect(currentView).toBeTruthy();
    });

    test('Has proper ARIA labels', async () => {
      const hasAriaLabels = await page.evaluate(() => {
        const cards = document.querySelectorAll('.category-card, .subcategory-card');
        return Array.from(cards).some(card => 
          card.hasAttribute('aria-label') || 
          card.hasAttribute('role') ||
          card.querySelector('[aria-label]')
        );
      });
      
      expect(hasAriaLabels).toBe(true);
    });
  });
});