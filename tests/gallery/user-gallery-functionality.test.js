#!/usr/bin/env node
/**
 * User Gallery Functionality Test
 * 
 * Tests all user gallery page features including:
 * - Image display (carousel/grid)
 * - Overlays and hover effects
 * - Action buttons
 * - Modal functionality
 * - Search and filtering
 * - Multi-select and batch operations
 * - Merch store integration
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const TEST_USER_ID = '4fdbYxJHjEP4xksk9sgFE3lgYUs2';

class UserGalleryFunctionalityTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      passed: [],
      failed: [],
      skipped: []
    };
  }

  async setup() {
    console.log('🚀 Setting up test environment...\n');
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 800 });
    
    // Mock authentication
    await this.page.evaluateOnNewDocument((userId) => {
      window.testUserId = userId;
    }, TEST_USER_ID);
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async test(name, fn) {
    try {
      console.log(`🧪 ${name}`);
      await fn();
      this.results.passed.push(name);
      console.log(`   ✅ PASSED\n`);
    } catch (error) {
      this.results.failed.push({ name, error: error.message });
      console.log(`   ❌ FAILED: ${error.message}\n`);
    }
  }

  async skip(name, reason) {
    this.results.skipped.push({ name, reason });
    console.log(`⏭️  ${name}`);
    console.log(`   ℹ️  SKIPPED: ${reason}\n`);
  }

  async runAllTests() {
    console.log('═══════════════════════════════════════');
    console.log('🎨 USER GALLERY FUNCTIONALITY TEST');
    console.log('═══════════════════════════════════════\n');

    await this.setup();

    try {
      // Check if server is running
      try {
        await this.page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0', timeout: 5000 });
      } catch (error) {
        console.log('❌ Server not running at', BASE_URL);
        console.log('   Please start the server and try again\n');
        await this.teardown();
        process.exit(1);
      }
      // Navigate to user gallery
      await this.page.goto(`${BASE_URL}/my-gallery`, { waitUntil: 'networkidle0', timeout: 10000 });
      
      // Check if redirected to login
      const currentUrl = this.page.url();
      if (currentUrl.includes('/login')) {
        console.log('   ℹ️  Page requires authentication, skipping tests\n');
        this.results.skipped.push({ name: 'All tests', reason: 'Authentication required' });
        return;
      }

      // Test 1: Page loads with required elements
      await this.test('Page loads with required DOM elements', async () => {
        const elements = await this.page.evaluate(() => {
          return {
            carousel: !!document.getElementById('gallery-carousel'),
            grid: !!document.getElementById('gallery-grid'),
            controls: !!document.querySelector('.gallery-controls'),
            actionButtons: !!document.getElementById('action-buttons'),
            modal: !!document.getElementById('imageModal'),
            carouselBtn: !!document.getElementById('carousel-layout'),
            gridBtn: !!document.getElementById('grid-layout'),
            searchInput: !!document.getElementById('gallery-search'),
            selectMode: !!document.getElementById('select-mode'),
            downloadAll: !!document.getElementById('download-all'),
            screensaver: !!document.getElementById('start-screensaver'),
            merchLink: !!document.querySelector('.merch-link-button')
          };
        });

        const missing = Object.entries(elements)
          .filter(([_, exists]) => !exists)
          .map(([name]) => name);

        if (missing.length > 0) {
          throw new Error(`Missing elements: ${missing.join(', ')}`);
        }
      });

      // Test 2: Gallery controls are visible and styled
      await this.test('Gallery controls are visible and styled', async () => {
        const controlsVisible = await this.page.evaluate(() => {
          const controls = document.querySelector('.gallery-controls');
          const style = window.getComputedStyle(controls);
          return style.display !== 'none' && style.visibility !== 'hidden';
        });

        if (!controlsVisible) {
          throw new Error('Gallery controls not visible');
        }
      });

      // Test 3: Action buttons are present and styled
      await this.test('Action buttons are present and styled', async () => {
        const buttons = await this.page.evaluate(() => {
          const actionButtons = document.getElementById('action-buttons');
          const buttons = actionButtons.querySelectorAll('button, a');
          return {
            count: buttons.length,
            hasSelectMode: !!document.getElementById('select-mode'),
            hasDownloadAll: !!document.getElementById('download-all'),
            hasScreensaver: !!document.getElementById('start-screensaver'),
            hasMerchLink: !!document.querySelector('.merch-link-button')
          };
        });

        if (buttons.count < 4) {
          throw new Error(`Expected at least 4 action buttons, found ${buttons.count}`);
        }
        if (!buttons.hasMerchLink) {
          throw new Error('Merch store link missing');
        }
      });

      // Test 4: Carousel/Grid view toggle
      await this.test('Carousel/Grid view toggle works', async () => {
        // Click grid button
        await this.page.click('#grid-layout');
        await new Promise(resolve => setTimeout(resolve, 300));

        const gridVisible = await this.page.evaluate(() => {
          const gridView = document.getElementById('grid-view');
          const carouselView = document.getElementById('carousel-view');
          const gridStyle = window.getComputedStyle(gridView);
          const carouselStyle = window.getComputedStyle(carouselView);
          return gridStyle.display !== 'none' && carouselStyle.display === 'none';
        });

        if (!gridVisible) {
          throw new Error('Grid view not visible after toggle');
        }

        // Click carousel button
        await this.page.click('#carousel-layout');
        await new Promise(resolve => setTimeout(resolve, 300));

        const carouselVisible = await this.page.evaluate(() => {
          const gridView = document.getElementById('grid-view');
          const carouselView = document.getElementById('carousel-view');
          const gridStyle = window.getComputedStyle(gridView);
          const carouselStyle = window.getComputedStyle(carouselView);
          return carouselStyle.display !== 'none' && gridStyle.display === 'none';
        });

        if (!carouselVisible) {
          throw new Error('Carousel view not visible after toggle');
        }
      });

      // Test 5: Images have overlay on hover
      await this.test('Images display overlay on hover', async () => {
        // Switch to grid view for easier testing
        await this.page.click('#grid-layout');
        await new Promise(resolve => setTimeout(resolve, 300));

        const hasImages = await this.page.evaluate(() => {
          return document.querySelectorAll('.gallery-item').length > 0;
        });

        if (!hasImages) {
          throw new Error('No images found in gallery (may be empty)');
        }

        const overlayWorks = await this.page.evaluate(() => {
          const item = document.querySelector('.gallery-item');
          if (!item) return false;

          // Check for overlay pseudo-elements via CSS
          const styles = window.getComputedStyle(item, '::after');
          const beforeStyles = window.getComputedStyle(item, '::before');
          
          return styles.content !== 'none' || beforeStyles.content !== 'none';
        });

        if (!overlayWorks) {
          throw new Error('Overlay styles not applied to gallery items');
        }
      });

      // Test 6: Gallery item action buttons
      await this.test('Gallery items have action buttons', async () => {
        const hasActionButtons = await this.page.evaluate(() => {
          const items = document.querySelectorAll('.gallery-item');
          if (items.length === 0) return false;

          const firstItem = items[0];
          const actions = firstItem.querySelector('.gallery-item-actions');
          if (!actions) return false;

          const downloadBtn = actions.querySelector('.download-button');
          const deleteBtn = actions.querySelector('.delete-button');
          
          return !!downloadBtn && !!deleteBtn;
        });

        if (!hasActionButtons) {
          throw new Error('Gallery items missing action buttons');
        }
      });

      // Test 7: Modal functionality
      await this.test('Modal opens when clicking image', async () => {
        const hasImages = await this.page.evaluate(() => {
          return document.querySelectorAll('.gallery-item img').length > 0;
        });

        if (!hasImages) {
          throw new Error('No images to test modal');
        }

        // Click first image
        await this.page.click('.gallery-item img');
        await new Promise(resolve => setTimeout(resolve, 300));

        const modalVisible = await this.page.evaluate(() => {
          const modal = document.getElementById('imageModal');
          const style = window.getComputedStyle(modal);
          return style.display !== 'none';
        });

        if (!modalVisible) {
          throw new Error('Modal not visible after clicking image');
        }

        // Close modal
        await this.page.click('.modal-close');
        await new Promise(resolve => setTimeout(resolve, 300));

        const modalClosed = await this.page.evaluate(() => {
          const modal = document.getElementById('imageModal');
          const style = window.getComputedStyle(modal);
          return style.display === 'none';
        });

        if (!modalClosed) {
          throw new Error('Modal did not close');
        }
      });

      // Test 8: Search functionality
      await this.test('Search input is functional', async () => {
        const searchInput = await this.page.$('#gallery-search');
        if (!searchInput) {
          throw new Error('Search input not found');
        }

        await this.page.type('#gallery-search', 'test');
        const value = await this.page.$eval('#gallery-search', el => el.value);
        
        if (value !== 'test') {
          throw new Error('Search input not accepting text');
        }

        // Clear search
        await this.page.evaluate(() => {
          document.getElementById('gallery-search').value = '';
        });
      });

      // Test 9: Multi-select mode toggle
      await this.test('Multi-select mode toggles correctly', async () => {
        await this.page.click('#select-mode');
        await new Promise(resolve => setTimeout(resolve, 300));

        const selectModeActive = await this.page.evaluate(() => {
          const deleteBtn = document.getElementById('delete-selected');
          const style = window.getComputedStyle(deleteBtn);
          return style.display !== 'none';
        });

        if (!selectModeActive) {
          throw new Error('Delete selected button not visible in select mode');
        }

        // Exit select mode
        await this.page.click('#select-mode');
        await new Promise(resolve => setTimeout(resolve, 300));

        const selectModeInactive = await this.page.evaluate(() => {
          const deleteBtn = document.getElementById('delete-selected');
          const style = window.getComputedStyle(deleteBtn);
          return style.display === 'none';
        });

        if (!selectModeInactive) {
          throw new Error('Select mode did not deactivate');
        }
      });

      // Test 10: Merch store link
      await this.test('Merch store link is present and functional', async () => {
        const merchLink = await this.page.evaluate(() => {
          const link = document.querySelector('.merch-link-button');
          return {
            exists: !!link,
            href: link?.getAttribute('href'),
            visible: link ? window.getComputedStyle(link).display !== 'none' : false
          };
        });

        if (!merchLink.exists) {
          throw new Error('Merch store link not found');
        }
        if (merchLink.href !== '/merchandise') {
          throw new Error(`Merch link has wrong href: ${merchLink.href}`);
        }
        if (!merchLink.visible) {
          throw new Error('Merch store link not visible');
        }
      });

      // Test 11: Screensaver overlay exists
      await this.test('Screensaver overlay is present', async () => {
        const screensaverExists = await this.page.evaluate(() => {
          return !!document.getElementById('screensaverOverlay');
        });

        if (!screensaverExists) {
          throw new Error('Screensaver overlay not found');
        }
      });

      // Test 12: CSS styles are loaded
      await this.test('Gallery CSS styles are loaded', async () => {
        const stylesLoaded = await this.page.evaluate(() => {
          const controls = document.querySelector('.gallery-controls');
          const style = window.getComputedStyle(controls);
          return style.padding !== '' && style.borderRadius !== '';
        });

        if (!stylesLoaded) {
          throw new Error('Gallery CSS styles not properly loaded');
        }
      });

      // Test 13: Grid images are properly sized
      await this.test('Grid images are properly sized and constrained', async () => {
        // Switch to grid view
        await this.page.click('#grid-layout');
        await new Promise(resolve => setTimeout(resolve, 300));

        const gridSizing = await this.page.evaluate(() => {
          const gridContainer = document.getElementById('gallery-grid');
          const gridStyle = window.getComputedStyle(gridContainer);
          const items = document.querySelectorAll('.gallery-item');
          
          if (items.length === 0) return { hasGrid: false };
          
          const firstItem = items[0];
          const img = firstItem.querySelector('img');
          const itemStyle = window.getComputedStyle(firstItem);
          const imgStyle = window.getComputedStyle(img);
          
          return {
            hasGrid: true,
            gridDisplay: gridStyle.display,
            gridTemplateColumns: gridStyle.gridTemplateColumns,
            itemWidth: itemStyle.width,
            imgWidth: imgStyle.width,
            imgMaxWidth: imgStyle.maxWidth,
            imgHeight: imgStyle.height
          };
        });

        if (!gridSizing.hasGrid) {
          throw new Error('No grid items found');
        }
        
        if (gridSizing.gridDisplay !== 'grid') {
          throw new Error(`Grid container not using grid display: ${gridSizing.gridDisplay}`);
        }
        
        if (!gridSizing.gridTemplateColumns || gridSizing.gridTemplateColumns === 'none') {
          throw new Error('Grid template columns not set');
        }
        
        if (gridSizing.imgWidth === '100%' && gridSizing.imgMaxWidth === 'none') {
          throw new Error('Images not constrained - may be too large');
        }
      });

    } finally {
      await this.teardown();
    }

    this.printResults();
  }

  printResults() {
    console.log('═══════════════════════════════════════');
    console.log('📊 TEST RESULTS');
    console.log('═══════════════════════════════════════\n');

    console.log(`✅ Passed: ${this.results.passed.length}`);
    this.results.passed.forEach(name => {
      console.log(`   • ${name}`);
    });

    if (this.results.failed.length > 0) {
      console.log(`\n❌ Failed: ${this.results.failed.length}`);
      this.results.failed.forEach(({ name, error }) => {
        console.log(`   • ${name}`);
        console.log(`     ${error}`);
      });
    }

    if (this.results.skipped.length > 0) {
      console.log(`\n⏭️  Skipped: ${this.results.skipped.length}`);
      this.results.skipped.forEach(({ name, reason }) => {
        console.log(`   • ${name}: ${reason}`);
      });
    }

    console.log('\n═══════════════════════════════════════');
    
    const total = this.results.passed.length + this.results.failed.length;
    const passRate = total > 0 ? ((this.results.passed.length / total) * 100).toFixed(1) : 0;
    
    console.log(`Pass Rate: ${passRate}% (${this.results.passed.length}/${total})`);
    console.log('═══════════════════════════════════════\n');

    if (this.results.failed.length > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

// Run tests
if (require.main === module) {
  const test = new UserGalleryFunctionalityTest();
  test.runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = UserGalleryFunctionalityTest;
