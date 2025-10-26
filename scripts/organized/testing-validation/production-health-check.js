#!/usr/bin/env node

/**
 * Production Health Check Suite
 * 
 * Comprehensive anonymous browsing tests to validate key functionality
 * on the live production site without authentication requirements.
 */

import puppeteer from 'puppeteer';
import axios from 'axios';

const PRODUCTION_URL = 'https://vh9x3gevev.us-east-1.awsapprunner.com';
const TEST_TIMEOUT = 30000; // 30 seconds per test

class ProductionHealthCheck {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
    this.startTime = Date.now();
  }

  /**
   * Initialize browser and page
   */
  async initialize() {
    console.log('🚀 Production Health Check Suite');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🌐 Testing: ${PRODUCTION_URL}`);
    console.log(`⏰ Started: ${new Date().toLocaleString()}\n`);

    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Set viewport and user agent
    await this.page.setViewport({ width: 1280, height: 720 });
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Enable request/response logging for debugging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`   ⚠️  Console Error: ${msg.text()}`);
      }
    });
  }

  /**
   * Log test result
   */
  logResult(test, success, details = '', duration = 0) {
    const result = { test, success, details, duration };
    this.results.push(result);
    
    const status = success ? '✅' : '❌';
    const time = duration > 0 ? ` (${duration}ms)` : '';
    console.log(`${status} ${test}${time}`);
    if (details) {
      console.log(`   ${details}`);
    }
  }

  /**
   * Test 1: Home Page Load
   */
  async testHomePage() {
    try {
      const start = Date.now();
      const response = await this.page.goto(PRODUCTION_URL, { 
        waitUntil: 'networkidle2',
        timeout: TEST_TIMEOUT 
      });
      
      const duration = Date.now() - start;
      const title = await this.page.title();
      
      if (response.status() === 200 && title.includes('Wavelength')) {
        this.logResult('Home Page Load', true, `Title: "${title}"`, duration);
        return true;
      } else {
        this.logResult('Home Page Load', false, `Status: ${response.status()}, Title: "${title}"`);
        return false;
      }
    } catch (error) {
      this.logResult('Home Page Load', false, `Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Test 2: Radio Player Load and Functionality
   */
  async testRadioPlayer() {
    try {
      const start = Date.now();
      
      // Navigate to radio page
      await this.page.goto(`${PRODUCTION_URL}/radio`, { 
        waitUntil: 'networkidle2',
        timeout: TEST_TIMEOUT 
      });
      
      // Wait for radio player to load
      await this.page.waitForSelector('.radio-player, #radioPlayer, .music-player', { timeout: 10000 });
      
      // Check if play button exists
      const playButton = await this.page.$('.play-button, .radio-play, #playButton, button[title*="play"], button[aria-label*="play"]');
      
      // Test radio widget functionality
      const radioWidget = await this.page.$('.radio-widget, .persistent-player, .mini-player');
      
      const duration = Date.now() - start;
      
      if (playButton && radioWidget) {
        this.logResult('Radio Player Load', true, 'Player and widget found, controls available', duration);
        return true;
      } else if (playButton) {
        this.logResult('Radio Player Load', true, 'Player found, widget may be minimized', duration);
        return true;
      } else {
        this.logResult('Radio Player Load', false, 'Play controls not found');
        return false;
      }
    } catch (error) {
      this.logResult('Radio Player Load', false, `Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Test 3: Hero Gallery Navigation
   */
  async testHeroGalleryNavigation() {
    try {
      const start = Date.now();
      
      // Go back to home page
      await this.page.goto(PRODUCTION_URL, { 
        waitUntil: 'networkidle2',
        timeout: TEST_TIMEOUT 
      });
      
      // Look for gallery link or hero image
      const galleryLink = await this.page.$('a[href*="/gallery"], a[href*="/characters"], .hero-gallery a, .carousel a');
      
      if (!galleryLink) {
        this.logResult('Hero Gallery Navigation', false, 'No gallery/hero links found on home page');
        return false;
      }
      
      // Click the gallery link
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: TEST_TIMEOUT }),
        galleryLink.click()
      ]);
      
      // Check if we're on a gallery or character page
      const currentUrl = this.page.url();
      const pageTitle = await this.page.title();
      
      const duration = Date.now() - start;
      
      if (currentUrl.includes('/gallery') || currentUrl.includes('/characters') || pageTitle.includes('Gallery') || pageTitle.includes('Characters')) {
        this.logResult('Hero Gallery Navigation', true, `Navigated to: ${currentUrl}`, duration);
        return true;
      } else {
        this.logResult('Hero Gallery Navigation', false, `Unexpected destination: ${currentUrl}`);
        return false;
      }
    } catch (error) {
      this.logResult('Hero Gallery Navigation', false, `Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Test 4: Character/Episode Page Load
   */
  async testContentPageLoad() {
    try {
      const start = Date.now();
      
      // Try to navigate to a known character or episode page
      const testUrls = [
        `${PRODUCTION_URL}/characters/andrew`,
        `${PRODUCTION_URL}/characters/jewel`,
        `${PRODUCTION_URL}/episodes/season1/episode1`,
        `${PRODUCTION_URL}/characters`,
        `${PRODUCTION_URL}/episodes`
      ];
      
      let success = false;
      let successUrl = '';
      
      for (const url of testUrls) {
        try {
          const response = await this.page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 15000 
          });
          
          if (response.status() === 200) {
            const title = await this.page.title();
            if (title && !title.toLowerCase().includes('error')) {
              success = true;
              successUrl = url;
              break;
            }
          }
        } catch (err) {
          // Continue to next URL
          continue;
        }
      }
      
      const duration = Date.now() - start;
      
      if (success) {
        this.logResult('Content Page Load', true, `Successfully loaded: ${successUrl}`, duration);
        return true;
      } else {
        this.logResult('Content Page Load', false, 'No content pages loaded successfully');
        return false;
      }
    } catch (error) {
      this.logResult('Content Page Load', false, `Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Test 5: Cross-Site Navigation
   */
  async testCrossSiteNavigation() {
    try {
      const start = Date.now();
      
      // Start from home
      await this.page.goto(PRODUCTION_URL, { 
        waitUntil: 'networkidle2',
        timeout: TEST_TIMEOUT 
      });
      
      // Look for navigation menu
      const navLinks = await this.page.$$('nav a, .nav a, .navigation a, header a');
      
      if (navLinks.length === 0) {
        this.logResult('Cross-Site Navigation', false, 'No navigation links found');
        return false;
      }
      
      // Test a few navigation links
      let successfulNavs = 0;
      const maxTests = Math.min(3, navLinks.length);
      
      for (let i = 0; i < maxTests; i++) {
        try {
          const link = navLinks[i];
          const href = await link.evaluate(el => el.getAttribute('href'));
          
          if (href && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.includes('javascript:')) {
            await Promise.all([
              this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }),
              link.click()
            ]);
            
            const newUrl = this.page.url();
            if (newUrl !== PRODUCTION_URL) {
              successfulNavs++;
            }
            
            // Go back for next test
            await this.page.goBack({ waitUntil: 'networkidle2', timeout: 10000 });
          }
        } catch (err) {
          // Continue to next link
          continue;
        }
      }
      
      const duration = Date.now() - start;
      
      if (successfulNavs > 0) {
        this.logResult('Cross-Site Navigation', true, `${successfulNavs}/${maxTests} navigation links working`, duration);
        return true;
      } else {
        this.logResult('Cross-Site Navigation', false, 'No navigation links worked');
        return false;
      }
    } catch (error) {
      this.logResult('Cross-Site Navigation', false, `Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Test 6: API Health Check
   */
  async testAPIHealth() {
    try {
      const start = Date.now();
      
      // Test basic API endpoints
      const apiTests = [
        { url: `${PRODUCTION_URL}/api/deployment/status`, name: 'Deployment Status' },
        { url: `${PRODUCTION_URL}/api/episodes`, name: 'Episodes API' }
      ];
      
      let successCount = 0;
      const results = [];
      
      for (const test of apiTests) {
        try {
          const response = await axios.get(test.url, { timeout: 10000 });
          if (response.status === 200) {
            successCount++;
            results.push(`${test.name}: ✅`);
          } else {
            results.push(`${test.name}: ${response.status}`);
          }
        } catch (error) {
          results.push(`${test.name}: Error`);
        }
      }
      
      const duration = Date.now() - start;
      
      if (successCount > 0) {
        this.logResult('API Health Check', true, `${successCount}/${apiTests.length} endpoints working`, duration);
        return true;
      } else {
        this.logResult('API Health Check', false, 'No API endpoints responding');
        return false;
      }
    } catch (error) {
      this.logResult('API Health Check', false, `Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Test 7: Static Asset Loading
   */
  async testStaticAssets() {
    try {
      const start = Date.now();
      
      // Go to home page and check for assets
      await this.page.goto(PRODUCTION_URL, { 
        waitUntil: 'networkidle2',
        timeout: TEST_TIMEOUT 
      });
      
      // Check for CSS
      const cssLoaded = await this.page.evaluate(() => {
        const stylesheets = document.styleSheets;
        return stylesheets.length > 0;
      });
      
      // Check for images
      const imagesLoaded = await this.page.evaluate(() => {
        const images = document.images;
        let loadedCount = 0;
        for (let img of images) {
          if (img.complete && img.naturalWidth > 0) {
            loadedCount++;
          }
        }
        return { total: images.length, loaded: loadedCount };
      });
      
      const duration = Date.now() - start;
      
      if (cssLoaded && imagesLoaded.loaded > 0) {
        this.logResult('Static Asset Loading', true, `CSS loaded, ${imagesLoaded.loaded}/${imagesLoaded.total} images loaded`, duration);
        return true;
      } else {
        this.logResult('Static Asset Loading', false, `CSS: ${cssLoaded}, Images: ${imagesLoaded.loaded}/${imagesLoaded.total}`);
        return false;
      }
    } catch (error) {
      this.logResult('Static Asset Loading', false, `Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Run all health checks
   */
  async runAllTests() {
    await this.initialize();
    
    const tests = [
      () => this.testHomePage(),
      () => this.testRadioPlayer(),
      () => this.testHeroGalleryNavigation(),
      () => this.testContentPageLoad(),
      () => this.testCrossSiteNavigation(),
      () => this.testAPIHealth(),
      () => this.testStaticAssets()
    ];
    
    console.log('📋 Running Health Checks...\n');
    
    for (const test of tests) {
      await test();
    }
    
    await this.cleanup();
    this.displaySummary();
  }

  /**
   * Cleanup browser resources
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  /**
   * Display final summary
   */
  displaySummary() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = Date.now() - this.startTime;
    
    console.log('\n📊 Health Check Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    console.log(`⏱️  Total Time: ${Math.round(totalDuration / 1000)}s`);
    
    if (failedTests === 0) {
      console.log('\n🎉 All health checks passed! Production is healthy.');
    } else if (passedTests >= totalTests * 0.8) {
      console.log('\n⚠️  Most checks passed, but some issues detected. Investigation recommended.');
    } else {
      console.log('\n🚨 Multiple health checks failed. Immediate investigation required!');
    }
    
    console.log(`\n🌐 Site: ${PRODUCTION_URL}`);
    console.log(`📅 Completed: ${new Date().toLocaleString()}`);
    
    // Exit with appropriate code
    process.exit(failedTests === 0 ? 0 : 1);
  }
}

// CLI interface
async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
🏥 Production Health Check Suite

Usage:
  node production-health-check.js

Tests:
  ✓ Home page load and rendering
  ✓ Radio player functionality  
  ✓ Hero gallery navigation
  ✓ Content page accessibility
  ✓ Cross-site navigation
  ✓ API endpoint health
  ✓ Static asset loading

Options:
  --help, -h     Show this help message
`);
    process.exit(0);
  }

  const healthCheck = new ProductionHealthCheck();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n⚠️  Health check interrupted by user');
    await healthCheck.cleanup();
    process.exit(1);
  });
  
  try {
    await healthCheck.runAllTests();
  } catch (error) {
    console.error('❌ Fatal error during health check:', error.message);
    await healthCheck.cleanup();
    process.exit(1);
  }
}

// ES module compatibility - check if this is the main module
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  main().catch(console.error);
}

export default ProductionHealthCheck;