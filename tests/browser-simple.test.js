/**
 * Simple Browser Tests for Tiered Product System
 * Tests UI functionality using Puppeteer
 */

const puppeteer = require('puppeteer');

describe('Tiered Product System Browser Tests', () => {
  let browser, page;
  const BASE_URL = 'http://localhost:3001';

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

  describe('Page Loading', () => {
    test('Product selection page loads successfully', async () => {
      await page.goto(`${BASE_URL}/product-selection`);
      
      const title = await page.title();
      expect(title).toContain('Select Your Product');
      
      await page.waitForSelector('#product-navigator', { timeout: 10000 });
      const navigator = await page.$('#product-navigator');
      expect(navigator).toBeTruthy();
    });

    test('Page contains required elements', async () => {
      await page.goto(`${BASE_URL}/product-selection`);
      await page.waitForSelector('#product-navigator');
      
      const hasTitle = await page.$('h1');
      expect(hasTitle).toBeTruthy();
      
      const titleText = await page.$eval('h1', el => el.textContent);
      expect(titleText).toContain('Choose Your Product');
    });
  });

  describe('Navigation Elements', () => {
    beforeEach(async () => {
      await page.goto(`${BASE_URL}/product-selection`);
      await page.waitForSelector('#product-navigator', { timeout: 10000 });
    });

    test('Page has navigation elements', async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const elements = await page.$$('.back-button, .main-container, .selection-status');
      expect(elements.length).toBeGreaterThan(0);
    });

    test('Navigation container is present', async () => {
      const navContainer = await page.$('#product-navigator');
      expect(navContainer).toBeTruthy();
    });
  });

  describe('Responsive Design', () => {
    test('Mobile view works', async () => {
      await page.setViewport({ width: 375, height: 667 });
      await page.goto(`${BASE_URL}/product-selection`);
      await page.waitForSelector('#product-navigator');
      
      const navigator = await page.$('#product-navigator');
      expect(navigator).toBeTruthy();
    });

    test('Tablet view works', async () => {
      await page.setViewport({ width: 768, height: 1024 });
      await page.goto(`${BASE_URL}/product-selection`);
      await page.waitForSelector('#product-navigator');
      
      const navigator = await page.$('#product-navigator');
      expect(navigator).toBeTruthy();
    });
  });

  describe('JavaScript Loading', () => {
    test('No JavaScript errors on page load', async () => {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      
      await page.goto(`${BASE_URL}/product-selection`);
      await page.waitForSelector('#product-navigator');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      expect(errors).toEqual([]);
    });

    test('Product navigator has content', async () => {
      await page.goto(`${BASE_URL}/product-selection`);
      await page.waitForSelector('#product-navigator');
      
      const hasContent = await page.evaluate(() => {
        const nav = document.querySelector('#product-navigator');
        return nav && nav.innerHTML.length > 0;
      });
      
      expect(hasContent).toBe(true);
    });
  });
});